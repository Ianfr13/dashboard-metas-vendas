# Integração Segura com Google Tag Manager

## 🔐 Segurança Implementada

A Edge Function `gtm-event` agora valida um **secret token** para impedir que pessoas enviem dados falsos.

### Como Funciona

1. **Sem Token**: A requisição é rejeitada com erro 401
2. **Com Token Correto**: A requisição é processada e o evento é salvo

### Secret Token

```
b646bc7e395f08aa2ee33001fbd6056874c3e0b732e6ed1b62dd251825d4f276
```

**⚠️ IMPORTANTE:** Guarde este token em segredo! Não o exponha publicamente.

## 📝 Como Usar no GTM

### Configuração da Tag

1. Vá em **Tags** → **New**
2. Nome: `Supabase - Purchase Event (Secure)`
3. Tipo: **Custom HTML**
4. Cole o código:

```html
<script>
(function() {
  // Secret token para autenticação
  const GTM_SECRET = 'b646bc7e395f08aa2ee33001fbd6056874c3e0b732e6ed1b62dd251825d4f276';
  
  fetch('https://auvvrewlbpyymekonilv.supabase.co/functions/v1/gtm-event', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-GTM-Secret': GTM_SECRET,  // ← Header de autenticação
    },
    body: JSON.stringify({
      event_name: 'purchase',
      event_data: {
        transaction_id: '{{Transaction ID}}',
        value: {{Transaction Value}},
        product_type: '{{Product Type}}',
        product_name: '{{Product Name}}',
      },
      page_url: window.location.href,
      referrer: document.referrer,
    }),
  })
  .then(res => res.json())
  .then(data => console.log('Event sent:', data))
  .catch(err => console.error('Error sending event:', err));
})();
</script>
```

5. **Trigger**: Evento `purchase` (Custom Event)
6. **Salvar** e **Publicar**

## 🧪 Testar a Integração

### Teste 1: Sem Token (Deve Falhar)

```bash
curl -X POST https://auvvrewlbpyymekonilv.supabase.co/functions/v1/gtm-event \
  -H "Content-Type: application/json" \
  -d '{"event_name":"test","page_url":"https://test.com"}'
```

**Resposta esperada:**
```json
{"error":"Unauthorized: Invalid or missing secret token"}
```

### Teste 2: Com Token (Deve Funcionar)

```bash
curl -X POST https://auvvrewlbpyymekonilv.supabase.co/functions/v1/gtm-event \
  -H "Content-Type: application/json" \
  -H "X-GTM-Secret: b646bc7e395f08aa2ee33001fbd6056874c3e0b732e6ed1b62dd251825d4f276" \
  -d '{"event_name":"test","page_url":"https://test.com"}'
```

**Resposta esperada:**
```json
{"success":true,"message":"Event recorded successfully"}
```

## 🔄 Rotacionar o Token (Opcional)

Se você quiser trocar o token por segurança:

1. Gere um novo token:
   ```bash
   openssl rand -hex 32
   ```

2. Atualize a Edge Function:
   - Edite `supabase/functions/gtm-event/index.ts`
   - Altere a linha: `const GTM_SECRET = 'NOVO_TOKEN_AQUI';`

3. Redeploy:
   ```bash
   supabase functions deploy gtm-event --project-ref auvvrewlbpyymekonilv --no-verify-jwt
   ```

4. Atualize o GTM com o novo token

## 📊 Verificar Eventos no Banco

```sql
-- Ver últimos 10 eventos
SELECT * FROM gtm_events ORDER BY created_at DESC LIMIT 10;

-- Ver eventos de compra
SELECT * FROM gtm_events WHERE event_name = 'purchase' ORDER BY created_at DESC;

-- Contar eventos por tipo
SELECT event_name, COUNT(*) as total 
FROM gtm_events 
GROUP BY event_name 
ORDER BY total DESC;
```

## 🛡️ Níveis de Segurança

| Método | Segurança | Uso |
|--------|-----------|-----|
| Sem validação | ❌ Baixa | Qualquer um pode enviar dados |
| Secret Token (atual) | ✅ Alta | Apenas quem tem o token pode enviar |
| JWT de usuário | ✅✅ Muito Alta | Apenas usuários autenticados |

Para este caso de uso (GTM), o **Secret Token é ideal** porque:
- ✅ Protege contra envio de dados falsos
- ✅ Não requer autenticação de usuário
- ✅ Simples de implementar no GTM
- ✅ Performance excelente

## 🚨 Boas Práticas

1. **Nunca exponha o token publicamente** (GitHub, documentação pública, etc)
2. **Use variáveis de ambiente** no GTM se possível
3. **Rotacione o token periodicamente** (a cada 6-12 meses)
4. **Monitore os logs** para detectar tentativas de acesso não autorizado
5. **Use HTTPS sempre** (já está configurado)

## 📚 Documentação Relacionada

- [SIMPLIFIED_ARCHITECTURE.md](./SIMPLIFIED_ARCHITECTURE.md) - Arquitetura geral
- [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md) - Como fazer deploy
- [supabase/rls_policies.sql](./supabase/rls_policies.sql) - Políticas de segurança do banco

---

**Status:** ✅ Deployado e Testado  
**Última atualização:** 24 de Dezembro de 2024
