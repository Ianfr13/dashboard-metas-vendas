/**
 * Handler: get-metrics
 * 
 * Retorna métricas agregadas para gráficos e dashboards
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface GetMetricsParams {
  type: 'funil' | 'evolucao' | 'performance-sdr' | 'performance-closer' | 'distribuicao' | 'reunioes' | 'cards'
  period?: string // 'today' | 'week' | 'month' | 'custom'
  start_date?: string // para custom
  end_date?: string // para custom
  month?: string // para métricas mensais
}

export async function getMetrics(params: GetMetricsParams) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { type } = params

  console.log(`[get-metrics] Buscando métricas: type=${type}`)

  switch (type) {
    case 'cards':
      return await getCardsMetrics(supabase, params)
    case 'funil':
      return await getFunnelMetrics(supabase, params)
    case 'evolucao':
      return await getEvolutionMetrics(supabase, params)
    case 'performance-sdr':
      return await getPerformanceSDR(supabase, params)
    case 'performance-closer':
      return await getPerformanceCloser(supabase, params)
    case 'distribuicao':
      return await getDistributionMetrics(supabase, params)
    case 'reunioes':
      return await getMeetingsMetrics(supabase, params)
    default:
      throw new Error(`Tipo de métrica '${type}' não suportado`)
  }
}

/**
 * Cards de métricas gerais
 */
async function getCardsMetrics(supabase: any, params: any) {
  const { start_date, end_date } = getDateRange(params)

  // Total de agendamentos
  const { count: agendamentos } = await supabase
    .from('ghl_appointments')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', start_date)
    .lte('created_at', end_date)

  // Total de vendas
  const { count: vendas } = await supabase
    .from('ghl_opportunities')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'won')
    .gte('updated_at', start_date)
    .lte('updated_at', end_date)

  // Faturamento total
  const { data: salesData } = await supabase
    .from('ghl_opportunities')
    .select('monetary_value')
    .eq('status', 'won')
    .gte('updated_at', start_date)
    .lte('updated_at', end_date)

  const faturamento = salesData?.reduce((sum, s) => sum + (s.monetary_value || 0), 0) || 0
  const ticketMedio = vendas > 0 ? faturamento / vendas : 0

  // Taxa de não comparecimento
  const { count: naoComparecimentos } = await supabase
    .from('ghl_appointments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'no_show')
    .gte('created_at', start_date)
    .lte('created_at', end_date)

  const taxaNaoComparecimento = agendamentos > 0 
    ? (naoComparecimentos / agendamentos * 100) 
    : 0

  // Taxa de conversão geral
  const { count: totalOportunidades } = await supabase
    .from('ghl_opportunities')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', start_date)
    .lte('created_at', end_date)

  const taxaConversao = totalOportunidades > 0 
    ? (vendas / totalOportunidades * 100) 
    : 0

  return {
    total_agendamentos: agendamentos || 0,
    total_vendas: vendas || 0,
    taxa_conversao_geral: Math.round(taxaConversao * 100) / 100,
    faturamento_total: faturamento,
    ticket_medio: Math.round(ticketMedio * 100) / 100,
    taxa_nao_comparecimento: Math.round(taxaNaoComparecimento * 100) / 100
  }
}

/**
 * Funil de vendas
 */
async function getFunnelMetrics(supabase: any, params: any) {
  const { start_date, end_date } = getDateRange(params)

  // Primeiro Contato
  const { count: primeiroContato } = await supabase
    .from('ghl_contacts')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', start_date)
    .lte('created_at', end_date)

  // Agendado
  const { count: agendado } = await supabase
    .from('ghl_appointments')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', start_date)
    .lte('created_at', end_date)

  // Compareceu
  const { count: compareceu } = await supabase
    .from('ghl_appointments')
    .select('*', { count: 'exact', head: true })
    .in('status', ['completed', 'confirmed'])
    .gte('start_time', start_date)
    .lte('start_time', end_date)

  // Venda
  const { count: venda } = await supabase
    .from('ghl_opportunities')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'won')
    .gte('updated_at', start_date)
    .lte('updated_at', end_date)

  return {
    funil: [
      { 
        etapa: 'Primeiro Contato', 
        count: primeiroContato || 0, 
        conversion: 100 
      },
      { 
        etapa: 'Agendado', 
        count: agendado || 0, 
        conversion: primeiroContato > 0 ? (agendado / primeiroContato * 100) : 0 
      },
      { 
        etapa: 'Compareceu', 
        count: compareceu || 0, 
        conversion: agendado > 0 ? (compareceu / agendado * 100) : 0 
      },
      { 
        etapa: 'Venda', 
        count: venda || 0, 
        conversion: compareceu > 0 ? (venda / compareceu * 100) : 0 
      }
    ]
  }
}

/**
 * Evolução de vendas
 */
