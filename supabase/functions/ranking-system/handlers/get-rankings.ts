/**
 * Handler: get-rankings
 * 
 * Retorna rankings por função (SDR, Closer, Auto Prospecção)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface GetRankingsParams {
  role: 'sdr' | 'closer' | 'auto_prospeccao' | 'all'
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
  // Buscar user_ids que têm a role específica
  const { data: roleData } = await supabase
    .from('sales_roles')
    .select('user_id')
    .eq('role', role)
  
  const userIds = roleData?.map(r => r.user_id) || []
  
  let query = supabase
    .from('user_metrics')
    .select('*')
    .eq('month', monthStart)
    .in('user_id', userIds)
    .order('position', { ascending: true })

  if (limit) {
    query = query.limit(limit)
  }

  const { data: rankings, error } = await query

  if (error) throw error

  // Buscar badges dos usuários
  const metricUserIds = rankings?.map(r => r.user_id) || []
  const { data: badges } = await supabase
    .from('badges')
    .select('*')
    .in('user_id', metricUserIds)
    .eq('month', monthStart)
  
  // Buscar dados dos usuários do auth
  const { data: users } = await supabase.auth.admin.listUsers()
  const userMap = new Map(users?.users?.map(u => [u.id, u]) || [])

  // Montar resposta
  const result = rankings?.map(r => {
    const userBadges = badges?.filter(b => b.user_id === r.user_id) || []
    const user = userMap.get(r.user_id)
    
    return {
      position: r.position,
      user: {
        id: r.user_id,
        name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Sem nome',
        email: user?.email,
        avatar: user?.user_metadata?.avatar_url || null
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
  const roles = ['sdr', 'closer', 'auto_prospeccao']
  const champions: any = {}

  for (const role of roles) {
    // Buscar user_ids com essa role
    const { data: roleData } = await supabase
      .from('sales_roles')
      .select('user_id')
      .eq('role', role)
    
    const userIds = roleData?.map(r => r.user_id) || []
    
    const { data } = await supabase
      .from('user_metrics')
      .select('*')
      .eq('month', month)
      .in('user_id', userIds)
      .eq('position', 1)
      .single()

    if (data) {
      const { data: badges } = await supabase
        .from('badges')
        .select('*')
        .eq('user_id', data.user_id)
        .eq('month', month)
      
      const { data: { user } } = await supabase.auth.admin.getUserById(data.user_id)

      champions[role] = {
        user: {
          id: data.user_id,
          name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Sem nome',
          email: user?.email,
          avatar: user?.user_metadata?.avatar_url || null
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
      // Buscar user_ids com essa role
      const { data: roleData } = await supabase
        .from('sales_roles')
        .select('user_id')
        .eq('role', role)
      
      const userIds = roleData?.map(r => r.user_id) || []
      
      const { data } = await supabase
        .from('user_metrics')
        .select('*')
        .eq('month', monthStart)
        .in('user_id', userIds)
        .eq('position', 1)
        .single()

      if (data) {
        const { data: { user } } = await supabase.auth.admin.getUserById(data.user_id)
        
        history.push({
          month: monthStr,
          champion: {
            user: {
              id: data.user_id,
              name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Sem nome',
              email: user?.email
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
  } else if (role === 'auto_prospeccao') {
    return {
      vendas_auto_prospeccao: data.vendas_auto_prospeccao,
      taxa_conversao_ponta_a_ponta: data.taxa_conversao_ponta_a_ponta
    }
  }
  return {}
}
