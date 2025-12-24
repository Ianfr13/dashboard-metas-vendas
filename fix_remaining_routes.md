# Rotas Restantes para Migrar

As seguintes rotas ainda precisam ser migradas manualmente para Supabase:

## 1. server/routes/goals.ts
- Remover imports de `drizzle-orm`
- Substituir `db.select()` por `supabase.from().select()`
- Substituir `db.insert()` por `supabase.from().insert()`
- Substituir `db.update()` por `supabase.from().update()`
- Substituir `db.delete()` por `supabase.from().delete()`
- Ajustar nomes de campos para snake_case

## 2. server/routes/analytics.ts
- Mesmas mudanças acima
- Verificar queries complexas com joins

## 3. server/routes/webhooks.ts
- Mesmas mudanças acima

## 4. server/routes/funis.ts
- Mesmas mudanças acima
- Verificar relacionamentos com produtos

## 5. server/routes/funil-metricas.ts
- Mesmas mudanças acima
- Verificar cálculos agregados

## Padrão de Conversão

### Antes (Drizzle):
```typescript
const db = await getDb();
const results = await db
  .select()
  .from(table)
  .where(eq(table.field, value));
```

### Depois (Supabase):
```typescript
const supabase = await getDb();
const { data, error } = await supabase
  .from('table')
  .select('*')
  .eq('field', value);

if (error) throw error;
return data;
```

## Nota
Devido à complexidade dessas rotas, elas precisam ser migradas com cuidado para manter a lógica de negócio intacta.