async function getEvolutionMetrics(supabase: any, params: any) {
  const { start_date, end_date } = getDateRange(params)

  const { data: sales } = await supabase
    .from('ghl_opportunities')
    .select('updated_at')
    .eq('status', 'won')
    .gte('updated_at', start_date)
    .lte('updated_at', end_date)
    .order('updated_at')

  // Agrupar por dia
  const salesByDay: any = {}
  sales?.forEach((sale: any) => {
    const day = sale.updated_at.slice(0, 10)
    salesByDay[day] = (salesByDay[day] || 0) + 1
  })

  const labels = Object.keys(salesByDay).sort()
  const values = labels.map(label => salesByDay[label])

  return {
    labels,
    values
  }
}

/**
 * Performance por SDR
 */
async function getPerformanceSDR(supabase: any, params: any) {
  const targetMonth = params.month || new Date().toISOString().slice(0, 7)
  const monthStart = `${targetMonth}-01`

  const { data: metrics } = await supabase
    .from('user_metrics')
    .select(`
      *,
      ghl_users!inner(name),
      user_roles!inner(role)
    `)
    .eq('month', monthStart)
    .eq('user_roles.role', 'sdr')
    .order('score', { ascending: false })
    .limit(10)

  return {
    sdrs: metrics?.map((m: any) => ({
      name: m.ghl_users?.name || 'Sem nome',
      agendamentos: m.agendamentos,
      comparecimentos: m.comparecimentos
    })) || []
  }
}

/**
 * Performance por Closer
 */
async function getPerformanceCloser(supabase: any, params: any) {
  const targetMonth = params.month || new Date().toISOString().slice(0, 7)
  const monthStart = `${targetMonth}-01`

  const { data: metrics } = await supabase
    .from('user_metrics')
    .select(`
      *,
      ghl_users!inner(name),
      user_roles!inner(role)
    `)
    .eq('month', monthStart)
    .eq('user_roles.role', 'closer')
    .order('score', { ascending: false })
    .limit(10)

  return {
    closers: metrics?.map((m: any) => ({
      name: m.ghl_users?.name || 'Sem nome',
      vendas: m.vendas,
      valor_vendido: m.valor_total_vendido
    })) || []
  }
}

/**
 * Distribuição de vendas
 */
async function getDistributionMetrics(supabase: any, params: any) {
  const { start_date, end_date } = getDateRange(params)

  const { data: opportunities } = await supabase
    .from('ghl_opportunities')
    .select('status, ghl_data')
    .gte('updated_at', start_date)
    .lte('updated_at', end_date)

  const distribution: any = {
    'Venda Realizada': 0,
    'Venda com Sinal': 0,
    'Venda Perdida': 0
  }

  opportunities?.forEach((opp: any) => {
    if (opp.status === 'won') {
      // Verificar se tem sinal (simplificado)
      const temSinal = opp.ghl_data?.has_deposit || false
      if (temSinal) {
        distribution['Venda com Sinal']++
      } else {
        distribution['Venda Realizada']++
      }
    } else if (opp.status === 'lost') {
      distribution['Venda Perdida']++
    }
  })

  return {
    distribution: Object.entries(distribution).map(([label, value]) => ({
      label,
      value
    }))
  }
}

/**
 * Métricas de reuniões (1ª vs 2ª)
 */
async function getMeetingsMetrics(supabase: any, params: any) {
  const targetMonth = params.month || new Date().toISOString().slice(0, 7)
  const monthStart = `${targetMonth}-01`

  const { data: metrics } = await supabase
    .from('user_metrics')
    .select(`
      vendas_primeira_reuniao,
      vendas_segunda_reuniao,
      user_roles!inner(role)
    `)
    .eq('month', monthStart)
    .eq('user_roles.role', 'closer')

  const totals = metrics?.reduce((acc: any, m: any) => ({
    primeira: acc.primeira + m.vendas_primeira_reuniao,
    segunda: acc.segunda + m.vendas_segunda_reuniao
  }), { primeira: 0, segunda: 0 }) || { primeira: 0, segunda: 0 }

  return {
    primeira_reuniao: totals.primeira,
    segunda_reuniao: totals.segunda
  }
}

/**
 * Determina o range de datas baseado no período
 */
function getDateRange(params: any) {
  const today = new Date()
  let start_date, end_date

  if (params.period === 'custom' && params.start_date && params.end_date) {
    start_date = params.start_date
    end_date = params.end_date
  } else if (params.period === 'today') {
    start_date = today.toISOString().slice(0, 10)
    end_date = start_date
  } else if (params.period === 'week') {
    const weekAgo = new Date(today)
    weekAgo.setDate(today.getDate() - 7)
    start_date = weekAgo.toISOString().slice(0, 10)
    end_date = today.toISOString().slice(0, 10)
  } else {
    // month (default)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    start_date = monthStart.toISOString().slice(0, 10)
    end_date = today.toISOString().slice(0, 10)
  }

  return { start_date, end_date }
}
