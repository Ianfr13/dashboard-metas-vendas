import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'
import { getFunnelMetrics } from './handlers/funnel.ts'
import { getEvolutionChart } from './handlers/evolution.ts'
import { getProductMetrics } from './handlers/products.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Debug: Verificar váriaveis de ambiente
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing env vars')
      return new Response(JSON.stringify({ error: 'Configuration Error', details: 'Missing SUPABASE_URL or SUPABASE_ANON_KEY' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Verificar JWT manualmente
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } })

    // Explicitly pass token to getUser
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await authClient.auth.getUser(token)

    if (authError || !user) {
      console.error('Auth Error:', authError)
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        details: authError,
        debug: {
          hasAuthHeader: !!authHeader,
          authHeaderLength: authHeader.length,
          hasUser: !!user,
          errorMsg: authError?.message
        }
      }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Cliente com permissão de serviço (usado APÓS verificar autenticação)
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'funnel'
    const startDate = url.searchParams.get('start_date')
    const endDate = url.searchParams.get('end_date')

    if (!startDate || !endDate) {
      return new Response(
        JSON.stringify({ error: 'Missing start_date or end_date parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let result: any

    switch (action) {
      case 'funnel':
        result = await getFunnelMetrics(supabase, startDate, endDate)
        break

      case 'evolution':
        const eventName = url.searchParams.get('event_name') || 'purchase'
        const groupBy = (url.searchParams.get('group_by') || 'day') as 'hour' | 'day' | 'week'
        result = await getEvolutionChart(supabase, startDate, endDate, eventName, groupBy)
        break

      case 'products':
        result = await getProductMetrics(supabase, startDate, endDate)
        break

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use: funnel, evolution, or products' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('Error in gtm-analytics function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
