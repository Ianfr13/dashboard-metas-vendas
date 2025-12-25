# Arquitetura de Segurança - Supabase

## 🏗️ Diagrama da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│                    (React + Vite)                           │
│                                                             │
│  ┌───────────────────────────────────────────────────┐    │
│  │  client/src/lib/supabase.ts                       │    │
│  │                                                    │    │
│  │  ✅ VITE_SUPABASE_URL                             │    │
│  │  ✅ VITE_SUPABASE_ANON_KEY                        │    │
│  │                                                    │    │
│  │  const supabase = createClient(url, anonKey)      │    │
│  └───────────────────────────────────────────────────┘    │
│                          │                                  │
└──────────────────────────┼──────────────────────────────────┘
                           │
                           │ HTTPS + JWT
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE CLOUD                           │
│                                                             │
│  ┌──────────────────────────────────────────────────┐     │
│  │  Row Level Security (RLS)                        │     │
│  │                                                   │     │
│  │  ✅ Valida JWT do usuário                        │     │
│  │  ✅ Aplica políticas de acesso                   │     │
│  │  ✅ Filtra dados por user_id                     │     │
│  │  ✅ Bloqueia acesso não autorizado               │     │
│  └──────────────────────────────────────────────────┘     │
│                          │                                  │
│                          ▼                                  │
│  ┌──────────────────────────────────────────────────┐     │
│  │  PostgreSQL Database                             │     │
│  │                                                   │     │
│  │  📊 users, simulation_params, goals, etc.        │     │
│  └──────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                           ▲
                           │
                           │ HTTPS + JWT
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                          │                                  │
│                      BACKEND                                │
│                 (Node.js + Express)                         │
│                                                             │
│  ┌───────────────────────────────────────────────────┐    │
│  │  server/supabase.ts                               │    │
│  │                                                    │    │
│  │  ✅ SUPABASE_URL                                  │    │
│  │  ✅ SUPABASE_ANON_KEY                             │    │
│  │  ⚠️  SUPABASE_SERVICE_ROLE_KEY (opcional)         │    │
│  │                                                    │    │
│  │  const supabase = createClient(url, anonKey)      │    │
│  └───────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🔑 Fluxo de Autenticação

```
┌─────────┐
│ Usuário │
└────┬────┘
     │
     │ 1. Login (email/senha ou OAuth)
     ▼
┌─────────────────┐
│  Supabase Auth  │
│                 │
│  ✅ Valida      │
│  ✅ Gera JWT    │
└────┬────────────┘
     │
     │ 2. JWT Token
     ▼
┌─────────────────┐
│   Frontend      │
│                 │
│  💾 Salva JWT   │
│  no localStorage│
└────┬────────────┘
     │
     │ 3. Requisições com JWT no header
     ▼
┌─────────────────┐
│  Supabase RLS   │
│                 │
│  🔍 Valida JWT  │
│  🔒 Aplica RLS  │
│  ✅ Retorna     │
│     dados       │
└─────────────────┘
```

## 🛡️ Camadas de Segurança

### Camada 1: Anon Key (Pública)
```
Função: Identificar o projeto Supabase
Segurança: Baixa (mas protegida por RLS)
Exposição: ✅ Pode ser exposta no frontend
Permissões: Limitadas pelas políticas RLS
```

### Camada 2: JWT Token (Usuário)
```
Função: Autenticar o usuário
Segurança: Alta (assinado pelo Supabase)
Exposição: ✅ Armazenado no localStorage
Permissões: Acesso aos próprios dados
Validade: Expira automaticamente
```

### Camada 3: Row Level Security (RLS)
```
Função: Controlar acesso aos dados
Segurança: Muito Alta (nível do banco)
Exposição: N/A (server-side)
Permissões: Definidas por políticas SQL
Bypass: Apenas com service role key
```

### Camada 4: Service Role Key (Admin)
```
Função: Operações administrativas
Segurança: Máxima (acesso total)
Exposição: ❌ NUNCA expor no frontend
Permissões: Bypass completo do RLS
Uso: Apenas backend/scripts
```

## 📋 Matriz de Permissões

