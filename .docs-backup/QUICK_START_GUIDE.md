# Guia Rápido de Implementação

## 🚀 Como Fazer Tudo Funcionar

Este guia mostra os passos exatos para colocar o sistema em produção.

## 📋 Pré-requisitos

- [ ] Conta no Supabase (projeto `auvvrewlbpyymekonilv`)
- [ ] Google Tag Manager configurado
- [ ] Supabase CLI instalado (`npm install -g supabase`)

## 🔧 Passo 1: Deploy das Edge Functions

```bash
# 1. Login no Supabase
supabase login

# 2. Link ao projeto
supabase link --project-ref auvvrewlbpyymekonilv

# 3. Deploy das Edge Functions
supabase functions deploy gtm-event
supabase functions deploy get-dashboard-data

# 4. Verificar deploy
supabase functions list
```

**Resultado esperado:**
```
┌──────────────────────┬────────┬─────────────────────┐
│ NAME                 │ STATUS │ CREATED AT          │
├──────────────────────┼────────┼─────────────────────┤
│ gtm-event            │ ACTIVE │ 2024-12-24 17:00:00 │
│ get-dashboard-data   │ ACTIVE │ 2024-12-24 17:00:00 │
└──────────────────────┴────────┴─────────────────────┘
```

## 🏷️ Passo 2: Configurar Google Tag Manager

### 2.1. Criar Variáveis

No GTM, vá em **Variables** → **New** e crie:

| Nome da Variável | Tipo | Configuração |
|------------------|------|--------------|
| `Transaction ID` | Data Layer Variable | `transaction_id` |
| `Transaction Value` | Data Layer Variable | `value` |
| `Product Type` | Data Layer Variable | `product_type` |
| `Product Name` | Data Layer Variable | `product_name` |

### 2.2. Criar Tag de Purchase

1. Vá em **Tags** → **New**
2. Nome: `Supabase - Purchase Event`
3. Tipo: **Custom HTML**
4. Cole o código:

```html
<script>
(function() {
  fetch('https://auvvrewlbpyymekonilv.supabase.co/functions/v1/gtm-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_name: 'purchase',
      event_data: {
        transaction_id: '{{Transaction ID}}',
        value: {{Transaction Value}},
        product_type: '{{Product Type}}',
        product_name: '{{Product Name}}',
      },
      page_url: window.location.href,
      referrer: document.referrer,
    }),
  });
})();
</script>
```

5. **Trigger**: Crie um trigger para o evento `purchase` (Custom Event)
6. **Salvar** e **Publicar**

### 2.3. Testar a Tag

1. Ative o **Preview Mode** no GTM
2. No seu site, dispare um evento de compra:
   ```javascript
   window.dataLayer.push({
     'event': 'purchase',
     'transaction_id': 'TEST-001',
     'value': 997,
     'product_type': 'front',
     'product_name': 'Curso Teste',
   });
   ```
3. Verifique no GTM se a tag foi disparada
4. Verifique no Supabase se o evento foi registrado:
   ```sql
   SELECT * FROM gtm_events ORDER BY created_at DESC LIMIT 10;
   ```

## 📊 Passo 3: Criar Meta Principal

Antes de usar o dashboard, você precisa criar uma meta principal para o mês:

```sql
-- No SQL Editor do Supabase
INSERT INTO metas_principais (mes, ano, valor_meta, valor_atual, active)
VALUES (12, 2024, 100000.00, 0.00, 1);
```

### 3.1. Criar Sub-Metas (Opcional)

```sql
-- Substitua 1 pelo ID da meta principal criada acima
INSERT INTO sub_metas (meta_principal_id, valor, atingida)
VALUES 
  (1, 25000.00, 0),  -- 25% da meta
  (1, 50000.00, 0),  -- 50% da meta
  (1, 75000.00, 0),  -- 75% da meta
  (1, 100000.00, 0); -- 100% da meta
```

## 💻 Passo 4: Integrar no Frontend

### 4.1. Carregar Dados do Dashboard

