# GTM Debug Script 🔍

Use este script **temporariamente** no GTM para ver logs detalhados no console do browser.

## Script com Logs Completos

Substitua o script atual no GTM por este:

```html
<script>
(function() {
  console.log('[GTM-DEBUG] ===== INICIANDO SCRIPT =====');
  
  // 1. Configurações Base
  var endpoint = {{Metas - Endpoint URL}};
  var secret = {{Metas - Secret Token}};
  var eventName = {{Event}};
  
  console.log('[GTM-DEBUG] Endpoint:', endpoint);
  console.log('[GTM-DEBUG] Event Name:', eventName);
  console.log('[GTM-DEBUG] Secret (primeiros 10 chars):', secret ? secret.substring(0, 10) + '...' : 'NÃO DEFINIDO');
  
  // FILTRO DE EVENTOS - só processa eventos específicos
  var allowedEvents = ['page_view', 'view_item', 'add_to_cart', 'view_cart', 'begin_checkout', 'purchase', 'generate_lead'];
  if (allowedEvents.indexOf(eventName) === -1) {
    console.log('[GTM-DEBUG] ⚠️ Evento IGNORADO (não está na lista):', eventName);
    return;
  }
  console.log('[GTM-DEBUG] ✅ Evento na lista permitida:', eventName);
  
  // 2. Metadados do Navegador e UTMs
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
  
  console.log('[GTM-DEBUG] Payload base criado:', JSON.stringify(payload, null, 2));

  // 3. Captura Detalhada de E-commerce
  var eventData = {};
  try {
    var containerId = {{Container ID}};
    console.log('[GTM-DEBUG] Container ID:', containerId);
    
    var gtmContainer = window.google_tag_manager[containerId];
    if (!gtmContainer) {
      console.warn('[GTM-DEBUG] ⚠️ Container GTM não encontrado!');
    } else {
      var ecommerce = gtmContainer.dataLayer.get('ecommerce');
      console.log('[GTM-DEBUG] DataLayer ecommerce:', ecommerce);
      
      if (ecommerce) {
        eventData.currency = ecommerce.currency || 'BRL';
        eventData.value = ecommerce.value || 0;
        eventData.transaction_id = ecommerce.transaction_id || '';
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
        console.log('[GTM-DEBUG] Event Data extraído:', eventData);
      } else {
        console.log('[GTM-DEBUG] Nenhum dado ecommerce no DataLayer');
      }
    }
    
    if (eventName === 'begin_checkout' || eventName === 'add_to_cart') {
      eventData.checkout_url = window.location.href;
    }
    
  } catch(e) { 
    console.warn('[GTM-DEBUG] ❌ Erro ao ler DataLayer:', e); 
  }

  payload.event_data = eventData;
  
  console.log('[GTM-DEBUG] ===== PAYLOAD FINAL =====');
  console.log('[GTM-DEBUG] Payload completo:', JSON.stringify(payload, null, 2));

  // 4. Envio para o Dashboard
  console.log('[GTM-DEBUG] 🚀 Enviando para:', endpoint);
  
  fetch(endpoint, {
    method: 'POST',
    mode: 'cors',
    headers: { 
      'Content-Type': 'application/json', 
      'X-GTM-Secret': secret 
    },
    body: JSON.stringify(payload)
  })
  .then(function(response) {
    console.log('[GTM-DEBUG] ✅ Response Status:', response.status);
    console.log('[GTM-DEBUG] Response OK:', response.ok);
    console.log('[GTM-DEBUG] Response Headers:', [...response.headers.entries()]);
    return response.text();
  })
  .then(function(text) {
    console.log('[GTM-DEBUG] ✅ Response Body:', text);
    try {
      var json = JSON.parse(text);
      console.log('[GTM-DEBUG] Response JSON:', json);
    } catch(e) {
      console.log('[GTM-DEBUG] Response não é JSON válido');
    }
  })
  .catch(function(error) {
    console.error('[GTM-DEBUG] ❌ ERRO NO FETCH:', error);
    console.error('[GTM-DEBUG] Tipo do erro:', error.name);
    console.error('[GTM-DEBUG] Mensagem:', error.message);
  });
  
  console.log('[GTM-DEBUG] ===== FETCH INICIADO (async) =====');
})();
</script>
```

## Como usar

1. **No GTM**: Vá até a tag "Metas Vendas" (ou similar) e substitua o script pelo acima
2. **Publique** no GTM (pode ser no modo Preview)
3. **Abra o Console** do browser (F12 > Console)
4. **Navegue** no site e veja os logs `[GTM-DEBUG]`

## O que procurar nos logs

| Log | Significado |
|-----|-------------|
| `Evento IGNORADO` | O evento não está na lista permitida |
| `ERRO NO FETCH` | A requisição falhou (CORS, rede, etc) |
| `Response Status: 4xx` | A Edge Function recusou (ver motivo) |
| `Response Status: 200` | ✅ Sucesso! |

## Possíveis problemas

1. **Secret não definido**: A variável `{{Metas - Secret Token}}` não existe no GTM
2. **Endpoint errado**: A variável `{{Metas - Endpoint URL}}` está vazia ou errada
3. **CORS**: O domínio do site não está na lista de origens permitidas
4. **Container ID**: Se `Container ID` não está definido, o script não consegue ler o DataLayer

## Depois de debugar

⚠️ **IMPORTANTE**: Depois de identificar o problema, **remova os console.logs** ou volte ao script original para não deixar logs em produção.
