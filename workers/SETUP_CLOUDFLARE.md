# Cloudflare Queue Setup - Passo a Passo

## 1. Criar Queue no Cloudflare Dashboard

1. Acesse: https://dash.cloudflare.com → **Workers & Pages** → **Queues**
2. Clique em **Create Queue**
3. Nome: `gtm-events-queue`
4. Clique em **Create**

> Opcional: Criar também `gtm-events-dlq` (Dead Letter Queue) para mensagens que falharem

---

## 2. Configurar Secrets

No terminal, na pasta do projeto:

```bash
cd workers

# Secret para o Producer (validação do GTM)
wrangler secret put GTM_SECRET --config wrangler.producer.jsonc
# Cole: b646bc7e395f08aa2ee33001fbd6056874c3e0b732e6ed1b62dd251825d4f276

# Secrets para o Consumer (acesso ao Supabase)
wrangler secret put SUPABASE_URL --config wrangler.consumer.jsonc
# Cole: https://auvvrewlbpyymekonilv.supabase.co

wrangler secret put SUPABASE_SERVICE_ROLE_KEY --config wrangler.consumer.jsonc
# Cole sua SERVICE_ROLE_KEY do Supabase
```

---

## 3. Deploy dos Workers

```bash
cd workers
chmod +x deploy.sh
./deploy.sh
```

Ou manualmente:
```bash
wrangler deploy --config wrangler.producer.jsonc
wrangler deploy --config wrangler.consumer.jsonc
```

---

## 4. Atualizar Script GTM

No seu Tag Manager, altere a URL do endpoint:

**Antes:**
```javascript
const ENDPOINT = 'https://auvvrewlbpyymekonilv.supabase.co/functions/v1/gtm-event';
```

**Depois:**
```javascript
const ENDPOINT = 'https://gtm-producer.SEU_SUBDOMINIO.workers.dev/';
```

> A URL exata aparece após o deploy. Verifique no Cloudflare Dashboard.

---

## 5. Verificar Funcionamento

1. Acesse seu site e gere um evento (page view)
2. No Cloudflare Dashboard → Queues → `gtm-events-queue` → Messages
3. Aguarde 60 segundos (batch timeout)
4. Verifique no Supabase → Table Editor → `gtm_events`

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| 401 Unauthorized | Verificar se `X-GTM-Secret` está sendo enviado |
| 403 Forbidden | Domínio não está na lista `ALLOWED_ORIGINS` |
| Mensagens não processadas | Verificar logs do Consumer no Cloudflare |
| Erro no Supabase | Verificar se `SUPABASE_SERVICE_ROLE_KEY` está correto |
