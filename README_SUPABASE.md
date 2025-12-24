# Dashboard de Metas de Vendas - Supabase Edition

Este projeto foi migrado de MySQL/Drizzle para **Supabase (PostgreSQL)**.

## 🚀 Configuração Rápida

### 1. Instalar Dependências

```bash
pnpm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o `.env` e configure suas credenciais do Supabase:

```env
SUPABASE_URL=https://auvvrewlbpyymekonilv.supabase.co
SUPABASE_ANON_KEY=seu_anon_key_aqui
```

### 3. Rodar o Projeto

```bash
# Desenvolvimento
pnpm dev

# Produção
pnpm build
pnpm start
```

## 📊 Banco de Dados

O projeto agora usa **Supabase** como banco de dados. Todas as tabelas foram criadas e configuradas com:

- ✅ Row Level Security (RLS) habilitado
- ✅ Políticas de segurança básicas
- ✅ Triggers automáticos para `updated_at`
- ✅ Índices para performance otimizada

### Estrutura das Tabelas

- `users` - Usuários do sistema
- `simulation_params` - Parâmetros de simulação de vendas
- `daily_results` - Resultados diários de vendas
- `goals` - Metas principais
- `sub_goals` - Sub-metas
- `calculated_metrics` - Métricas calculadas (cache)
- `products` - Produtos vendidos
- `gtm_events` - Eventos do Google Tag Manager
- `funis` - Funis de venda
- `funil_produtos` - Relacionamento funis-produtos
- `metas_principais` - Metas mensais principais
- `sub_metas` - Sub-metas de milestone
- `custos` - Custos por canal
- `distribuicao_canal` - Distribuição de receita entre canais

## 🔧 Gerenciamento de Migrações

As migrações agora são gerenciadas via **Supabase MCP**. Para aplicar novas migrações:

```bash
# Via MCP
manus-mcp-cli tool call apply_migration --server supabase --input '{
  "project_id": "auvvrewlbpyymekonilv",
  "name": "migration_name",
  "query": "SQL_QUERY_HERE"
}'
```

## 📝 Mudanças Importantes

### Nomenclatura de Campos

Os campos agora seguem a convenção `snake_case` do PostgreSQL:

| Antes (MySQL) | Agora (PostgreSQL) |
|---------------|-------------------|
| `userId` | `user_id` |
| `openId` | `open_id` |
| `vslConversionRate` | `vsl_conversion_rate` |

### Cliente do Banco de Dados

```typescript
// Antes (Drizzle)
import { getDb } from './db';
const db = await getDb();
const results = await db.select().from(users);

// Agora (Supabase)
import { getDb } from './db';
const supabase = await getDb();
const { data, error } = await supabase.from('users').select('*');
```

## 🔐 Segurança

### Arquitetura de Segurança

O projeto usa **apenas a Anon Key** no frontend e backend, que é **100% segura** para exposição pública.

**Por que a Anon Key é segura?**
- ✅ Protegida por Row Level Security (RLS)
- ✅ Requer autenticação do usuário
- ✅ Não bypassa políticas de acesso
- ✅ Permissões limitadas pelo banco de dados

**Políticas RLS Configuradas:**
- Usuários podem ver apenas seus próprios dados
- Produtos e funis têm acesso público de leitura
- Eventos GTM podem ser inseridos por webhooks
- Todas as operações sensíveis requerem autenticação

**⚠️ Service Role Key:**
- Nunca exponha no frontend
- Use apenas no backend para operações administrativas
- Mantenha em `.env` (não commitado no Git)

📖 **Leia mais:** [SECURITY.md](./SECURITY.md) - Guia completo de segurança

## 📚 Documentação Adicional

- [MIGRATION_NOTES.md](./MIGRATION_NOTES.md) - Detalhes técnicos da migração
- [GTM_INTEGRATION_GUIDE.md](./GTM_INTEGRATION_GUIDE.md) - Integração com Google Tag Manager
- [WEBHOOKS_API.md](./WEBHOOKS_API.md) - API de webhooks para gateways de pagamento

## 🆘 Suporte

Para problemas relacionados ao Supabase, consulte:
- [Documentação do Supabase](https://supabase.com/docs)
- [Supabase Dashboard](https://supabase.com/dashboard/project/auvvrewlbpyymekonilv)
