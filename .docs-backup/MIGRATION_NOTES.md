# Migração para Supabase - Notas

## Status da Migração

### ✅ Concluído

1. **Schema do Banco de Dados**
   - Todas as tabelas criadas no Supabase PostgreSQL
   - Triggers de `updated_at` configurados
   - Índices criados para performance
   - RLS (Row Level Security) habilitado em todas as tabelas
   - Políticas básicas de RLS criadas

2. **Arquivos de Configuração**
   - `server/supabase.ts` - Cliente Supabase
   - `server/db.ts` - Adaptado para usar Supabase
   - Funções `getDb()`, `upsertUser()`, `getUserByOpenId()` migradas

3. **Rotas Migradas**
   - ✅ `server/routes/simulations.ts` - Completa
   - ✅ `server/routes/products.ts` - Completa

### 🔄 Em Progresso

4. **Rotas Pendentes**
   - ⏳ `server/routes/goals.ts`
   - ⏳ `server/routes/analytics.ts`
   - ⏳ `server/routes/webhooks.ts`
   - ⏳ `server/routes/gtm.ts`
   - ⏳ `server/routes/funis.ts`
   - ⏳ `server/routes/funil-metricas.ts`

## Mudanças Principais

### Nomenclatura de Campos

PostgreSQL usa `snake_case` por convenção, então os campos foram renomeados:

| Drizzle (MySQL) | Supabase (PostgreSQL) |
|-----------------|----------------------|
| `userId` | `user_id` |
| `openId` | `open_id` |
| `vslConversionRate` | `vsl_conversion_rate` |
| `targetCPA` | `target_cpa` |
| `sdrDailyMeetings` | `sdr_daily_meetings` |

### Sintaxe de Queries

**Antes (Drizzle):**
```typescript
const result = await db
  .select()
  .from(table)
  .where(eq(table.field, value));
```

**Depois (Supabase):**
```typescript
const { data, error } = await supabase
  .from('table')
  .select('*')
  .eq('field', value);
```

### Variáveis de Ambiente

Adicionar ao `.env`:
```
SUPABASE_URL=https://auvvrewlbpyymekonilv.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Próximos Passos

1. Migrar as rotas restantes
2. Atualizar package.json (remover drizzle, adicionar @supabase/supabase-js)
3. Testar todas as funcionalidades
4. Atualizar documentação
5. Remover arquivos antigos do Drizzle (opcional)

## Notas Importantes

- **RLS está habilitado**: Certifique-se de que as políticas de segurança estão corretas
- **Tipos**: Os tipos do Supabase podem ser gerados automaticamente
- **Migrações**: Usar `apply_migration` via MCP para futuras mudanças no schema
- **Performance**: Índices já criados nas colunas mais consultadas
