import { SupabaseClient } from 'jsr:@supabase/supabase-js@2'

export interface FunnelMetrics {
  etapas: {
    pageViews: number
    viewItem: number
    addToWishlist: number
    addToCart: number
    viewCart: number
    beginCheckout: number
    leads: number
    checkouts: number
    purchases: number
  }
  conversao: {
    viewToCart: number // view_item -> add_to_cart
    cartToCheckout: number // add_to_cart -> begin_checkout
    checkoutToPurchase: number // begin_checkout -> purchase
    endToEnd: number // page_view -> purchase
    viewsParaLeads: number // page_view -> generate_lead
    leadsParaCheckout: number // generate_lead -> begin_checkout
    checkoutParaVenda: number // begin_checkout -> purchase
  }
  dropOff: {
    pageViewToViewItem: number
    viewItemToAddToCart: number
    addToCartToCheckout: number
    checkoutToPurchase: number
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
  // Garantir que endDate inclua o dia inteiro
  const endDateWithTime = endDate.includes('T') ? endDate : `${endDate}T23:59:59`

  // Helper to fetch all rows using pagination
  async function fetchAllRows<T>(
    table: string,
    select: string,
    filters: (query: any) => any = q => q
  ): Promise<T[]> {
    let allData: T[] = [];
    let page = 0;
    const PAGE_SIZE = 1000;

    while (true) {
      let query = supabase
        .from(table)
        .select(select)
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      query = filters(query);

      const { data, error } = await query;
      if (error) {
        console.error(`[funnel.ts] Error fetching ${table} (page ${page}):`, error);
        throw new Error(`Failed to fetch ${table}`);
      }

      if (!data || data.length === 0) break;

      allData = allData.concat(data);
      if (data.length < PAGE_SIZE) break;

      page++;
    }

    return allData;
  }

  // Buscar eventos do GTM no período com paginação
  const events = await fetchAllRows<any>('gtm_events', 'event_name, event_data, timestamp', (q) => {
    return q.gte('timestamp', startDate).lte('timestamp', endDateWithTime);
  });

  // Contar eventos por tipo
  let pageViews = 0
  let viewItem = 0
  let addToWishlist = 0
  let addToCart = 0
  let viewCart = 0
  let beginCheckout = 0
  let leads = 0
  let purchases = 0
  let receitaTotal = 0

  events?.forEach((event: { event_name: string; event_data: string | object }) => {
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
      case 'add_to_wishlist':
        addToWishlist++
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
      case 'generate_lead':
        leads++
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
  const viewsParaLeads = pageViews > 0 ? (leads / pageViews) * 100 : 0
  const leadsParaCheckout = leads > 0 ? (beginCheckout / leads) * 100 : 0
  const checkoutParaVenda = beginCheckout > 0 ? (purchases / beginCheckout) * 100 : 0

  // Calculate Drop-off Rates (Inverse of Conversion)
  const calculateDropOff = (from: number, to: number) => {
    if (from === 0) return 0;
    return Math.max(0, ((from - to) / from) * 100);
  }

  const dropOff = {
    pageViewToViewItem: calculateDropOff(pageViews, viewItem),
    viewItemToAddToCart: calculateDropOff(viewItem, addToCart),
    addToCartToCheckout: calculateDropOff(addToCart, beginCheckout),
    checkoutToPurchase: calculateDropOff(beginCheckout, purchases)
  }

  const ticketMedio = purchases > 0 ? receitaTotal / purchases : 0

  return {
    etapas: {
      pageViews,
      viewItem,
      addToWishlist,
      addToCart,
      viewCart,
      beginCheckout,
      leads,
      checkouts: beginCheckout, // Alias for frontend compatibility
      purchases
    },
    conversao: {
      viewToCart: Math.round(viewToCart * 100) / 100,
      cartToCheckout: Math.round(cartToCheckout * 100) / 100,
      checkoutToPurchase: Math.round(checkoutToPurchase * 100) / 100,
      endToEnd: Math.round(endToEnd * 100) / 100,
      viewsParaLeads: Math.round(viewsParaLeads * 100) / 100,
      leadsParaCheckout: Math.round(leadsParaCheckout * 100) / 100,
      checkoutParaVenda: Math.round(checkoutParaVenda * 100) / 100
    },
    dropOff: {
      pageViewToViewItem: Math.round(dropOff.pageViewToViewItem * 100) / 100,
      viewItemToAddToCart: Math.round(dropOff.viewItemToAddToCart * 100) / 100,
      addToCartToCheckout: Math.round(dropOff.addToCartToCheckout * 100) / 100,
      checkoutToPurchase: Math.round(dropOff.checkoutToPurchase * 100) / 100
    },
    financeiro: {
      receitaTotal: Math.round(receitaTotal * 100) / 100,
      ticketMedio: Math.round(ticketMedio * 100) / 100
    }
  }
}