```typescript
// Em qualquer componente React
import { dashboardAPI } from '@/lib/edge-functions';
import { useEffect, useState } from 'react';

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getData()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Carregando...</div>;

  return (
    <div>
      <h1>Dashboard de Vendas</h1>
      
      {/* Meta Principal */}
      {data.meta && (
        <div>
          <h2>Meta do Mês</h2>
          <p>Objetivo: R$ {data.meta.valorMeta.toLocaleString()}</p>
          <p>Atual: R$ {data.meta.valorAtual.toLocaleString()}</p>
          <p>Progresso: {data.meta.progress.toFixed(1)}%</p>
        </div>
      )}

      {/* Totais */}
      <div>
        <h2>Totais do Mês</h2>
        <p>Vendas: {data.totals.totalSales}</p>
        <p>Receita: R$ {data.totals.totalRevenue.toLocaleString()}</p>
      </div>

      {/* Sub-Metas */}
      <div>
        <h2>Sub-Metas</h2>
        {data.subMetas.map(sm => (
          <div key={sm.id}>
            R$ {sm.valor.toLocaleString()} - 
            {sm.atingida ? ' ✅ Atingida' : ' ⏳ Pendente'}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## ✅ Passo 5: Testar o Fluxo Completo

### 5.1. Simular uma Venda

```javascript
// No console do navegador (com GTM instalado)
window.dataLayer.push({
  'event': 'purchase',
  'transaction_id': 'TEST-' + Date.now(),
  'value': 997,
  'product_type': 'front',
  'product_name': 'Produto Teste',
});
```

### 5.2. Verificar no Banco de Dados

```sql
-- Verificar evento registrado
SELECT * FROM gtm_events WHERE event_name = 'purchase' ORDER BY created_at DESC LIMIT 1;

-- Verificar daily_results atualizado
SELECT * FROM daily_results WHERE date = CURRENT_DATE;

-- Verificar meta atualizada
SELECT * FROM metas_principais WHERE mes = EXTRACT(MONTH FROM CURRENT_DATE) AND ano = EXTRACT(YEAR FROM CURRENT_DATE);
```

### 5.3. Verificar no Dashboard

Recarregue o dashboard no frontend e verifique se:
- [ ] A receita total aumentou
- [ ] O número de vendas aumentou
- [ ] O progresso da meta foi atualizado
- [ ] Se alguma sub-meta foi atingida, ela aparece como ✅

## 🎯 Checklist Final

- [ ] Edge Functions deployadas
- [ ] GTM configurado com tag de purchase
- [ ] Meta principal criada no banco
- [ ] Sub-metas criadas (opcional)
- [ ] Frontend integrado com `dashboardAPI.getData()`
- [ ] Teste completo realizado
- [ ] Dados aparecendo corretamente no dashboard

## 🐛 Troubleshooting

### Problema: Edge Function retorna erro 401

**Solução**: Certifique-se de que o usuário está autenticado antes de chamar `dashboardAPI.getData()`.

### Problema: Evento não aparece no banco

**Solução**: 
1. Verifique se a URL da Edge Function está correta
2. Abra o Network tab do navegador e veja se a requisição foi enviada
3. Verifique os logs da Edge Function no Supabase Dashboard

### Problema: Meta não atualiza

**Solução**: 
1. Verifique se existe uma meta ativa para o mês/ano atual
2. Verifique se o evento de purchase tem o campo `value` preenchido
3. Verifique os logs da Edge Function `gtm-event`

## 📚 Documentação Completa

- [DATA_FLOW_ARCHITECTURE.md](./DATA_FLOW_ARCHITECTURE.md) - Arquitetura completa
- [EDGE_FUNCTIONS_FINAL.md](./EDGE_FUNCTIONS_FINAL.md) - Detalhes das Edge Functions
- [client/src/lib/edge-functions.ts](./client/src/lib/edge-functions.ts) - Helper do frontend

---

**Pronto!** Seu sistema de tracking GTM → Supabase → Dashboard está configurado! 🎉
