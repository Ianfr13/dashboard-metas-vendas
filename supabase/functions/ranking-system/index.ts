/**
 * Edge Function: ranking-system
 * 
 * Sistema de ranking e gamificação para SDRs, Closers e Ciclo Completo.
 * Responsável por:
 * 1. Calcular métricas e rankings
 * 2. Atribuir badges automaticamente
 * 3. Fornecer dados para dashboards e gráficos
 * 4. Gerenciar funções de usuários (admin)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'
import { calculate } from './handlers/calculate.ts'
import { getRankings } from './handlers/get-rankings.ts'
import { getMetrics } from './handlers/get-metrics.ts'
import { adminActions } from './handlers/admin.ts'

// Helper para verificar autenticação (opcional)
async function verifyAuth(req: Request, required: boolean = false) {
  const authHeader = req.headers.get('Authorization')
  
  if (!authHeader) {
    if (required) {
      throw new Error('Token de autenticação não fornecido')
    }
    return { user: null, supabase: null }
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authHeader }
    }
  })

  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    if (required) {
      throw new Error('Token inválido ou expirado')
    }
    return { user: null, supabase: null }
  }

  return { user, supabase }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, ...params } = await req.json()

    console.log(`[ranking-system] Action: ${action}`)

    let result
    let user = null

    switch (action) {
      case 'calculate':
        // Calcular métricas e rankings (não requer auth)
        result = await calculate(params)
        break

      case 'get-rankings':
        // Buscar rankings por função (não requer auth)
        result = await getRankings(params)
        break

      case 'get-metrics':
        // Buscar métricas para gráficos (não requer auth)
        result = await getMetrics(params)
        break

      case 'admin':
        // Ações administrativas (REQUER auth)
        const authResult = await verifyAuth(req, true)
        user = authResult.user
        console.log(`[ranking-system] Admin action by user: ${user?.id}`)
        result = await adminActions(params, user!.id)
        break

      default:
        throw new Error(`Action '${action}' not found`)
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('[ranking-system] Error:', error)
    
    // Não expor stack trace em produção
    const isDev = Deno.env.get('NODE_ENV') === 'development'
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro interno do servidor',
        ...(isDev && { details: error.stack })
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message?.includes('autenticação') || error.message?.includes('autorização') ? 401 : 400
      }
    )
  }
})
