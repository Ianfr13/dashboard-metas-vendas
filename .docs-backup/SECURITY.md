# Guia de Segurança - Supabase

## 🔐 Visão Geral

Este projeto usa **Supabase** como banco de dados, com uma arquitetura de segurança baseada em:

1. **Row Level Security (RLS)** - Políticas de acesso no nível do banco de dados
2. **Anon Key** - Chave pública segura para frontend e backend
3. **Service Role Key** - Chave administrativa (apenas backend, quando necessário)

## 🔑 Tipos de Chaves

### 1. Anon Key (Pública) ✅

**O que é:**
- Chave JWT pública do Supabase
- Segura para uso no frontend e backend
- Permissões limitadas pelo RLS

**Onde usar:**
- ✅ Frontend (React)
- ✅ Backend (Node.js/Express)
- ✅ Aplicativos móveis
- ✅ Código versionado no Git

**Variáveis de ambiente:**
```env
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Por que é segura:**
- Não bypassa o RLS
- Requer autenticação do usuário para operações sensíveis
- Políticas do banco controlam o acesso aos dados

### 2. Service Role Key (Privada) ⚠️

**O que é:**
- Chave administrativa com permissões totais
- Bypassa todas as políticas RLS
- Acesso irrestrito ao banco de dados

**Onde usar:**
- ✅ Backend (operações administrativas)
- ✅ Scripts de migração
- ✅ Tarefas agendadas (cron jobs)

**Onde NÃO usar:**
- ❌ Frontend (NUNCA!)
- ❌ Código versionado no Git
- ❌ Variáveis com prefixo `VITE_`
- ❌ Aplicativos móveis

**Variável de ambiente:**
```env
# ⚠️ Mantenha esta key em segredo!
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## 🛡️ Row Level Security (RLS)

### O que é RLS?

Row Level Security é um sistema de segurança do PostgreSQL que controla o acesso aos dados no nível de **linha** (row) da tabela.

### Como funciona?

```sql
-- Exemplo: Usuários só podem ver seus próprios dados
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = open_id);
```

### Políticas Implementadas

#### Tabela `users`
- ✅ Usuários podem ver apenas seus próprios dados
- ✅ Autenticação obrigatória

#### Tabela `simulation_params`
- ✅ Usuários podem ver/editar apenas suas simulações
- ✅ Filtro automático por `user_id`

#### Tabela `daily_results`
- ✅ Usuários podem ver/editar apenas seus resultados
- ✅ Filtro automático por `user_id`

#### Tabela `goals` e `sub_goals`
- ✅ Usuários podem ver/editar apenas suas metas
- ✅ Filtro automático por `user_id`

#### Tabela `products` e `funis`
- ✅ Leitura pública (qualquer usuário autenticado)
- ✅ Escrita restrita (apenas admin ou backend)

#### Tabela `gtm_events`
- ✅ Inserção pública (webhooks)
- ✅ Leitura restrita (apenas usuários autenticados)

## 📋 Checklist de Segurança

### ✅ Configuração Atual

- [x] RLS habilitado em todas as tabelas
- [x] Políticas básicas implementadas
- [x] Anon key usada no frontend
- [x] Anon key usada no backend
- [x] Service role key NÃO exposta
- [x] Variáveis de ambiente documentadas
- [x] `.env.example` com instruções claras

### 🔍 Auditoria Recomendada

- [ ] Revisar políticas RLS periodicamente
- [ ] Testar acesso não autorizado
- [ ] Monitorar logs de acesso no Supabase
- [ ] Rotacionar service role key anualmente
- [ ] Verificar permissões de usuários admin

## 🚨 O que NUNCA fazer

### ❌ NUNCA exponha no frontend:

```typescript
// ❌ ERRADO - Service role key no frontend
const supabase = createClient(url, SERVICE_ROLE_KEY);

// ✅ CORRETO - Anon key no frontend
const supabase = createClient(url, ANON_KEY);
```

### ❌ NUNCA desabilite RLS sem motivo:

```sql
-- ❌ ERRADO - Desabilitar RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- ✅ CORRETO - Manter RLS habilitado
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

### ❌ NUNCA use políticas muito permissivas:

```sql
-- ❌ ERRADO - Acesso total para todos
CREATE POLICY "Allow all" ON users FOR ALL USING (true);

-- ✅ CORRETO - Acesso restrito por usuário
CREATE POLICY "Users own data" ON users 
  FOR ALL USING (auth.uid()::text = open_id);
```

## 🔧 Configuração Segura

### Backend (`server/supabase.ts`)

```typescript
import { createClient } from '@supabase/supabase-js';

// ✅ Usa anon key (segura)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);
```

### Frontend (`client/src/lib/supabase.ts`)

```typescript
import { createClient } from '@supabase/supabase-js';

// ✅ Usa anon key via variáveis VITE_
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);
```

## 📚 Recursos Adicionais

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

## 🆘 Em caso de vazamento de chave

Se a **service role key** for exposta:

1. ⚠️ Acesse o [Supabase Dashboard](https://supabase.com/dashboard/project/auvvrewlbpyymekonilv)
2. 🔄 Vá em Settings > API > Regenerate service_role key
3. 🔒 Atualize a variável de ambiente no servidor
4. ✅ Reinicie a aplicação

**Nota:** A anon key pode ser exposta publicamente sem problemas, pois é protegida por RLS.

## ✅ Conclusão

A arquitetura atual é **segura** porque:

1. ✅ Apenas a anon key é exposta no frontend
2. ✅ RLS protege todos os dados sensíveis
3. ✅ Autenticação JWT gerenciada automaticamente
4. ✅ Service role key mantida privada no backend
5. ✅ Políticas de acesso bem definidas

Mantenha estas práticas e seu projeto estará protegido! 🔐
