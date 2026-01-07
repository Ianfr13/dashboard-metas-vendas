# Guia GTM God Mode 🚀 (Versão Full Analytics + Gateway)

Este guia descreve como configurar o "Modo Deus" no Google Tag Manager para capturar **eventos críticos de e-commerce**, metadados completos e o **Título do Checkout** do seu gateway de pagamento.

## 1. Eventos Monitorados
O script abaixo captura e envia automaticamente:
-   `page_view`, `generate_lead`, `view_item`, `add_to_cart`, `begin_checkout`, `purchase`.

---

## 2. Configurações Iniciais (Variáveis)
Crie estas variáveis no GTM (**Variáveis > Definidas pelo Usuário > Constante**):

-   **Metas - Endpoint URL**: `https://auvvrewlbpyymekonilv.supabase.co/functions/v1/gtm-event`
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
