/**
 * Handler: calculate
 * 
 * Calcula métricas, scores e rankings para todos os usuários.
 * Atribui badges automaticamente.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface CalculateParams {
  month?: string // formato: YYYY-MM (opcional, default: mês atual)
  user_id?: string // calcular apenas para um usuário específico (opcional)
}

export async function calculate(params: CalculateParams) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Determinar o mês de referência
  const targetMonth = params.month || new Date().toISOString().slice(0, 7)
  const monthStart = `${targetMonth}-01`
  const monthEnd = new Date(new Date(monthStart).getFullYear(), new Date(monthStart).getMonth() + 1, 0)
    .toISOString().slice(0, 10)

  console.log(`[calculate] Calculando métricas para ${targetMonth}`)

  // 1. Buscar usuários ativos com suas funções
  const { data: users, error: usersError } = await supabase
    .from('user_roles')
    .select('ghl_user_id, role, ghl_users(id, name, email)')
    .eq('active', true)

  if (usersError) throw usersError

  if (!users || users.length === 0) {
    console.log('[calculate] Nenhum usuário ativo encontrado')
    return { message: 'Nenhum usuário ativo encontrado' }
  }

  console.log(`[calculate] Processando ${users.length} usuários`)

  // 2. Calcular métricas para cada usuário
  const metricsToUpsert = []

  for (const user of users) {
    const userId = user.ghl_user_id
    const role = user.role

    console.log(`[calculate] Calculando métricas para ${userId} (${role})`)

    const metrics = await calculateUserMetrics(supabase, userId, role, monthStart, monthEnd)
    
    metricsToUpsert.push({
      ghl_user_id: userId,
      month: monthStart,
      ...metrics
    })
  }

  // 3. Calcular scores e posições por função
  const metricsByRole = {
    sdr: metricsToUpsert.filter((m, i) => users[i].role === 'sdr'),
    closer: metricsToUpsert.filter((m, i) => users[i].role === 'closer'),
    ciclo_completo: metricsToUpsert.filter((m, i) => users[i].role === 'ciclo_completo')
  }

  // Calcular scores
  for (const [role, metrics] of Object.entries(metricsByRole)) {
    for (const metric of metrics) {
      metric.score = calculateScore(role as string, metric)
    }

    // Ordenar por score e atribuir posições
    metrics.sort((a, b) => b.score - a.score)
    metrics.forEach((m, index) => {
      m.position = index + 1
    })
  }

  // 4. Salvar métricas no banco
  const { error: upsertError } = await supabase
    .from('user_metrics')
    .upsert(metricsToUpsert, { onConflict: 'ghl_user_id,month' })

  if (upsertError) throw upsertError

  console.log(`[calculate] ${metricsToUpsert.length} métricas salvas`)

  // 5. Atribuir badges
  await assignBadges(supabase, metricsToUpsert, monthStart)

  return {
    message: 'Cálculo concluído com sucesso',
    month: targetMonth,
    users_processed: metricsToUpsert.length
  }
}

/**
 * Calcula métricas de um usuário específico
 */
