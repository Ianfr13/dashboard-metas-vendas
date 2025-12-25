import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

export interface FunnelMetrics {
  etapas: {
    pageViews: number
    leads: number
    checkouts: number
    purchases: number
  }
  conversao: {
    viewsParaLeads: number
    leadsParaCheckout: number
    checkoutParaVenda: number
    endToEnd: number
  }
  financeiro: {
    receitaTotal: number
    ticketMedio: number
  }
}

export async function getFunnelMetrics(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string
): Promise<FunnelMetrics> {
  // Buscar eventos do GTM no período
  const { data: events, error } = await supabase
    .from('gtm_events')
    .select('event_name, event_data, timestamp')
    .gte('timestamp', startDate)
    .lte('timestamp', endDate)

  if (error) {
    throw new Error(`Error fetching GTM events: ${error.message}`)
  }

  // Contar eventos por tipo
  let pageViews = 0
  let leads = 0
  let checkouts = 0
  let purchases = 0
  let receitaTotal = 0

  events?.forEach(event => {
    const eventData = JSON.parse(event.event_data || '{}')
    
    switch (event.event_name) {
      case 'page_view':
        pageViews++
        break
      case 'generate_lead':
        leads++
        break
      case 'begin_checkout':
        checkouts++
        break
      case 'purchase':
        purchases++
        const value = parseFloat(eventData.value || eventData.transaction_value || '0')
        receitaTotal += value
        break
    }
  })

  // Calcular taxas de conversão
  const viewsParaLeads = pageViews > 0 ? (leads / pageViews) * 100 : 0
  const leadsParaCheckout = leads > 0 ? (checkouts / leads) * 100 : 0
  const checkoutParaVenda = checkouts > 0 ? (purchases / checkouts) * 100 : 0
  const endToEnd = pageViews > 0 ? (purchases / pageViews) * 100 : 0

  const ticketMedio = purchases > 0 ? receitaTotal / purchases : 0

  return {
    etapas: {
      pageViews,
      leads,
      checkouts,
      purchases
    },
    conversao: {
      viewsParaLeads: Math.round(viewsParaLeads * 100) / 100,
      leadsParaCheckout: Math.round(leadsParaCheckout * 100) / 100,
      checkoutParaVenda: Math.round(checkoutParaVenda * 100) / 100,
      endToEnd: Math.round(endToEnd * 100) / 100
    },
    financeiro: {
      receitaTotal: Math.round(receitaTotal * 100) / 100,
      ticketMedio: Math.round(ticketMedio * 100) / 100
    }
  }
}
