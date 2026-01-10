# Guia GTM God Mode 🚀 (Versão Full Analytics + Gateway)

Este guia descreve como configurar o "Modo Deus" no Google Tag Manager para capturar **eventos críticos de e-commerce**, metadados completos e o **Título do Checkout** do seu gateway de pagamento.

## 1. Eventos Monitorados
O script abaixo captura e envia automaticamente:
-   `page_view`, `generate_lead`, `view_item`, `add_to_cart`, `begin_checkout`, `purchase`.

---

## 2. Configurações Iniciais (Variáveis)
Crie estas variáveis no GTM (**Variáveis > Definidas pelo Usuário > Constante**):

-   **Metas - Endpoint URL**: `https://gtm-producer.ferramentas-bce.workers.dev/`
    > ⚠️ **Atualizado em Jan/2026**: Agora usa Cloudflare Queue para batching (reduz custos em 90%)
-   **Metas - Secret Token**: `b646bc7e395f08aa2ee33001fbd6056874c3e0b732e6ed1b62dd251825d4f276`


---

## 3. O Script God Mode Full (Com Checkout Title)
Crie uma nova tag do tipo **HTML Personalizado**. Este script captura o **Título do Checkout/Link de Pagamento** do gateway (se disponível no DataLayer ou URL) e todos os dados de produtos.

```html
<script>
(function() {
  // 1. Configurações Base
  var endpoint = {{Metas - Endpoint URL}};
  var secret = {{Metas - Secret Token}};
  var eventName = {{Event}};
  
  // 2. Metadados do Navegador e UTMs (Incluso)
  var urlParams = new URLSearchParams(window.location.search);
  var payload = {
    event_name: eventName,
    page_url: window.location.href,
    page_title: document.title, // Título da aba do navegador
    referrer: document.referrer,
    utm_source: urlParams.get('utm_source'),
    utm_medium: urlParams.get('utm_medium'),
    utm_campaign: urlParams.get('utm_campaign'),
    utm_content: urlParams.get('utm_content'),
    utm_term: urlParams.get('utm_term'),
    device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
    browser: (function() {
      var ua = navigator.userAgent;
      if (ua.indexOf("Chrome") > -1) return "Chrome";
      if (ua.indexOf("Firefox") > -1) return "Firefox";
      if (ua.indexOf("Safari") > -1) return "Safari";
      return "Other";
    })(),
    os: navigator.platform,
    screen_resolution: window.screen.width + 'x' + window.screen.height
  };

  // 3. Captura Detalhada de E-commerce e Checkout Title
  var eventData = {};
  try {
    var ecommerce = window.google_tag_manager[{{Container ID}}].dataLayer.get('ecommerce');
    
    if (ecommerce) {
      eventData.currency = ecommerce.currency || 'BRL';
      eventData.value = ecommerce.value || 0;
      eventData.transaction_id = ecommerce.transaction_id || '';
      
      // Captura o Título do Link de Pagamento / Checkout Title do Gateway
      // Se o seu gateway envia o nome da oferta ou link, mapeie aqui:
      eventData.checkout_title = ecommerce.checkout_title || ecommerce.payment_link_title || '';
      
      if (ecommerce.items && ecommerce.items.length > 0) {
        eventData.produtos = ecommerce.items.map(function(item) {
          return {
            name: item.item_name || item.name,
            price: item.price,
            id: item.item_id || item.id
          };
        });
        eventData.product_name = eventData.produtos[0].name;
        eventData.price = eventData.produtos[0].price;
      }
    }

    // Se o checkout_title estiver vazio, tenta pegar de uma variável personalizada do GTM
    if (!eventData.checkout_title) {
      // Exemplo: se você criou uma variável {{Checkout Title}} no GTM
      // eventData.checkout_title = {{Checkout Title}} || '';
    }

    if (eventName === 'begin_checkout' || eventName === 'add_to_cart') {
      eventData.checkout_url = window.location.href;
    }
    
  } catch(e) { console.warn('Metas Vendas: Erro DataLayer', e); }

  payload.event_data = eventData;

  // 4. Envio para o Dashboard
  fetch(endpoint, {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'application/json', 'X-GTM-Secret': secret },
    body: JSON.stringify(payload)
  });
})();
</script>
```

