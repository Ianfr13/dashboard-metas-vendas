# Guia Completo de Deploy - Edge Function

## 📁 Estrutura de Arquivos

```
supabase/
└── functions/
    ├── _shared/
    │   └── cors.ts          ← Configuração de CORS
    └── gtm-event/
        └── index.ts         ← Edge Function principal
```

## 📝 Código Completo

### 1. `supabase/functions/_shared/cors.ts`

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

### 2. `supabase/functions/gtm-event/index.ts`

```typescript
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Edge Function: gtm-event
 * 
 * Propósito: APENAS receber eventos do GTM e salvar na tabela gtm_events
 * 
 * Filosofia: Keep it simple!
 * - Não faz processamento complexo
 * - Não atualiza outras tabelas
 * - Apenas salva o evento bruto
 * - Frontend faz todo o resto
 */

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // GTM events são públicos - usamos service role key no servidor
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const body = await req.json();
    const {
      event_name,
      event_data,
      user_id,
      session_id,
      page_url,
      referrer,
    } = body;

    if (!event_name) {
      throw new Error('event_name is required');
    }

    // Get client IP and user agent
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || null;

    // Simplesmente salva o evento na tabela gtm_events
    const { error: insertError } = await supabaseClient
      .from('gtm_events')
      .insert({
        event_name,
        event_data: event_data ? JSON.stringify(event_data) : null,
        user_id: user_id || null,
        session_id: session_id || null,
        ip_address: clientIP,
        user_agent: userAgent,
        page_url: page_url || null,
        referrer: referrer || null,
      });

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Event recorded successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error processing GTM event:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
```

## 🚀 Como Fazer o Deploy

### Passo 1: Instalar Supabase CLI

```bash
# macOS/Linux
brew install supabase/tap/supabase

# Windows (via Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Ou via npm (qualquer OS)
npm install -g supabase
```

### Passo 2: Login no Supabase

```bash
supabase login
```

Isso vai abrir o navegador para você fazer login.

### Passo 3: Link ao Projeto

```bash
cd /caminho/para/dashboard-metas-vendas
supabase link --project-ref auvvrewlbpyymekonilv
```

### Passo 4: Deploy da Edge Function

```bash
supabase functions deploy gtm-event
```

**Saída esperada:**
```
Deploying gtm-event (project ref: auvvrewlbpyymekonilv)
Bundled gtm-event (1.2 kB)
Deployed gtm-event (1.2 kB)
Function URL: https://auvvrewlbpyymekonilv.supabase.co/functions/v1/gtm-event
```

### Passo 5: Verificar Deploy

```bash
supabase functions list
```

**Saída esperada:**
```
┌───────────┬────────┬─────────────────────┐
│ NAME      │ STATUS │ CREATED AT          │
├───────────┼────────┼─────────────────────┤
│ gtm-event │ ACTIVE │ 2024-12-24 18:00:00 │
└───────────┴────────┴─────────────────────┘
```

## ✅ Testar a Edge Function

### Teste 1: Via cURL

```bash
curl -X POST https://auvvrewlbpyymekonilv.supabase.co/functions/v1/gtm-event \
  -H "Content-Type: application/json" \
  -d '{
    "event_name": "test_event",
    "event_data": {
      "test": true
    },
    "page_url": "https://example.com"
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Event recorded successfully"
}
```

### Teste 2: Via JavaScript (GTM)

```javascript
fetch('https://auvvrewlbpyymekonilv.supabase.co/functions/v1/gtm-event', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    event_name: 'purchase',
    event_data: {
      transaction_id: 'TEST-001',
      value: 997,
      product_type: 'front',
    },
    page_url: window.location.href,
  }),
})
.then(res => res.json())
.then(data => console.log('Success:', data))
.catch(err => console.error('Error:', err));
```

### Teste 3: Verificar no Banco

```sql
-- No SQL Editor do Supabase
SELECT * FROM gtm_events ORDER BY created_at DESC LIMIT 10;
```

## 🐛 Troubleshooting

### Erro: "Project not linked"

**Solução:**
```bash
supabase link --project-ref auvvrewlbpyymekonilv
```

### Erro: "Function not found"

**Solução:** Verifique se o deploy foi feito corretamente:
```bash
supabase functions list
```

### Erro: "CORS policy"

**Solução:** O arquivo `_shared/cors.ts` já está configurado corretamente. Se ainda houver erro, verifique se o arquivo existe.

### Erro: "Table gtm_events does not exist"

**Solução:** Execute a migração do banco de dados primeiro:
```bash
# Aplicar o SQL de criação das tabelas
# Copie o conteúdo de supabase_migration.sql e execute no SQL Editor
```

## 📊 Monitorar a Edge Function

### Ver Logs em Tempo Real

```bash
supabase functions logs gtm-event
```

### Ver Logs no Dashboard

1. Acesse: https://supabase.com/dashboard/project/auvvrewlbpyymekonilv/functions
2. Clique em `gtm-event`
3. Vá na aba "Logs"

## 🔄 Atualizar a Edge Function

Sempre que você modificar o código:

```bash
supabase functions deploy gtm-event
```

O Supabase cria uma nova versão automaticamente.

## ⚙️ Variáveis de Ambiente

As seguintes variáveis são injetadas automaticamente pelo Supabase:

- `SUPABASE_URL` - URL do projeto
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (privada)

Você **não precisa** configurar nada manualmente.

## 📚 Documentação Oficial

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Deno Runtime](https://deno.land/)

---

**Pronto!** Sua Edge Function está deployada e funcionando! 🎉
