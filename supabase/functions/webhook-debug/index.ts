import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const diagnostics: any = {}

  try {
    // 1. Verificar variáveis de ambiente
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    diagnostics.env_vars = {
      SUPABASE_URL: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'NOT SET',
      SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey ? `${serviceRoleKey.substring(0, 20)}...` : 'NOT SET',
      has_url: !!supabaseUrl,
      has_key: !!serviceRoleKey
    }

    if (!supabaseUrl || !serviceRoleKey) {
      diagnostics.error = 'Missing environment variables'
      return new Response(JSON.stringify(diagnostics, null, 2), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 2. Tentar criar cliente
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    diagnostics.client_created = true

    // 3. Tentar fazer uma query simples
    const { data, error } = await supabase
      .from('ghl_webhook_rate_limit')
      .select('count')
      .limit(1)

    diagnostics.query_result = {
      success: !error,
      error: error ? error.message : null,
      data_received: !!data
    }

    // 4. Tentar fazer um upsert
    const testIdentifier = `test_${Date.now()}`
    const { error: upsertError } = await supabase
      .from('ghl_webhook_rate_limit')
      .upsert({
        identifier: testIdentifier,
        request_count: 1,
        window_start: new Date(),
        last_request: new Date()
      }, { onConflict: 'identifier' })

    diagnostics.upsert_result = {
      success: !upsertError,
      error: upsertError ? {
        message: upsertError.message,
        details: upsertError.details,
        hint: upsertError.hint,
        code: upsertError.code
      } : null
    }

    return new Response(JSON.stringify(diagnostics, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    diagnostics.exception = {
      message: error.message,
      stack: error.stack
    }
    
    return new Response(JSON.stringify(diagnostics, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
