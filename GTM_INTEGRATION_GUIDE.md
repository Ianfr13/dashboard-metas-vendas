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

---

## 6. VTurb Conversion Tracking (Atribuição de Vendas)

Este tag envia dados de conversão (compra) para o VTurb para rastrear de qual VSL veio cada venda. O VTurb usa os parâmetros `sck`, `src` ou `vtid` da URL para fazer a atribuição.

### 6.1 Criar a Tag no GTM

Crie uma nova tag do tipo **HTML Personalizado** com o nome `VTurb - Conversion Tracking`:

```html
<script>
(function() {
  // === CONFIGURAÇÃO ===
  var VTURB_TOKEN = 'd00bfb43-9236-4007-9091-94480bcd326e';
  var VTURB_ENDPOINT = 'https://tracker.vturb.com/conversions/payt?t=' + VTURB_TOKEN;
  
  // === CAPTURA DE DADOS ===
  var urlParams = new URLSearchParams(window.location.search);
  
  // Busca a conversion_key (sck, src ou vtid) - necessário para atribuição do VTurb
  var conversionKey = urlParams.get('sck') || urlParams.get('src') || urlParams.get('vtid') || '';
  
  if (!conversionKey) {
    // Tenta buscar de cookies ou localStorage (caso tenha sido salvo antes)
    conversionKey = localStorage.getItem('vturb_conversion_key') || 
                    document.cookie.split('; ').find(row => row.startsWith('vturb_key='))?.split('=')[1] || '';
  }
  
  // Se ainda não tiver a key, aborta (não tem como atribuir)
  if (!conversionKey) {
    console.warn('[VTurb] Nenhuma conversion_key encontrada. Conversão não será rastreada.');
    return;
  }
  
  // === DADOS DO E-COMMERCE (DataLayer) ===
  var orderAmount = 0;
  var currency = 'BRL';
  var productName = '';
  var transactionId = '';
  
  try {
    var ecommerce = window.google_tag_manager[{{Container ID}}].dataLayer.get('ecommerce');
    if (ecommerce) {
      orderAmount = Math.round((ecommerce.value || 0) * 100); // Converte para centavos
      currency = ecommerce.currency || 'BRL';
      transactionId = ecommerce.transaction_id || '';
      
      if (ecommerce.items && ecommerce.items.length > 0) {
        productName = ecommerce.items[0].item_name || ecommerce.items[0].name || '';
      }
    }
  } catch(e) {
    console.warn('[VTurb] Erro ao ler DataLayer:', e);
  }
  
  // === PAYLOAD PARA O VTURB ===
  var payload = {
    order_amount_cents: orderAmount,
    currency: currency,
    conversion_key: conversionKey,
    product_name: productName,
    category: "initial_sale",
    order_created_at: new Date().toISOString(),
    order_ip: "" // O VTurb pega automaticamente do request, deixe vazio
  };
  
  // === ENVIO ===
  fetch(VTURB_ENDPOINT, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  .then(function(response) {
    if (response.ok) {
      console.log('[VTurb] Conversão enviada com sucesso:', payload);
    } else {
      console.error('[VTurb] Erro ao enviar conversão:', response.status);
    }
  })
  .catch(function(error) {
    console.error('[VTurb] Erro de rede:', error);
  });
})();
</script>
```

### 6.2 Acionador da Tag

Configure um acionador de **Evento Personalizado** com:
- **Nome do evento**: `purchase`
- **Este acionador dispara em**: Todos os eventos personalizados

### 6.3 Salvar a Conversion Key (Opcional)

Se quiser garantir que a `conversion_key` seja preservada mesmo se o usuário navegar entre páginas antes de comprar, adicione esta tag para rodar em **Todas as Páginas**:

```html
<script>
(function() {
  var urlParams = new URLSearchParams(window.location.search);
  var key = urlParams.get('sck') || urlParams.get('src') || urlParams.get('vtid');
  
  if (key) {
    // Salva no localStorage por 7 dias
    localStorage.setItem('vturb_conversion_key', key);
    
    // Também salva em cookie (fallback)
    var expires = new Date();
    expires.setDate(expires.getDate() + 7);
    document.cookie = 'vturb_key=' + key + ';expires=' + expires.toUTCString() + ';path=/';
  }
})();
</script>
```

### 6.4 Campos Enviados

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| `order_amount_cents` | Valor em centavos | `19900` (R$ 199,00) |
| `currency` | Moeda | `BRL` |
| `conversion_key` | Parâmetro de atribuição (sck/src/vtid) | `abc123xyz` |
| `product_name` | Nome do produto | `Curso XYZ` |
| `category` | Tipo da conversão | `initial_sale` |
| `order_created_at` | Data/hora da compra (ISO) | `2026-01-10T15:30:00.000Z` |
| `order_ip` | IP do cliente | (Capturado pelo VTurb) |
