import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface FunnelStageMetrics {
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
    viewToCart: number
    cartToCheckout: number
    checkoutToPurchase: number
    endToEnd: number
    viewsParaLeads: number
    leadsParaCheckout: number
    checkoutParaVenda: number
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

export interface FunnelMetrics extends FunnelStageMetrics {
  breakdown: {
    compra: FunnelStageMetrics
    leads: FunnelStageMetrics
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

  type Counts = {
    pageViews: number
    viewItem: number
    addToWishlist: number
    addToCart: number
    viewCart: number
    beginCheckout: number
    leads: number
    purchases: number
    receitaTotal: number
  }

  const newCounts = (): Counts => ({
    pageViews: 0,
    viewItem: 0,
    addToWishlist: 0,
    addToCart: 0,
    viewCart: 0,
    beginCheckout: 0,
    leads: 0,
    purchases: 0,
    receitaTotal: 0
  })

  const counts = {
    total: newCounts(),
    compra: newCounts(),
    leads: newCounts()
  }

  events?.forEach((event: { event_name: string; event_data: string | object }) => {
    const eventData = typeof event.event_data === 'string'
      ? JSON.parse(event.event_data || '{}')
      : event.event_data || {}

    // Extract funnel type
    const location = (eventData.page_location || '') as string;
    const ftypeMatch = location.match(/ftype=([^/&?]+)/);
    // Default to 'compra' if not specified or invalid
    const ftypeRaw = ftypeMatch?.[1] || 'compra';
    const ftype = (ftypeRaw === 'leads') ? 'leads' : 'compra';

    // Helper to update specific counts
    const updateCounts = (c: Counts) => {
      switch (event.event_name) {
        case 'page_view': c.pageViews++; break;
        case 'view_item': c.viewItem++; break;
        case 'add_to_wishlist': c.addToWishlist++; break;
        case 'add_to_cart': c.addToCart++; break;
        case 'view_cart': c.viewCart++; break;
        case 'begin_checkout': c.beginCheckout++; break;
        case 'generate_lead': c.leads++; break;
        case 'purchase':
          c.purchases++;
          c.receitaTotal += parseFloat(eventData.value || eventData.transaction_value || '0');
          break;
      }
    }

    // Update specific bucket and total
    updateCounts(counts[ftype]);
    updateCounts(counts.total);
  })

  // Hack: Fix logic for linear funnels (if viewItem < addToCart, etc)
  const fixCounts = (c: Counts) => {
    if (c.viewItem < c.addToCart) c.viewItem = c.addToCart
    if (c.addToCart < c.beginCheckout) c.addToCart = c.beginCheckout
  }

  fixCounts(counts.total);
  fixCounts(counts.compra);
  fixCounts(counts.leads);

  // Helper to calculate metrics object from counts
  const calculateMetrics = (c: Counts): FunnelStageMetrics => {
    const viewToCart = c.viewItem > 0 ? (c.addToCart / c.viewItem) * 100 : 0
    const cartToCheckout = c.addToCart > 0 ? (c.beginCheckout / c.addToCart) * 100 : 0
    const checkoutToPurchase = c.beginCheckout > 0 ? (c.purchases / c.beginCheckout) * 100 : 0
    const endToEnd = c.pageViews > 0 ? (c.purchases / c.pageViews) * 100 : 0
    const viewsParaLeads = c.pageViews > 0 ? (c.leads / c.pageViews) * 100 : 0
    const leadsParaCheckout = c.leads > 0 ? (c.beginCheckout / c.leads) * 100 : 0
    const checkoutParaVenda = c.beginCheckout > 0 ? (c.purchases / c.beginCheckout) * 100 : 0

    const calculateDropOff = (from: number, to: number) => {
      if (from === 0) return 0;
      return Math.max(0, ((from - to) / from) * 100);
    }

    const dropOff = {
      pageViewToViewItem: calculateDropOff(c.pageViews, c.viewItem),
      viewItemToAddToCart: calculateDropOff(c.viewItem, c.addToCart),
      addToCartToCheckout: calculateDropOff(c.addToCart, c.beginCheckout),
      checkoutToPurchase: calculateDropOff(c.beginCheckout, c.purchases)
    }

    const ticketMedio = c.purchases > 0 ? c.receitaTotal / c.purchases : 0

    return {
      etapas: {
        pageViews: c.pageViews,
        viewItem: c.viewItem,
        addToWishlist: c.addToWishlist,
        addToCart: c.addToCart,
        viewCart: c.viewCart,
        beginCheckout: c.beginCheckout,
        leads: c.leads,
        checkouts: c.beginCheckout,
        purchases: c.purchases
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
        receitaTotal: Math.round(c.receitaTotal * 100) / 100,
        ticketMedio: Math.round(ticketMedio * 100) / 100
      }
    }
  }

  // Construct final response
  const totalMetrics = calculateMetrics(counts.total);
  const compraMetrics = calculateMetrics(counts.compra);
  const leadsMetrics = calculateMetrics(counts.leads);

  return {
    ...totalMetrics,
    breakdown: {
      compra: compraMetrics,
      leads: leadsMetrics
    }
  }
}
