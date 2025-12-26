/**
 * Handler: get-rankings
 * 
 * Retorna rankings por função (SDR, Closer, Ciclo Completo)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface GetRankingsParams {
  role: 'sdr' | 'closer' | 'ciclo_completo' | 'all'
  month?: string // formato: YYYY-MM (opcional, default: mês atual)
  limit?: number // número de resultados (opcional, default: todos)
  months?: number // número de meses para histórico (para hall of fame)
}

export async function getRankings(params: GetRankingsParams) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { role, limit, months } = params
  const targetMonth = params.month || new Date().toISOString().slice(0, 7)
  const monthStart = `${targetMonth}-01`

  console.log(`[get-rankings] Buscando rankings: role=${role}, month=${targetMonth}`)

  // Se for para histórico (hall of fame)
  if (months && months > 1) {
    return await getHistoricalRankings(supabase, role, months)
  }

  // Buscar rankings do mês específico
  if (role === 'all') {
    // Buscar campeões de todas as categorias
    return await getChampions(supabase, monthStart)
  }

  // Buscar ranking de uma função específica
  let query = supabase
    .from('user_metrics')
    .select(`
      *,
      ghl_users!inner(id, name, email, ghl_data),
      sales_roles!inner(role)
    `)
    .eq('month', monthStart)
    .eq('sales_roles.role', role)
    .order('position', { ascending: true })

  if (limit) {
    query = query.limit(limit)
  }

  const { data: rankings, error } = await query

  if (error) throw error

  // Buscar badges dos usuários
  const userIds = rankings?.map(r => r.ghl_user_id) || []
  const { data: badges } = await supabase
    .from('badges')
    .select('*')
    .in('ghl_user_id', userIds)
    .eq('month', monthStart)

  // Montar resposta
  const result = rankings?.map(r => {
    const userBadges = badges?.filter(b => b.ghl_user_id === r.ghl_user_id) || []
    
    return {
      position: r.position,
      user: {
        id: r.ghl_user_id,
        name: r.ghl_users?.name || 'Sem nome',
        email: r.ghl_users?.email,
        avatar: r.ghl_users?.ghl_data?.avatar || null
      },
      metrics: getMetricsByRole(role, r),
      score: r.score,
      badges: userBadges.map(b => ({
        type: b.badge_type,
        awarded_at: b.awarded_at
      }))
    }
  }) || []

  return {
    role,
    month: targetMonth,
    rankings: result,
    total: result.length
  }
}

/**
 * Busca campeões de todas as categorias
 */
async function getChampions(supabase: any, month: string) {
  const roles = ['sdr', 'closer', 'ciclo_completo']
  const champions: any = {}

  for (const role of roles) {
    const { data } = await supabase
      .from('user_metrics')
      .select(`
        *,
        ghl_users!inner(id, name, email, ghl_data),
        sales_roles!inner(role)
      `)
      .eq('month', month)
      .eq('sales_roles.role', role)
      .eq('position', 1)
      .single()

    if (data) {
      const { data: badges } = await supabase
        .from('badges')
        .select('*')
        .eq('ghl_user_id', data.ghl_user_id)
        .eq('month', month)

      champions[role] = {
        user: {
          id: data.ghl_user_id,
          name: data.ghl_users?.name || 'Sem nome',
          email: data.ghl_users?.email,
          avatar: data.ghl_users?.ghl_data?.avatar || null
        },
        metrics: getMetricsByRole(role, data),
        score: data.score,
        badges: badges?.map(b => ({
          type: b.badge_type,
          awarded_at: b.awarded_at
        })) || []
      }
    }
  }

  return {
    month,
    champions
  }
}

/**
 * Busca rankings históricos (para hall of fame)
 */
async function getHistoricalRankings(supabase: any, role: string, months: number) {
  const history = []
  const today = new Date()

  for (let i = 0; i < months; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const monthStr = date.toISOString().slice(0, 7)
    const monthStart = `${monthStr}-01`

    if (role === 'all') {
      const champions = await getChampions(supabase, monthStart)
      history.push({
        month: monthStr,
        champions: champions.champions
      })
    } else {
      const { data } = await supabase
        .from('user_metrics')
        .select(`
          *,
          ghl_users!inner(id, name, email),
          sales_roles!inner(role)
        `)
        .eq('month', monthStart)
        .eq('sales_roles.role', role)
        .eq('position', 1)
        .single()

      if (data) {
        history.push({
          month: monthStr,
          champion: {
            user: {
              id: data.ghl_user_id,
              name: data.ghl_users?.name || 'Sem nome',
              email: data.ghl_users?.email
            },
            score: data.score
          }
        })
      }
    }
  }

  return {
    role,
    history
  }
}

/**
 * Extrai métricas relevantes por função
 */
function getMetricsByRole(role: string, data: any) {
  if (role === 'sdr') {
    return {
      agendamentos: data.agendamentos,
      comparecimentos: data.comparecimentos,
      taxa_comparecimento: data.taxa_comparecimento,
      vendas_geradas: data.vendas_geradas
    }
  } else if (role === 'closer') {
    return {
      vendas: data.vendas,
      vendas_primeira_reuniao: data.vendas_primeira_reuniao,
      vendas_segunda_reuniao: data.vendas_segunda_reuniao,
      valor_total_vendido: data.valor_total_vendido,
      ticket_medio: data.ticket_medio,
      taxa_conversao: data.taxa_conversao
    }
  } else if (role === 'ciclo_completo') {
    return {
      vendas_ciclo_completo: data.vendas_ciclo_completo,
      taxa_conversao_ponta_a_ponta: data.taxa_conversao_ponta_a_ponta
    }
  }
  return {}
}
