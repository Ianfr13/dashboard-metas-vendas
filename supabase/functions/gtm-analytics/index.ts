import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'
import { getFunnelMetrics } from './handlers/funnel.ts'
import { getEvolutionChart } from './handlers/evolution.ts'
import { getProductMetrics } from './handlers/products.ts'
import { getTrafficSources } from './handlers/traffic_sources.ts'
import { RateLimiter } from './rate-limiter.ts'

// Configurar Rate Limiter: 100 requisições por minuto por IP
const rateLimiter = new RateLimiter(60000, 100)

// Helper para verificar autenticação
async function verifyAuth(req: Request) {
  const authHeader = req.headers.get('Authorization')

  if (!authHeader) {
    throw new Error('Token de autenticação não fornecido no header Authorization')
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('CRITICAL: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars')
    throw new Error('Erro de configuração no servidor (variáveis de ambiente)')
  }

  // Criar client com SERVICE_ROLE_KEY
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Extrair apenas o token sem o "Bearer "
  const token = authHeader.replace(/^Bearer\s+/i, '')

  if (!token || token === 'undefined' || token === 'null') {
    throw new Error('Token malformado ou inválido')
  }

  // Validar o token JWT
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error) {
    console.error('[verifyAuth] Auth error:', error.message)
    throw new Error(`Autenticação falhou: ${error.message}`)
  }

  if (!user) {
    throw new Error('Usuário não encontrado para o token fornecido')
  }

  return { user, supabase }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Rate Limiting
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    if (!rateLimiter.check(ip)) {
      return new Response(
        JSON.stringify({ error: 'Too Many Requests' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Verificar autenticação
    await verifyAuth(req)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
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

      case 'traffic_sources':
        result = await getTrafficSources(supabase, startDate, endDate)
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

    // Não expor stack trace em produção
    const isDev = Deno.env.get('NODE_ENV') === 'development'

    return new Response(
      JSON.stringify({
        error: error.message || 'Erro interno do servidor',
        ...(isDev && { details: error.stack })
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message === 'Too Many Requests' ? 429 : (error.message?.includes('autenticação') || error.message?.includes('Token') ? 401 : 500)
      }
    )
  }
})
