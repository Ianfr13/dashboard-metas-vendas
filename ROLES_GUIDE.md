# Guia do Sistema de Roles

Sistema de permissões com dois níveis: **user** e **admin**.

## 📊 Estrutura

| Role | Descrição | Permissões |
|------|-----------|------------|
| `user` | Usuário padrão | Acesso a /, /metricas |
| `admin` | Administrador | Acesso a todas as rotas, incluindo /admin |

## 🔐 Como Funciona

### **1. Criação Automática de Role**

Quando um usuário faz login pela primeira vez:
- ✅ Automaticamente recebe role `user`
- ✅ Registro criado na tabela `user_roles`

### **2. Proteção de Rotas**

**Rotas públicas:**
- `/login` - Página de login

**Rotas protegidas (requer autenticação):**
- `/` - Home
- `/metricas` - Métricas

**Rotas admin (requer autenticação + role admin):**
- `/admin` - Painel administrativo

### **3. Componentes de Proteção**

| Componente | Função |
|------------|--------|
| `ProtectedRoute` | Verifica se usuário está autenticado |
| `AdminRoute` | Verifica se usuário é admin |

## 🚀 Como Promover um Usuário a Admin

### **Método 1: Via SQL Editor do Supabase**

1. Acesse: https://supabase.com/dashboard/project/auvvrewlbpyymekonilv/sql
2. Execute:

```sql
UPDATE user_roles 
SET role = 'admin' 
WHERE email = 'seu-email@douravita.com.br';
```

3. Verifique:

```sql
SELECT * FROM user_roles ORDER BY created_at DESC;
```

### **Método 2: Via MCP (Linha de Comando)**

```bash
manus-mcp-cli tool call execute_sql --server supabase --input '{
  "project_id": "auvvrewlbpyymekonilv",
  "query": "UPDATE user_roles SET role = '\''admin'\'' WHERE email = '\''seu-email@douravita.com.br'\'';"
}'
```

## 📋 Verificar Roles

### **Listar todos os usuários e seus roles:**

```sql
SELECT 
  email,
  role,
  created_at
FROM user_roles 
ORDER BY created_at DESC;
```

### **Verificar role de um usuário específico:**

```sql
SELECT role 
FROM user_roles 
WHERE email = 'seu-email@douravita.com.br';
```

## 🎯 Fluxo de Acesso

### **Usuário comum (role: user)**

```
1. Login → Autenticado
2. Acessa / → ✅ Permitido
3. Acessa /metricas → ✅ Permitido
4. Acessa /admin → ❌ Acesso Negado
```

### **Administrador (role: admin)**

```
1. Login → Autenticado
2. Acessa / → ✅ Permitido
3. Acessa /metricas → ✅ Permitido
4. Acessa /admin → ✅ Permitido
```

## 🔒 Segurança (RLS)

As políticas de Row Level Security garantem:

1. **Usuários comuns:**
   - Podem ver apenas seu próprio role
   - Não podem modificar roles

2. **Administradores:**
   - Podem ver todos os roles
   - Podem modificar roles de outros usuários

## 🐛 Troubleshooting

### **Erro: Usuário não tem role após login**

**Causa:** Trigger de criação automática pode não ter funcionado.

**Solução:** Criar role manualmente:

```sql
INSERT INTO user_roles (user_id, email, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'email@douravita.com.br'),
  'email@douravita.com.br',
  'user'
);
```

### **Erro: Admin não consegue acessar /admin**

**Causa:** Role pode não estar atualizado.

**Solução:** Verificar role no banco:

```sql
SELECT * FROM user_roles WHERE email = 'seu-email@douravita.com.br';
```

Se o role não for `admin`, atualize:

```sql
UPDATE user_roles SET role = 'admin' WHERE email = 'seu-email@douravita.com.br';
```

### **Erro: Página /admin mostra "Acesso Negado" mesmo sendo admin**

**Causa:** Cache do navegador ou sessão antiga.

**Solução:**
1. Faça logout
2. Limpe o cache do navegador
3. Faça login novamente

## 📚 Arquivos Relacionados

- `supabase/roles_migration.sql` - Script completo de migração
- `client/src/components/Auth/AdminRoute.tsx` - Componente de proteção
- `client/src/App.tsx` - Configuração de rotas

---

**Status:** ✅ Sistema implementado  
**Próximo:** Promover primeiro admin via SQL  
**Data:** 24 de Dezembro de 2024
