/**
 * API para o sistema de ranking e gamificação
 * 
 * Wrapper para chamar a Edge Function ranking-system
 */

import { supabase } from './supabase'

const RANKING_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ranking-system`

interface RankingAPIParams {
  action: 'calculate' | 'get-rankings' | 'get-metrics' | 'admin'
  [key: string]: any
}

/**
 * Chama a Edge Function ranking-system
 */
async function callRankingAPI(params: RankingAPIParams) {
  try {
    // Obter token de autenticação
    const { data: { session } } = await supabase.auth.getSession()
    
    // DEBUG: Log da sessão
    console.log('[ranking-api] Session:', {
      hasSession: !!session,
      hasToken: !!session?.access_token,
      tokenPreview: session?.access_token ? session.access_token.substring(0, 20) + '...' : 'NO TOKEN',
      user: session?.user?.email
    })
    
    const headers: any = {
      'Content-Type': 'application/json'
    }

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    } else {
      console.warn('[ranking-api] NO ACCESS TOKEN FOUND IN SESSION!')
    }

    const response = await fetch(RANKING_FUNCTION_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      let errorMessage = 'Erro ao chamar API de ranking'
      try {
        const error = await response.json()
        errorMessage = error.error || errorMessage
      } catch (parseError) {
        // Se não for JSON, tenta ler como texto
        try {
          const errorText = await response.text()
          errorMessage = errorText || `${response.status} ${response.statusText}`
        } catch {
          errorMessage = `${response.status} ${response.statusText}`
        }
      }
      throw new Error(errorMessage)
    }

    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.error || 'Erro desconhecido')
    }

    return result.data
  } catch (error) {
    console.error('[ranking-api] Error:', error)
    throw error
  }
}

/**
 * Busca rankings por função
 */
export async function getRankings(params: {
  role: 'sdr' | 'closer' | 'ciclo_completo' | 'all'
  month?: string
  limit?: number
  months?: number
}) {
  return await callRankingAPI({
    action: 'get-rankings',
    ...params
  })
}

/**
 * Busca métricas para gráficos
 */
export async function getMetrics(params: {
  type: 'funil' | 'evolucao' | 'performance-sdr' | 'performance-closer' | 'distribuicao' | 'reunioes' | 'cards'
  period?: string
  start_date?: string
  end_date?: string
  month?: string
}) {
  return await callRankingAPI({
    action: 'get-metrics',
    ...params
  })
}

/**
 * Força recálculo de rankings (admin)
 */
export async function recalculateRankings(month?: string) {
  return await callRankingAPI({
    action: 'admin',
    subaction: 'recalculate',
    month
  })
}

/**
 * Atribui função a um usuário (admin)
 */
export async function setUserRole(params: {
  user_id: string
  role: 'sdr' | 'closer' | 'ciclo_completo'
  active?: boolean
}) {
  return await callRankingAPI({
    action: 'admin',
    subaction: 'set-role',
    ...params
  })
}

/**
 * Lista todos os usuários (admin)
 */
export async function listUsers() {
  return await callRankingAPI({
    action: 'admin',
    subaction: 'list-users'
  })
}

// Exportar objeto com todas as funções
export const rankingAPI = {
  getRankings,
  getMetrics,
  recalculateRankings,
  setUserRole,
  listUsers
}