async function calculateUserMetrics(
  supabase: any,
  userId: string,
  role: string,
  monthStart: string,
  monthEnd: string
) {
  const metrics: any = {
    agendamentos: 0,
    comparecimentos: 0,
    nao_comparecimentos: 0,
    taxa_comparecimento: 0,
    vendas_geradas: 0,
    vendas: 0,
    vendas_primeira_reuniao: 0,
    vendas_segunda_reuniao: 0,
    vendas_perdidas: 0,
    valor_total_vendido: 0,
    ticket_medio: 0,
    taxa_conversao: 0,
    vendas_ciclo_completo: 0,
    taxa_conversao_ponta_a_ponta: 0
  }

  // Métricas SDR
  if (role === 'sdr' || role === 'ciclo_completo') {
    // Contar agendamentos criados pelo usuário
    const { data: appointments } = await supabase
      .from('ghl_appointments')
      .select('id, status')
      .eq('assigned_user_id', userId)
      .gte('created_at', monthStart)
      .lte('created_at', monthEnd)

    if (appointments) {
      metrics.agendamentos = appointments.length
      metrics.comparecimentos = appointments.filter((a: any) => 
        a.status === 'completed' || a.status === 'confirmed'
      ).length
      metrics.nao_comparecimentos = appointments.filter((a: any) => 
        a.status === 'no_show'
      ).length
      metrics.taxa_comparecimento = metrics.agendamentos > 0
        ? (metrics.comparecimentos / metrics.agendamentos * 100)
        : 0
    }

    // Contar vendas geradas (oportunidades que viraram vendas)
    const { data: opportunities } = await supabase
      .from('ghl_opportunities')
      .select('id')
      .eq('assigned_user_id', userId)
      .eq('status', 'won')
      .gte('created_at', monthStart)
      .lte('created_at', monthEnd)

    if (opportunities) {
      metrics.vendas_geradas = opportunities.length
    }
  }

  // Métricas Closer
  if (role === 'closer' || role === 'ciclo_completo') {
    // Contar vendas fechadas
    const { data: sales } = await supabase
      .from('ghl_opportunities')
      .select('id, status, monetary_value, ghl_data')
      .eq('assigned_user_id', userId)
      .gte('updated_at', monthStart)
      .lte('updated_at', monthEnd)

    if (sales) {
      const wonSales = sales.filter((s: any) => s.status === 'won')
      const lostSales = sales.filter((s: any) => s.status === 'lost')

      metrics.vendas = wonSales.length
      metrics.vendas_perdidas = lostSales.length
      metrics.valor_total_vendido = wonSales.reduce((sum: number, s: any) => 
        sum + (s.monetary_value || 0), 0
      )
      metrics.ticket_medio = metrics.vendas > 0
        ? metrics.valor_total_vendido / metrics.vendas
        : 0

      // Taxa de conversão (vendas / total de oportunidades)
      const totalOpportunities = wonSales.length + lostSales.length
      metrics.taxa_conversao = totalOpportunities > 0
        ? (metrics.vendas / totalOpportunities * 100)
        : 0

      // Vendas 1ª vs 2ª reunião (simplificado - pode ser refinado)
      metrics.vendas_primeira_reuniao = Math.floor(metrics.vendas * 0.6) // 60% na 1ª
      metrics.vendas_segunda_reuniao = metrics.vendas - metrics.vendas_primeira_reuniao
    }
  }

  // Métricas Ciclo Completo
  if (role === 'ciclo_completo') {
    // Vendas onde o mesmo usuário fez agendamento e fechamento
    metrics.vendas_ciclo_completo = metrics.vendas // simplificado
    metrics.taxa_conversao_ponta_a_ponta = metrics.agendamentos > 0
      ? (metrics.vendas_ciclo_completo / metrics.agendamentos * 100)
      : 0
  }

  return metrics
}

/**
 * Calcula score baseado na função e métricas
 */
function calculateScore(role: string, metrics: any): number {
  let score = 0

  if (role === 'sdr') {
    score = (metrics.agendamentos * 10) +
            (metrics.comparecimentos * 20) +
            (metrics.taxa_comparecimento * 5) +
            (metrics.vendas_geradas * 50)
  } else if (role === 'closer') {
    score = (metrics.vendas * 100) +
            (metrics.taxa_conversao * 10) +
            (metrics.ticket_medio / 100)
  } else if (role === 'ciclo_completo') {
    score = (metrics.vendas_ciclo_completo * 150) +
            (metrics.taxa_conversao_ponta_a_ponta * 15)
  }

  return Math.round(score * 100) / 100
}

/**
 * Atribui badges automaticamente baseado nas posições
 */
async function assignBadges(supabase: any, metrics: any[], month: string) {
  const badgesToInsert = []

  // Agrupar por posição
  const top3 = metrics.filter(m => m.position && m.position <= 3)

  for (const metric of top3) {
    let badgeType = ''
    
    if (metric.position === 1) {
      badgeType = 'ouro'
      // Também adicionar badge de campeão do mês
      badgesToInsert.push({
        ghl_user_id: metric.ghl_user_id,
        badge_type: 'campeao_mes',
        month,
        metadata: { score: metric.score, position: 1 }
      })
    } else if (metric.position === 2) {
      badgeType = 'prata'
    } else if (metric.position === 3) {
      badgeType = 'bronze'
    }

    if (badgeType) {
      badgesToInsert.push({
        ghl_user_id: metric.ghl_user_id,
        badge_type: badgeType,
        month,
        metadata: { score: metric.score, position: metric.position }
      })
    }
  }

  if (badgesToInsert.length > 0) {
    const { error } = await supabase
      .from('badges')
      .upsert(badgesToInsert, { onConflict: 'ghl_user_id,badge_type,month' })

    if (error) {
      console.error('[assignBadges] Error:', error)
    } else {
      console.log(`[assignBadges] ${badgesToInsert.length} badges atribuídos`)
    }
  }
}
