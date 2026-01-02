# Guia GTM God Mode 🚀

Este guia descreve como configurar o "Modo Deus" no Google Tag Manager para capturar **absolutamente tudo** o que acontece no seu site e enviar para o dashboard.

## 1. Variáveis de Configuração
Certifique-se de que estas variáveis estão criadas no GTM (**Variáveis > Definidas pelo Usuário > Constante**):

-   **Metas - Endpoint URL**: `https://auvvrewlbpyymekonilv.supabase.co/functions/v1/gtm-event`
-   **Metas - Secret Token**: `b646bc7e395f08aa2ee33001fbd6056874c3e0b732e6ed1b62dd251825d4f276`

---

## 2. O Script God Mode
Crie uma nova tag do tipo **HTML Personalizado** e utilize o código abaixo. Este script é inteligente: ele captura UTMs da URL, dados de dispositivo, e o conteúdo do DataLayer automaticamente.

```html
<script>
(function() {
  // 1. Configurações
  var endpoint = {{Metas - Endpoint URL}};
  var secret = {{Metas - Secret Token}};
  var eventName = {{Event}}; // Variável nativa do GTM
  
  // 2. Captura de metadados do navegador
  var metadata = {
    page_url: window.location.href,
    page_title: document.title,
    referrer: document.referrer,
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

  // 3. Captura automática de UTMs da URL
  var urlParams = new URLSearchParams(window.location.search);
  var utms = {
    utm_source: urlParams.get('utm_source'),
    utm_medium: urlParams.get('utm_medium'),
    utm_campaign: urlParams.get('utm_campaign'),
    utm_content: urlParams.get('utm_content'),
    utm_term: urlParams.get('utm_term')
  };

  // 4. Captura de dados do evento (DataLayer)
  // O GTM preenche automaticamente variáveis de camada de dados se você as mapear.
  // Aqui pegamos dados comuns de e-commerce caso existam no evento atual.
  var eventData = {};
  
  if (eventName === 'purchase' || eventName === 'begin_checkout' || eventName === 'view_item') {
    // Tenta pegar o valor total e o primeiro produto
    try {
      var dl = window.google_tag_manager[{{Container ID}}].dataLayer.get('ecommerce');
      if (dl) {
        eventData.value = dl.value || 0;
        eventData.transaction_id = dl.transaction_id || '';
        if (dl.items && dl.items.length > 0) {
          eventData.product_name = dl.items[0].item_name;
          eventData.item_id = dl.items[0].item_id;
        }
      }
    } catch(e) {}
  }

  // 5. Google Analytics IDs (Opcional - Ajuda na atribuição)
  var sessionId = (document.cookie.match(/_ga_session_id_([^=]+)=([^;]+)/) || [])[2];
  
  // 6. Montagem do Payload Final
  var payload = Object.assign({}, metadata, utms, {
    event_name: eventName,
    event_data: eventData,
    session_id: sessionId || null
  });

  // 7. Envio para o Dashboard
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

## 3. Acionamento Sugerido
Para que este script funcione como "Modo Deus", você deve dispará-lo em:
-   **Todos os eventos** que você deseja rastrear (`page_view`, `view_item`, `add_to_cart`, `begin_checkout`, `purchase`).
-   Ou crie um acionador de **Evento Personalizado** com o nome `.*` (marcando a opção "Usar correspondência de expressão regular").

## 4. O que será coletado automaticamente?
Ao usar este script, o seu dashboard receberá:
1.  **Origem do Tráfego**: UTM Source, Medium, Campaign, Content e Term.
2.  **Tecnologia**: Navegador, Resolução de Tela, SO e se é Mobile/Desktop.
3.  **Comportamento**: URL exata, Título da página e Referrer (de onde ele veio).
4.  **E-commerce**: Valor da transação e nome do produto (baseado no padrão GA4).