---

## 4. O que está sendo enviado (Resumo)

| Campo | Descrição |
| :--- | :--- |
| **UTMs** | Source, Medium, Campaign, etc. (Mantido) |
| **Checkout Title** | **O título do link de pagamento/oferta criado no gateway.** |
| **Páginas** | URL da página e URL do Checkout. |
| **Produtos** | Lista de `produtos`, `name`, `id`, `price` e `currency`. |
| **Metadata** | Navegador, SO e Resolução. |

---

## 5. Acionamento
Use um acionador de **Evento Personalizado** com o nome `.*` (marcando "Usar correspondência de expressão regular") para capturar todos os eventos automaticamente.

## 6. VTurb Conversion Tracking (Atribuição de Vendas)

Envia dados de compra do checkout para o VTurb.

### 6.1 O que o Checkout Precisa Enviar

O DataLayer precisa ter estes dados no momento do `purchase`:

```javascript
dataLayer.push({
  event: 'purchase',
  vtid: 'abc123xyz',  // ⚠️ OBRIGATÓRIO para atribuição
  ecommerce: {
    value: 900,       // Valor em reais
    currency: 'BRL',
    items: [{ item_name: 'Produto XYZ' }]
  }
});
```

### 6.2 Tag GTM (HTML Personalizado)

Cole este código em uma tag **HTML Personalizado**:

```html
<script>
(function() {
  var TOKEN = 'd00bfb43-9236-4007-9091-94480bcd326e';
  var URL = 'https://tracker.vturb.com/conversions/payt?t=' + TOKEN;
  
  // Busca dados no dataLayer
  var vtid = null, ecom = null;
  for (var i = dataLayer.length - 1; i >= 0; i--) {
    if (dataLayer[i].vtid) vtid = dataLayer[i].vtid;
    if (dataLayer[i].ecommerce) ecom = dataLayer[i].ecommerce;
    if (vtid && ecom) break;
  }
  
  if (!vtid) { console.warn('[VTurb] vtid não encontrado'); return; }
  if (!ecom) { console.warn('[VTurb] ecommerce não encontrado'); return; }
  
  var data = {
    order_amount_cents: Math.round((ecom.value || 0) * 100),
    currency: ecom.currency || 'BRL',
    conversion_key: vtid,
    product_name: ecom.items && ecom.items[0] ? (ecom.items[0].item_name || '') : '',
    category: 'initial_sale',
    order_created_at: new Date().toISOString(),
    order_ip: ''
  };
  
  console.log('[VTurb] Enviando:', data);
  
  fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(function(r) {
    console.log('[VTurb] Status:', r.status);
  }).catch(function(e) {
    console.error('[VTurb] Erro:', e);
  });
})();
</script>
```

### 6.3 Acionador

- **Tipo:** Evento Personalizado
- **Nome do evento:** `purchase`

### 6.4 Debug (Testar no Console)

Abra o Console (F12) e cole isso para ver o que tem no DataLayer:

```javascript
// Ver todo o dataLayer
console.log(dataLayer);

// Buscar vtid
dataLayer.forEach(function(item, i) {
  if (item.vtid) console.log('vtid encontrado na posição', i, ':', item.vtid);
  if (item.ecommerce) console.log('ecommerce encontrado na posição', i, ':', item.ecommerce);
});
```

### 6.5 Problemas Comuns

| Problema | Solução |
|----------|---------|
| `vtid não encontrado` | O checkout não está enviando o `vtid`. Precisa adicionar no DataLayer push. |
| `ecommerce não encontrado` | O checkout não está enviando os dados de compra. Verificar integração. |
| CORS error | Normal em alguns navegadores - a conversão ainda é enviada. |
| Status 4xx | Token inválido ou dados incorretos. Verificar com VTurb. |


