import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface SalesByDay {
  [date: string]: {
    sales: number;
    revenue: number;
  };
}

export interface SalesTotals {
  sales: number;
  revenue: number;
  salesByDay: SalesByDay;
}

export async function aggregateSales(
  supabase: SupabaseClient,
  month: number,
  year: number
): Promise<SalesTotals> {
  // Calculate date range
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

  console.log('[aggregateSales] Fetching for:', { month, year, startDate, endDate });

  // Fetch purchase events
  const { data: salesEvents, error } = await supabase
    .from('gtm_events')
    .select('event_data, created_at')
    .eq('event_name', 'purchase')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  console.log('[aggregateSales] Query result:', {
    error: error?.message,
    count: salesEvents?.length || 0,
    events: salesEvents
  });

  if (error) {
    console.error('[aggregateSales] Error fetching sales:', error);
    return {
      sales: 0,
      revenue: 0,
      salesByDay: {},
    };
  }

  // Aggregate data
  let totalSales = 0;
  let totalRevenue = 0;
  const salesByDay: SalesByDay = {};

  (salesEvents || []).forEach((event) => {
    // Parse event_data - can be stored as JSON string or object
    let eventData: any = {};
    try {
      eventData = typeof event.event_data === 'string'
        ? JSON.parse(event.event_data)
        : event.event_data || {};
    } catch (e) {
      console.warn('Error parsing event_data:', e);
    }

    const value = parseFloat(eventData?.value || 0);
    const date = new Date(event.created_at).toISOString().split('T')[0];

    totalSales++;
    totalRevenue += value;

    if (!salesByDay[date]) {
      salesByDay[date] = { sales: 0, revenue: 0 };
    }
    salesByDay[date].sales++;
    salesByDay[date].revenue += value;
  });

  return {
    sales: totalSales,
    revenue: totalRevenue,
    salesByDay,
  };
}
