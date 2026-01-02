# Guia GTM God Mode 🚀 (Versão Full Analytics)

Este guia descreve como configurar o "Modo Deus" no Google Tag Manager para capturar **eventos críticos de e-commerce** e metadados completos (UTMs, dispositivo, etc).

## 1. Eventos Monitorados
O script abaixo está preparado para capturar e enviar automaticamente estes eventos:
-   `page_view`: Visualização de qualquer página.
-   `generate_lead`: Cadastro de lead / formulário.
-   `view_item`: Visualização de produto.
-   `add_to_cart`: Adição ao carrinho.
-   `begin_checkout`: Início do pagamento.
-   `purchase`: Compra finalizada.

---

## 2. Configurações Iniciais (Variáveis)
Crie estas variáveis no GTM (**Variáveis > Definidas pelo Usuário > Constante**):

-   **Metas - Endpoint URL**: `https://auvvrewlbpyymekonilv.supabase.co/functions/v1/gtm-event`
-   **Metas - Secret Token**: `b646bc7e395f08aa2ee33001fbd6056874c3e0b732e6ed1b62dd251825d4f276`

---

## 3. O Script God Mode Full
Crie uma nova tag do tipo **HTML Personalizado** e utilize o código abaixo. Ele foi otimizado para o padrão GA4 (DataLayer).

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
    page_title: document.title,
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

  // 3. Captura Detalhada de E-commerce (Produtos, Preço, Moeda)
  var eventData = {};
  try {
    // Tenta ler do padrão GA4 (dataLayer.ecommerce)
    var ecommerce = window.google_tag_manager[{{Container ID}}].dataLayer.get('ecommerce');
    
    if (ecommerce) {
      eventData.currency = ecommerce.currency || 'BRL';
      eventData.value = ecommerce.value || 0;
      eventData.transaction_id = ecommerce.transaction_id || '';
      
      // Captura a lista de produtos (produtos / name / price)
      if (ecommerce.items && ecommerce.items.length > 0) {
        eventData.produtos = ecommerce.items.map(function(item) {
          return {
            name: item.item_name || item.name,
            price: item.price,
            id: item.item_id || item.id,
            quantity: item.quantity || 1
          };
        });
        // Atalho para o nome do primeiro produto (facilita filtros rápidos)
        eventData.product_name = eventData.produtos[0].name;
        eventData.price = eventData.produtos[0].price;
      }
    }

    // Se for um evento de checkout, salva a URL de checkout especificamente
    if (eventName === 'begin_checkout' || eventName === 'add_to_cart') {
      eventData.checkout_url = window.location.href;
    }
    
  } catch(e) {
    console.warn('Metas Vendas: Erro ao mapear DataLayer', e);
  }

  payload.event_data = eventData;

  // 4. Envio para o Dashboard
  fetch(endpoint, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      'X-GTM-Secret': secret
    },
    body: JSON.stringify(payload)
  })
  .then(function(res) { /* Sucesso */ })
  .catch(function(err) { console.error('Metas Vendas Error:', err); });
})();
</script>
```

---

## 4. O que está sendo enviado (Resumo para o Usuário)

| Campo | Fonte | Descrição |
| :--- | :--- | :--- |
| **UTMs** | URL | Source, Medium, Campaign, etc. (Mantido conforme solicitado) |
| **Páginas** | Browser | `page_url`, `page_title` (Title), `referrer` |
| **Produtos** | DataLayer | Lista completa de `produtos` com `name` e `item_id` |
| **Financeiro** | DataLayer | `price` (preço) e `currency` (moeda) |
| **Fluxo** | DataLayer | `Checkout url` associada aos eventos de carrinho/checkout |
| **Dispositivo** | Browser | Navegador, SO e Resolução |

---

## 5. Acionamento
1.  Vá em **Acionadores > Novo**.
2.  Tipo: **Evento Personalizado**.
3.  Nome do Evento: `.*` (Marque "Usar correspondência de expressão regular").
4.  Isso fará com que o script "escute" todos os eventos e envie os dados mapeados para o dashboard.
