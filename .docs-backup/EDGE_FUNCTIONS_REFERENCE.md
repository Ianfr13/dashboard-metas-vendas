# Edge Functions - Referência Rápida

## 📍 Base URL
```
https://auvvrewlbpyymekonilv.supabase.co/functions/v1
```

---

## 1. get-dashboard-data

**Endpoint:** `GET /get-dashboard-data`

**Parâmetros:**
- `month` (opcional): Mês (1-12)
- `year` (opcional): Ano (ex: 2025)

**Autenticação:** ✅ Requerida (JWT)

**Retorna:**
- Meta principal do mês
- Sub-metas (com marcação automática)
- Métricas avançadas (dias, déficit, ritmo)
- Vendas por dia
- Produtos

**Exemplo:**
```bash
curl "https://auvvrewlbpyymekonilv.supabase.co/functions/v1/get-dashboard-data?month=1&year=2025" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 2. gtm-analytics

**Endpoint:** `GET /gtm-analytics`

**Ações disponíveis:**

### a) Funil de Conversão
**Parâmetros:**
- `action=funnel`
- `start_date` (ISO 8601)
- `end_date` (ISO 8601)

**Exemplo:**
```bash
curl "https://auvvrewlbpyymekonilv.supabase.co/functions/v1/gtm-analytics?action=funnel&start_date=2025-01-01&end_date=2025-01-31"
```

### b) Evolução Temporal
**Parâmetros:**
- `action=evolution`
- `start_date` (ISO 8601)
- `end_date` (ISO 8601)
- `event_name` (page_view, generate_lead, begin_checkout, purchase)
- `group_by` (hour, day, week)

**Exemplo:**
```bash
curl "https://auvvrewlbpyymekonilv.supabase.co/functions/v1/gtm-analytics?action=evolution&start_date=2025-01-01&end_date=2025-01-31&event_name=purchase&group_by=day"
```

### c) Métricas por Produto
**Parâmetros:**
- `action=products`
- `start_date` (ISO 8601)
- `end_date` (ISO 8601)

**Exemplo:**
```bash
curl "https://auvvrewlbpyymekonilv.supabase.co/functions/v1/gtm-analytics?action=products&start_date=2025-01-01&end_date=2025-01-31"
```

---

## 3. team-ranking

**Endpoint:** `POST /team-ranking`

**Body:**
```json
{
  "start_date": "2025-01-01",
  "end_date": "2025-01-31"
}
```

**Autenticação:** ❌ Não requerida (usa service role internamente)

**Retorna:**
- Ranking de closers e SDRs
- Métricas híbridas (GTM + CRM)
- Discrepância entre sistemas
- Melhor closer e melhor SDR

**Exemplo:**
```bash
curl -X POST "https://auvvrewlbpyymekonilv.supabase.co/functions/v1/team-ranking" \
  -H "Content-Type: application/json" \
  -d '{"start_date":"2025-01-01","end_date":"2025-01-31"}'
```

---

## 4. gtm-event

**Endpoint:** `POST /gtm-event`

**Headers:**
- `X-GTM-Secret`: Token secreto para validação

**Body:**
```json
{
  "event_name": "purchase",
  "event_data": {
    "value": 1000,
    "transaction_id": "TXN123",
    "product_name": "Produto X"
  },
  "user_id": "user@example.com",
  "session_id": "session123",
  "page_url": "https://example.com/checkout",
  "referrer": "https://google.com"
}
```

**Exemplo:**
```bash
curl -X POST "https://auvvrewlbpyymekonilv.supabase.co/functions/v1/gtm-event" \
  -H "Content-Type: application/json" \
  -H "X-GTM-Secret: YOUR_SECRET_TOKEN" \
  -d '{
    "event_name": "purchase",
    "event_data": {
      "value": 1000,
      "transaction_id": "TXN123"
    }
  }'
```

---

## 🔐 Segurança

| Edge Function | Autenticação | Chave Usada |
|---------------|--------------|-------------|
| get-dashboard-data | ✅ JWT do usuário | Anon Key |
| gtm-analytics | ❌ Pública | Service Role |
| team-ranking | ❌ Pública | Service Role |
| gtm-event | ✅ Secret Token | Service Role |

---

## 📝 Notas

- **JWT Token**: Obtido via `supabase.auth.getSession()`
- **Datas**: Sempre usar formato ISO 8601 (YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss.sssZ)
- **CORS**: Todas as edge functions têm CORS habilitado
- **Rate Limiting**: Aplicado pelo Supabase (consultar documentação)

---

## 🧪 Testes Rápidos

```bash
# Variáveis
BASE_URL="https://auvvrewlbpyymekonilv.supabase.co/functions/v1"
START="2025-01-01"
END="2025-01-31"

# Funil
curl "$BASE_URL/gtm-analytics?action=funnel&start_date=$START&end_date=$END"

# Evolução
curl "$BASE_URL/gtm-analytics?action=evolution&start_date=$START&end_date=$END&event_name=purchase&group_by=day"

# Produtos
curl "$BASE_URL/gtm-analytics?action=products&start_date=$START&end_date=$END"

# Ranking
curl -X POST "$BASE_URL/team-ranking" \
  -H "Content-Type: application/json" \
  -d "{\"start_date\":\"$START\",\"end_date\":\"$END\"}"
```
