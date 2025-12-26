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

// Helper para verificar autenticação
async function verifyAuth(req: Request) {
  const authHeader = req.headers.get('Authorization')
  
  console.log('[ranking-system] Auth header:', authHeader ? authHeader.substring(0, 30) + '...' : 'MISSING')
  
  if (!authHeader) {
    throw new Error('Token de autenticação não fornecido')
  }

  // Extrair o token JWT do header "Bearer <token>"
  const token = authHeader.replace('Bearer ', '')
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  
  console.log('[ranking-system] Using SERVICE_ROLE_KEY for auth validation')
  console.log('[ranking-system] Token preview:', token.substring(0, 20) + '...')
  
  // Criar client com SERVICE_ROLE_KEY
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Validar o token JWT passando-o como parâmetro
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error) {
    console.error('[ranking-system] Auth error details:', {
      message: error.message,
      status: error.status,
      name: error.name
    })
  }
  
  if (!user) {
    console.error('[ranking-system] No user returned from getUser()')
  }
  
  if (error || !user) {
    throw new Error('Token inválido ou expirado')
  }

  console.log('[ranking-system] User authenticated successfully:', user.email)
  return { user, supabase }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verificar autenticação para todas as ações
    const { user } = await verifyAuth(req)
    
    const { action, ...params } = await req.json()

    console.log(`[ranking-system] Action: ${action}, User: ${user.id}`)

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
        // TODO: Implementar verificação de permissões de admin
        result = await adminActions(params, user.id)
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
    console.error('[ranking-system] Error:', error.message)
    
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
        status: error.message?.includes('autenticação') || error.message?.includes('Token') ? 401 : 400
      }
    )
  }
})