| Operação | Anon Key | JWT User | Service Role |
|----------|----------|----------|--------------|
| Ver próprios dados | ❌ | ✅ | ✅ |
| Ver dados de outros | ❌ | ❌ | ✅ |
| Criar próprios dados | ❌ | ✅ | ✅ |
| Editar próprios dados | ❌ | ✅ | ✅ |
| Deletar próprios dados | ❌ | ✅ | ✅ |
| Operações admin | ❌ | ❌ | ✅ |
| Bypass RLS | ❌ | ❌ | ✅ |

## 🔒 Políticas RLS Implementadas

### Exemplo: Tabela `users`

```sql
-- Política 1: Usuários podem ver seus próprios dados
CREATE POLICY "Users can view own data" 
ON users FOR SELECT 
USING (auth.uid()::text = open_id);

-- Política 2: Usuários podem atualizar seus próprios dados
CREATE POLICY "Users can update own data" 
ON users FOR UPDATE 
USING (auth.uid()::text = open_id);
```

### Exemplo: Tabela `simulation_params`

```sql
-- Política 1: Usuários podem ver suas simulações
CREATE POLICY "Users can view own simulations" 
ON simulation_params FOR SELECT 
USING (auth.uid()::text = (SELECT open_id FROM users WHERE id = user_id));

-- Política 2: Usuários podem criar simulações
CREATE POLICY "Users can create simulations" 
ON simulation_params FOR INSERT 
WITH CHECK (auth.uid()::text = (SELECT open_id FROM users WHERE id = user_id));
```

## ✅ Checklist de Segurança

### Configuração Atual

- [x] Anon key usada no frontend
- [x] Anon key usada no backend
- [x] Service role key NÃO exposta
- [x] RLS habilitado em todas as tabelas
- [x] Políticas de acesso implementadas
- [x] JWT gerenciado automaticamente
- [x] Sessão persistida com segurança
- [x] HTTPS em produção
- [x] Variáveis de ambiente documentadas
- [x] `.env` no `.gitignore`

### Boas Práticas Seguidas

- [x] Princípio do menor privilégio
- [x] Defesa em profundidade (múltiplas camadas)
- [x] Autenticação obrigatória
- [x] Autorização no nível do banco
- [x] Tokens com expiração
- [x] Logs de acesso habilitados
- [x] Documentação de segurança completa

## 🚨 Cenários de Ataque e Defesas

### Cenário 1: Atacante obtém Anon Key
**Risco:** Baixo  
**Defesa:** RLS bloqueia acesso não autorizado  
**Resultado:** ✅ Seguro

### Cenário 2: Atacante obtém JWT de outro usuário
**Risco:** Médio  
**Defesa:** JWT expira automaticamente, HTTPS previne interceptação  
**Resultado:** ✅ Seguro (com HTTPS)

### Cenário 3: Atacante tenta SQL Injection
**Risco:** Baixo  
**Defesa:** Supabase usa prepared statements  
**Resultado:** ✅ Seguro

### Cenário 4: Atacante obtém Service Role Key
**Risco:** **CRÍTICO**  
**Defesa:** Key nunca exposta no frontend  
**Resultado:** ✅ Seguro (se não exposta)

## 📊 Resumo

| Aspecto | Status | Nota |
|---------|--------|------|
| Anon Key no Frontend | ✅ Seguro | Protegida por RLS |
| JWT Authentication | ✅ Seguro | Gerenciado pelo Supabase |
| Row Level Security | ✅ Ativo | Todas as tabelas |
| Service Role Key | ✅ Privada | Não exposta |
| HTTPS | ⚠️ Requerido | Obrigatório em produção |
| Documentação | ✅ Completa | Este arquivo |

## 🎯 Conclusão

A arquitetura atual é **altamente segura** porque:

1. ✅ Usa apenas anon key no frontend (segura por design)
2. ✅ RLS protege todos os dados no nível do banco
3. ✅ Autenticação JWT gerenciada automaticamente
4. ✅ Service role key mantida privada
5. ✅ Múltiplas camadas de defesa
6. ✅ Princípio do menor privilégio aplicado

**Nenhuma informação sensível é exposta no frontend!** 🔐
