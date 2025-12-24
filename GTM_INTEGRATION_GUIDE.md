# Guia de Integração GTM - Dashboard DouraVita

## Visão Geral

Este guia mostra como configurar o Google Tag Manager (GTM) para enviar eventos para o Dashboard de Metas de Vendas da DouraVita.

**Property ID do GA4:** 371298505

---

## Endpoints Disponíveis

Todos os endpoints aceitam requisições POST com JSON no body.

**Base URL:** `https://3000-i1k5hywttfymjrcbwoydk-a0d3822d.us2.manus.computer/api/gtm`

### 1. Page View (Views VSL)
**Endpoint:** `POST /api/gtm/page-view`

```json
{
  "user_id": "opcional",
  "session_id": "opcional",
  "page_url": "https://seusite.com/vsl",
  "page_title": "VSL - Creatina Pro 797",
  "referrer": "https://google.com"
}
```

### 2. Generate Lead (Leads Gerados)
**Endpoint:** `POST /api/gtm/generate-lead`

```json
{
  "user_id": "opcional",
  "session_id": "opcional",
  "email": "cliente@example.com",
  "name": "João Silva",
  "phone": "+5511999999999",
  "source": "vsl_creatina",
  "page_url": "https://seusite.com/vsl",
  "referrer": "https://facebook.com"
}
```

### 3. Begin Checkout (Checkout Iniciado)
**Endpoint:** `POST /api/gtm/begin-checkout`

```json
{
  "user_id": "opcional",
  "session_id": "opcional",
  "product_id": "creatina_pro_797",
  "product_name": "Creatina Pro 797",
  "value": 797.00,
  "currency": "BRL",
  "page_url": "https://seusite.com/checkout",
  "referrer": "https://seusite.com/vsl"
}
```

### 4. Purchase (Vendas Concluídas)
**Endpoint:** `POST /api/gtm/purchase`

```json
{
  "user_id": "opcional",
  "session_id": "opcional",
  "transaction_id": "TXN123456",
  "value": 797.00,
  "currency": "BRL",
  "product_id": "creatina_pro_797",
  "product_name": "Creatina Pro 797",
  "quantity": 1,
  "page_url": "https://seusite.com/obrigado",
  "referrer": "https://seusite.com/checkout"
}
```

### 5. Endpoint Genérico
**Endpoint:** `POST /api/gtm/event`

```json
{
  "event_name": "custom_event",
  "event_data": {
    "custom_field_1": "valor1",
    "custom_field_2": "valor2"
  },
  "user_id": "opcional",
  "session_id": "opcional",
  "page_url": "https://seusite.com",
  "referrer": "https://google.com"
}
```

---

## Configuração no Google Tag Manager

### Passo 1: Criar Variáveis

1. Acesse o GTM → **Variáveis** → **Nova**
2. Crie as seguintes variáveis:

**Variável: Dashboard API Base URL**
- Tipo: Constante
- Valor: `https://3000-i1k5hywttfymjrcbwoydk-a0d3822d.us2.manus.computer/api/gtm`

**Variável: User ID** (se disponível)
- Tipo: Variável JavaScript personalizada
- Código: `function() { return window.userId || ''; }`

**Variável: Session ID**
- Tipo: Variável JavaScript personalizada
- Código: `function() { return window.sessionId || ''; }`

### Passo 2: Criar Tags

#### Tag 1: Page View (Views VSL)

1. **Tipo de tag:** Tag HTML personalizada
2. **HTML:**

```html
<script>
(function() {
  fetch('{{Dashboard API Base URL}}/page-view', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: '{{User ID}}',
      session_id: '{{Session ID}}',
      page_url: '{{Page URL}}',
      page_title: '{{Page Title}}',
      referrer: '{{Referrer}}'
    })
  }).catch(function(error) {
    console.error('Error sending page view:', error);
  });
})();
</script>
```

3. **Acionamento:** 
   - Tipo: Visualização de página
   - Condição: `Page URL` contém `/vsl` (ou sua URL da VSL)

#### Tag 2: Generate Lead

1. **Tipo de tag:** Tag HTML personalizada
2. **HTML:**

```html
<script>
(function() {
  // Capturar dados do formulário ou dataLayer
  var email = {{Form Email}} || '';
  var name = {{Form Name}} || '';
  var phone = {{Form Phone}} || '';
  
  fetch('{{Dashboard API Base URL}}/generate-lead', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: '{{User ID}}',
      session_id: '{{Session ID}}',
      email: email,
      name: name,
      phone: phone,
      source: 'vsl_creatina',
      page_url: '{{Page URL}}',
      referrer: '{{Referrer}}'
    })
  }).catch(function(error) {
    console.error('Error sending lead:', error);
  });
})();
</script>
```

