# API de Webhooks - Dashboard DouraVita

Esta documentação descreve como integrar seu gateway de pagamento com o Dashboard de Metas de Vendas da DouraVita para computar vendas automaticamente em tempo real.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Endpoints Disponíveis](#endpoints-disponíveis)
- [Endpoint Genérico](#endpoint-genérico)
- [Endpoints Específicos](#endpoints-específicos)
- [Exemplos de Integração](#exemplos-de-integração)
- [Segurança](#segurança)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

A API de webhooks permite que gateways de pagamento enviem notificações de vendas diretamente para o dashboard. Cada venda é automaticamente:

1. **Classificada** como Marketing Direto ou Comercial (High-Ticket)
2. **Atribuída** ao cenário e semana corretos baseado na data
3. **Computada** nas métricas diárias em tempo real
4. **Armazenada** no banco de dados para histórico

### URL Base

```
https://seu-dominio.manus.space/api/webhooks
```

---

## 🔌 Endpoints Disponíveis

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/sale` | POST | Endpoint genérico para qualquer gateway |
| `/stripe` | POST | Específico para Stripe |
| `/hotmart` | POST | Específico para Hotmart |
| `/kiwify` | POST | Específico para Kiwify |
| `/braip` | POST | Específico para Braip |
| `/test` | GET | Criar venda de teste |

---

## 🌐 Endpoint Genérico

### POST `/api/webhooks/sale`

Endpoint universal que aceita vendas de qualquer plataforma.

#### Request Body

```json
{
  "product_name": "Assinatura Creatina Pro",
  "amount": 797,
  "date": "2025-01-15T10:30:00Z",
  "is_high_ticket": false,
  "metadata": {
    "customer_email": "cliente@example.com",
    "transaction_id": "TXN123456",
    "payment_method": "credit_card"
  }
}
```

#### Parâmetros

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `product_name` | string | ✅ | Nome do produto vendido |
| `amount` | number | ✅ | Valor da venda em reais (ex: 797.00) |
| `date` | string | ❌ | Data/hora da venda (ISO 8601). Se omitido, usa data atual |
| `is_high_ticket` | boolean | ❌ | Se `true`, classifica como venda comercial. Se `false` ou omitido, classifica como marketing direto |
| `metadata` | object | ❌ | Dados adicionais para referência |

#### Response Success (200)

```json
{
  "success": true,
  "message": "Sale processed successfully",
  "data": {
    "scenario": "3M",
    "week": 3,
    "type": "marketing_direct"
  }
}
```

#### Response Error (400/500)

```json
{
  "error": "Missing required fields: product_name, amount"
}
```

---

## 🎨 Endpoints Específicos

### Stripe

**POST** `/api/webhooks/stripe`

Recebe eventos do Stripe Webhooks. Processa automaticamente eventos de:
- `checkout.session.completed`
- `payment_intent.succeeded`

#### Headers Necessários
```
stripe-signature: <assinatura_do_stripe>
```

#### Configuração no Stripe
1. Acesse o Dashboard do Stripe
2. Vá em **Developers** → **Webhooks**
3. Adicione endpoint: `https://seu-dominio.manus.space/api/webhooks/stripe`
4. Selecione eventos: `checkout.session.completed` e `payment_intent.succeeded`
5. Copie o **Webhook Secret** e configure como `STRIPE_WEBHOOK_SECRET` nas variáveis de ambiente

---

### Hotmart

**POST** `/api/webhooks/hotmart`

Recebe notificações do Hotmart. Processa eventos:
- `PURCHASE_APPROVED`
- `PURCHASE_COMPLETE`

#### Exemplo de Payload

```json
{
  "event": "PURCHASE_APPROVED",
  "data": {
    "product": {
      "name": "Assinatura Creatina Pro"
    },
    "purchase": {
      "price": {
        "value": "797.00"
      },
      "approved_date": "2025-01-15T10:30:00Z",
      "transaction": "HP-123456789"
    },
    "buyer": {
      "email": "cliente@example.com"
    }
  }
}
```

#### Configuração no Hotmart
1. Acesse **Ferramentas** → **Webhook/Postback**
2. Adicione URL: `https://seu-dominio.manus.space/api/webhooks/hotmart`
3. Selecione evento: **Compra Aprovada**

---

### Kiwify

**POST** `/api/webhooks/kiwify`

Recebe notificações da Kiwify. Processa pedidos com status:
- `paid`
- `approved`

#### Exemplo de Payload

```json
{
  "order_status": "paid",
  "Product": {
    "product_name": "Assinatura Creatina Pro"
  },
  "order_amount": "797.00",
  "created_at": "2025-01-15T10:30:00Z"
}
```

#### Configuração na Kiwify
1. Acesse **Configurações** → **Webhooks**
2. Adicione URL: `https://seu-dominio.manus.space/api/webhooks/kiwify`
3. Ative notificações de **Pagamento Aprovado**

---

### Braip

**POST** `/api/webhooks/braip`

Recebe notificações da Braip/Eduzz. Processa transações com status `1` (aprovada).

#### Exemplo de Payload

```json
{
  "trans_status": "1",
  "prod_name": "Assinatura Creatina Pro",
  "trans_value": "797.00",
  "trans_createdate": "2025-01-15 10:30:00"
}
```

#### Configuração na Braip
1. Acesse **Configurações** → **Postback**
2. Adicione URL: `https://seu-dominio.manus.space/api/webhooks/braip`
3. Ative para **Transação Aprovada**

---

## 💡 Exemplos de Integração

### cURL

```bash
curl -X POST https://seu-dominio.manus.space/api/webhooks/sale \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Assinatura Creatina Pro",
    "amount": 797,
    "is_high_ticket": false
  }'
```

### JavaScript (Fetch)

```javascript
fetch('https://seu-dominio.manus.space/api/webhooks/sale', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    product_name: 'Assinatura Creatina Pro',
    amount: 797,
    is_high_ticket: false,
    metadata: {
      customer_email: 'cliente@example.com'
    }
  })
})
.then(response => response.json())
.then(data => console.log('Venda registrada:', data))
.catch(error => console.error('Erro:', error));
```

### Python (Requests)

```python
import requests

url = 'https://seu-dominio.manus.space/api/webhooks/sale'
payload = {
    'product_name': 'Assinatura Creatina Pro',
    'amount': 797,
    'is_high_ticket': False,
    'metadata': {
        'customer_email': 'cliente@example.com'
    }
}

response = requests.post(url, json=payload)
print('Venda registrada:', response.json())
```

### PHP

```php
<?php
$url = 'https://seu-dominio.manus.space/api/webhooks/sale';
$data = array(
    'product_name' => 'Assinatura Creatina Pro',
    'amount' => 797,
    'is_high_ticket' => false,
    'metadata' => array(
        'customer_email' => 'cliente@example.com'
    )
);

$options = array(
    'http' => array(
        'header'  => "Content-type: application/json\r\n",
        'method'  => 'POST',
        'content' => json_encode($data)
    )
);

$context  = stream_context_create($options);
$result = file_get_contents($url, false, $context);
echo 'Venda registrada: ' . $result;
?>
```

---

## 🔐 Segurança

### Validação de Assinatura (Recomendado)

Para garantir que as requisições vêm realmente do seu gateway de pagamento, configure as seguintes variáveis de ambiente:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
HOTMART_WEBHOOK_SECRET=xxxxxxxxxxxxx
KIWIFY_WEBHOOK_SECRET=xxxxxxxxxxxxx
BRAIP_WEBHOOK_SECRET=xxxxxxxxxxxxx
```

### IP Whitelist (Opcional)

Você pode restringir o acesso aos webhooks apenas para IPs conhecidos dos gateways:

**Stripe:**
- `3.18.12.63`
- `3.130.192.231`
- `13.235.14.237`
- `13.235.122.149`

**Hotmart:**
- `54.207.92.171`
- `18.231.194.64`

### Cenário Padrão

Por padrão, as vendas são atribuídas ao cenário **3M**. Para alterar, configure:

```env
DEFAULT_SCENARIO=4M  # ou 5M
```

---

## 🔍 Troubleshooting

### Erro: "Missing required fields"

**Causa:** Campos obrigatórios (`product_name` ou `amount`) não foram enviados.

**Solução:** Verifique se o payload contém todos os campos obrigatórios.

---

### Erro: "Failed to process sale"

**Causa:** Erro ao salvar no banco de dados.

**Solução:** 
1. Verifique se o banco de dados está acessível
2. Confirme que as tabelas foram criadas corretamente
3. Verifique os logs do servidor para mais detalhes

---

### Venda não aparece no dashboard

**Causa:** A data da venda pode estar fora do período de janeiro/2025.

**Solução:** 
1. Verifique o campo `date` no payload
2. Certifique-se de que a data está entre 01/01/2025 e 31/01/2025
3. Use o formato ISO 8601: `2025-01-15T10:30:00Z`

---

### Como testar a integração?

Use o endpoint de teste:

```bash
curl -X GET https://seu-dominio.manus.space/api/webhooks/test
```

Isso criará uma venda de teste no banco de dados.

---

## 📊 Lógica de Classificação

### Marketing Direto vs Comercial

- **Marketing Direto:** Vendas com valor < R$ 5.000 ou `is_high_ticket: false`
- **Comercial (High-Ticket):** Vendas com valor ≥ R$ 5.000 ou `is_high_ticket: true`

### Atribuição de Semana

Baseado no dia do mês:
- **Semana 1:** Dias 1-7
- **Semana 2:** Dias 8-14
- **Semana 3:** Dias 15-21
- **Semana 4:** Dias 22-31

---

## 📞 Suporte

Para dúvidas ou problemas com a integração, entre em contato através do dashboard ou consulte os logs do servidor.

---

**Última atualização:** 24/12/2024
