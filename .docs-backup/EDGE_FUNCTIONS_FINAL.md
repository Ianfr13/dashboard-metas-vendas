# Edge Functions - Configuração Final

## 📋 Visão Geral

O projeto usa **apenas 1 Edge Function**: `gtm-event`

Esta função é responsável por receber **todos os eventos** de tracking do Google Tag Manager (GTM), incluindo:
- Page views (visualizações de página)
- Leads gerados
- Checkouts iniciados
- Compras concluídas
- Qualquer outro evento personalizado

## 🗂️ Estrutura de Arquivos

```
supabase/
└── functions/
    ├── _shared/
    │   └── cors.ts          # Configuração de CORS
    └── gtm-event/
        └── index.ts         # Edge Function do GTM
```

## 🔧 Edge Function: gtm-event

### Descrição

Recebe eventos do Google Tag Manager e os armazena na tabela `gtm_events` do Supabase.

### Características

- **Autenticação**: Nenhuma (pública)
- **Método**: POST
- **Endpoint**: `https://auvvrewlbpyymekonilv.supabase.co/functions/v1/gtm-event`

### Parâmetros

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `event_name` | string | ✅ Sim | Nome do evento (ex: "purchase", "page_view") |
| `event_data` | object | ❌ Não | Dados adicionais do evento (JSON) |
| `user_id` | string | ❌ Não | ID do usuário (se disponível) |
| `session_id` | string | ❌ Não | ID da sessão |
| `page_url` | string | ❌ Não | URL da página onde o evento ocorreu |
| `referrer` | string | ❌ Não | Referrer da página |

### Exemplo de Chamada

**JavaScript (GTM):**
```javascript
fetch('https://auvvrewlbpyymekonilv.supabase.co/functions/v1/gtm-event', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    event_name: 'purchase',
    event_data: {
      transaction_id: 'TXN-12345',
      value: 997,
      currency: 'BRL',
      product_name: 'Curso Avançado',
    },
    page_url: window.location.href,
    referrer: document.referrer,
  }),
});
```

**React (usando helper):**
```typescript
import { gtmAPI } from '@/lib/edge-functions';

await gtmAPI.sendEvent({
  event_name: 'purchase',
  event_data: {
    transaction_id: 'TXN-12345',
    value: 997,
  },
  page_url: window.location.href,
});
```

### Resposta

**Sucesso (200):**
```json
{
  "success": true,
  "message": "Event recorded successfully"
}
```

**Erro (400):**
```json
{
  "error": "event_name is required"
}
```

## 🚀 Deploy

### 1. Instalar Supabase CLI

```bash
npm install -g supabase
```

### 2. Login

```bash
supabase login
```

### 3. Link ao Projeto

```bash
supabase link --project-ref auvvrewlbpyymekonilv
```

### 4. Deploy da Função

```bash
supabase functions deploy gtm-event
```

### 5. Verificar Deploy

```bash
supabase functions list
```

## 🔐 Segurança

### Por que esta função é pública?

A função `gtm-event` é pública porque precisa receber eventos do GTM, que roda no navegador do usuário. No entanto, ela é segura porque:

1. **Apenas insere dados**: Não retorna dados sensíveis
2. **Validação de entrada**: Valida todos os campos recebidos
3. **Rate limiting**: Supabase aplica rate limiting automaticamente
4. **Service Role Key**: Usa a service role key no servidor (não exposta)
5. **IP e User Agent**: Registra IP e user agent para auditoria

### Dados Armazenados

Todos os eventos são armazenados na tabela `gtm_events` com:
- Timestamp automático
- IP do cliente
- User agent
- Todos os campos enviados

## 📊 Eventos Suportados

### 1. Page View

```javascript
gtmAPI.sendEvent({
  event_name: 'page_view',
  event_data: {
    page_title: document.title,
  },
  page_url: window.location.href,
  referrer: document.referrer,
});
```

### 2. Lead Gerado

```javascript
gtmAPI.sendEvent({
  event_name: 'generate_lead',
  event_data: {
    email: 'usuario@example.com',
    name: 'João Silva',
    phone: '11999999999',
  },
  page_url: window.location.href,
});
```

### 3. Checkout Iniciado

```javascript
gtmAPI.sendEvent({
  event_name: 'begin_checkout',
  event_data: {
    product_id: 123,
    product_name: 'Curso Avançado',
    value: 997,
    currency: 'BRL',
  },
  page_url: window.location.href,
});
```

### 4. Compra Concluída

```javascript
gtmAPI.sendEvent({
  event_name: 'purchase',
  event_data: {
    transaction_id: 'TXN-12345',
    value: 997,
    currency: 'BRL',
    product_id: 123,
    product_name: 'Curso Avançado',
  },
  page_url: window.location.href,
});
```

## 🎯 Integração com GTM

### Configurar Tag no GTM

1. Acesse o Google Tag Manager
2. Crie uma nova Tag do tipo "Custom HTML"
3. Cole o código:

```html
<script>
(function() {
  var eventData = {
    event_name: '{{Event}}', // Variável do GTM
    event_data: {
      // Seus dados aqui
    },
    page_url: window.location.href,
    referrer: document.referrer,
  };

  fetch('https://auvvrewlbpyymekonilv.supabase.co/functions/v1/gtm-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData),
  });
})();
</script>
```

4. Configure o gatilho (trigger) desejado
5. Publique

## ✅ Checklist de Deploy

- [ ] Edge Function `gtm-event` criada
- [ ] Deploy realizado via Supabase CLI
- [ ] Função testada com cURL ou Postman
- [ ] GTM configurado para enviar eventos
- [ ] Eventos aparecendo na tabela `gtm_events`
- [ ] Documentação atualizada

## 📚 Arquivos Relacionados

- `supabase/functions/gtm-event/index.ts` - Código da Edge Function
- `supabase/functions/_shared/cors.ts` - Configuração de CORS
- `client/src/lib/edge-functions.ts` - Helper do frontend
- `GTM_INTEGRATION_GUIDE.md` - Guia de integração com GTM

---

**Última atualização:** 24 de Dezembro de 2024  
**Status:** ✅ Pronto para deploy