3. **Acionamento:**
   - Tipo: Evento personalizado
   - Nome do evento: `generate_lead` (ou o evento que você já usa no GA4)

#### Tag 3: Begin Checkout

1. **Tipo de tag:** Tag HTML personalizada
2. **HTML:**

```html
<script>
(function() {
  var productId = {{Product ID}} || '';
  var productName = {{Product Name}} || '';
  var value = {{Product Price}} || 0;
  
  fetch('{{Dashboard API Base URL}}/begin-checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: '{{User ID}}',
      session_id: '{{Session ID}}',
      product_id: productId,
      product_name: productName,
      value: value,
      currency: 'BRL',
      page_url: '{{Page URL}}',
      referrer: '{{Referrer}}'
    })
  }).catch(function(error) {
    console.error('Error sending checkout:', error);
  });
})();
</script>
```

3. **Acionamento:**
   - Tipo: Evento personalizado
   - Nome do evento: `begin_checkout` (ou o evento que você já usa no GA4)

#### Tag 4: Purchase

1. **Tipo de tag:** Tag HTML personalizada
2. **HTML:**

```html
<script>
(function() {
  var transactionId = {{Transaction ID}} || '';
  var value = {{Transaction Value}} || 0;
  var productId = {{Product ID}} || '';
  var productName = {{Product Name}} || '';
  
  fetch('{{Dashboard API Base URL}}/purchase', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: '{{User ID}}',
      session_id: '{{Session ID}}',
      transaction_id: transactionId,
      value: value,
      currency: 'BRL',
      product_id: productId,
      product_name: productName,
      quantity: 1,
      page_url: '{{Page URL}}',
      referrer: '{{Referrer}}'
    })
  }).catch(function(error) {
    console.error('Error sending purchase:', error);
  });
})();
</script>
```

3. **Acionamento:**
   - Tipo: Evento personalizado
   - Nome do evento: `purchase` (ou o evento que você já usa no GA4)

### Passo 3: Testar

1. Ative o **Modo de visualização** no GTM
2. Navegue pelo site e execute as ações (visualizar VSL, gerar lead, iniciar checkout, comprar)
3. Verifique no console do GTM se as tags estão disparando
4. Verifique no dashboard se os eventos estão sendo recebidos

### Passo 4: Publicar

1. Clique em **Enviar** no GTM
2. Adicione um nome e descrição para a versão
3. Publique

---

## Mapeamento de Eventos

| Evento GTM | Endpoint Dashboard | Métrica no Dashboard |
|------------|-------------------|---------------------|
| `page_view` | `/api/gtm/page-view` | Views VSL |
| `generate_lead` | `/api/gtm/generate-lead` | Leads Gerados |
| `begin_checkout` | `/api/gtm/begin-checkout` | Checkout Iniciado |
| `purchase` | `/api/gtm/purchase` | Vendas Concluídas |

---

## Testando os Endpoints

Você pode testar os endpoints usando cURL:

```bash
# Testar Page View
curl -X POST https://3000-i1k5hywttfymjrcbwoydk-a0d3822d.us2.manus.computer/api/gtm/page-view \
  -H "Content-Type: application/json" \
  -d '{
    "page_url": "https://seusite.com/vsl",
    "page_title": "VSL - Creatina Pro 797"
  }'

# Testar Generate Lead
curl -X POST https://3000-i1k5hywttfymjrcbwoydk-a0d3822d.us2.manus.computer/api/gtm/generate-lead \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@example.com",
    "name": "João Teste",
    "source": "vsl_creatina"
  }'

# Testar Purchase
curl -X POST https://3000-i1k5hywttfymjrcbwoydk-a0d3822d.us2.manus.computer/api/gtm/purchase \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "TEST123",
    "value": 797.00,
    "product_name": "Creatina Pro 797"
  }'
```

---

## Troubleshooting

### Os eventos não estão aparecendo no dashboard

1. Verifique se as tags estão disparando no modo de visualização do GTM
2. Abra o console do navegador e procure por erros de rede
3. Verifique se a URL do endpoint está correta
4. Teste o endpoint diretamente com cURL

### Erro de CORS

Se você receber erro de CORS, entre em contato com o suporte técnico.

### Dados incompletos

Certifique-se de que todas as variáveis necessárias estão sendo capturadas corretamente no GTM.

---

## Suporte

Para dúvidas ou problemas, entre em contato com o time técnico da DouraVita.
