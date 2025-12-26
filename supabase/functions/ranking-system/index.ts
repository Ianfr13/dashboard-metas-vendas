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
import { corsHeaders } from '../_shared/cors.ts'
import { calculate } from './handlers/calculate.ts'
import { getRankings } from './handlers/get-rankings.ts'
import { getMetrics } from './handlers/get-metrics.ts'
import { adminActions } from './handlers/admin.ts'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, ...params } = await req.json()

    console.log(`[ranking-system] Action: ${action}`, params)

    let result

    switch (action) {
      case 'calculate':
        // Calcular métricas e rankings
        result = await calculate(params)
        break

      case 'get-rankings':
        // Buscar rankings por função
        result = await getRankings(params)
        break

      case 'get-metrics':
        // Buscar métricas para gráficos
        result = await getMetrics(params)
        break

      case 'admin':
        // Ações administrativas
        result = await adminActions(params)
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
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.stack 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
