import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

export interface FunnelMetrics {
  etapas: {
    pageViews: number
    viewItem: number
    addToCart: number
    viewCart: number
    beginCheckout: number
    purchases: number
  }
  conversao: {
    viewToCart: number // view_item -> add_to_cart
    cartToCheckout: number // add_to_cart -> begin_checkout
    checkoutToPurchase: number // begin_checkout -> purchase
    endToEnd: number // page_view -> purchase
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
  let viewItem = 0
  let addToCart = 0
  let viewCart = 0
  let beginCheckout = 0
  let purchases = 0
  let receitaTotal = 0

  events?.forEach(event => {
    const eventData = typeof event.event_data === 'string'
      ? JSON.parse(event.event_data || '{}')
      : event.event_data || {}

    switch (event.event_name) {
      case 'page_view':
        pageViews++
        break
      case 'view_item':
        viewItem++
        break
      case 'add_to_cart':
        addToCart++
        break
      case 'view_cart':
        viewCart++
        break
      case 'begin_checkout':
        beginCheckout++
        break
      case 'purchase':
        purchases++
        const value = parseFloat(eventData.value || eventData.transaction_value || '0')
        receitaTotal += value
        break
    }
  })

  // Hack: Se viewItem for 0 mas tiver addToCart, assumir que viewItem >= addToCart
  if (viewItem < addToCart) viewItem = addToCart
  if (addToCart < beginCheckout) addToCart = beginCheckout // Simplificação para funis lineares

  // Calcular taxas de conversão
  const viewToCart = viewItem > 0 ? (addToCart / viewItem) * 100 : 0
  const cartToCheckout = addToCart > 0 ? (beginCheckout / addToCart) * 100 : 0
  const checkoutToPurchase = beginCheckout > 0 ? (purchases / beginCheckout) * 100 : 0
  const endToEnd = pageViews > 0 ? (purchases / pageViews) * 100 : 0

  const ticketMedio = purchases > 0 ? receitaTotal / purchases : 0

  return {
    etapas: {
      pageViews,
      viewItem,
      addToCart,
      viewCart,
      beginCheckout,
      purchases
    },
    conversao: {
      viewToCart: Math.round(viewToCart * 100) / 100,
      cartToCheckout: Math.round(cartToCheckout * 100) / 100,
      checkoutToPurchase: Math.round(checkoutToPurchase * 100) / 100,
      endToEnd: Math.round(endToEnd * 100) / 100
    },
    financeiro: {
      receitaTotal: Math.round(receitaTotal * 100) / 100,
      ticketMedio: Math.round(ticketMedio * 100) / 100
    }
  }
}
