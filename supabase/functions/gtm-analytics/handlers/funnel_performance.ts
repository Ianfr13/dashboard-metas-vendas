
import { SupabaseClient } from 'jsr:@supabase/supabase-js@2'

export interface FunnelPerformanceMetrics {
    funnelId: string
    funnelVersion: string
    pageVersion: string
    offerId: string
    funnelStage: string
    sessions: number
    pageViews: number
    addToCart: number
    checkouts: number
    leads: number
    sales: number
    revenue: number
    conversionRate: number
}

export async function getFunnelPerformance(
    supabase: SupabaseClient,
    startDate: string,
    endDate: string
): Promise<FunnelPerformanceMetrics[]> {

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
                console.error(`[funnel_performance.ts] Error fetching ${table} (page ${page}):`, error);
                throw new Error(`Failed to fetch ${table}`);
            }

            if (!data || data.length === 0) break;

            allData = allData.concat(data);
            if (data.length < PAGE_SIZE) break;

            page++;
        }

        return allData;
    }

    // Query raw events
    // We need 'page_view', 'generate_lead', 'purchase'
    // Ensure endDate includes the full day by adding end-of-day time
    const endDateWithTime = endDate.includes('T') ? endDate : `${endDate}T23:59:59.999Z`;
    const events = await fetchAllRows<any>('gtm_events', 'event_name, event_data, session_id', (q) => {
        return q.gte('timestamp', startDate).lte('timestamp', endDateWithTime);
    });

    // Grouping Map
    // Key: fid|fver|pver|oid
    const map = new Map<string, {
        funnelId: string,
        funnelVersion: string,
        pageVersion: string,
        offerId: string,
        funnelStage: string,
        sessions: Set<string>,
        pageViews: number,
        addToCart: number,
        checkouts: number,
        leads: number,
        sales: number,
        revenue: number
    }>()

    events.forEach(event => {
        const eventData = typeof event.event_data === 'string'
            ? JSON.parse(event.event_data || '{}')
            : event.event_data || {};

        // Extract Tracking Parameters from page_location
        // Structure: /fid=.../fver=.../pver=.../oid=.../fstg=...
        const location = eventData.page_location || '';
        const fidMatch = location.match(/fid=([^/&?]+)/);
        const fverMatch = location.match(/fver=([^/&?]+)/);
        const pverMatch = location.match(/pver=([^/&?]+)/);
        const oidMatch = location.match(/oid=([^/&?]+)/);
        const fstgMatch = location.match(/fstg=([^/&?]+)/);

        const fid = fidMatch?.[1] || '(not set)';
        const fver = fverMatch?.[1] || '(not set)';
        const pver = pverMatch?.[1] || '(not set)';
        const oid = oidMatch?.[1] || '(not set)';
        const fstg = fstgMatch?.[1] || '(not set)';

        // Chave única para agroupamento
        const key = `${fid}|${fver}|${pver}|${oid}|${fstg}`;

        if (!map.has(key)) {
            map.set(key, {
                funnelId: fid,
                funnelVersion: fver,
                pageVersion: pver,
                offerId: oid,
                funnelStage: fstg,
                sessions: new Set(),
                pageViews: 0,
                addToCart: 0,
                checkouts: 0,
                leads: 0,
                sales: 0,
                revenue: 0
            });
        }

        const metrics = map.get(key)!;

        // Count Sessions
        if (event.session_id) {
            metrics.sessions.add(event.session_id);
        }

        // Metrics
        if (event.event_name === 'page_view') {
            metrics.pageViews++;
        } else if (event.event_name === 'add_to_cart') {
            metrics.addToCart++;
        } else if (event.event_name === 'begin_checkout') {
            metrics.checkouts++;
        } else if (event.event_name === 'generate_lead') {
            metrics.leads++;
        } else if (event.event_name === 'purchase') {
            metrics.sales++;
            const val = parseFloat(eventData.value || eventData.transaction_value || '0');
            metrics.revenue += val;
        }
    });

    const results: FunnelPerformanceMetrics[] = Array.from(map.values())
        .map(m => {
            const sessionCount = m.sessions.size > 0 ? m.sessions.size : (m.pageViews > 0 ? m.pageViews : 1);

            return {
                funnelId: m.funnelId,
                funnelVersion: m.funnelVersion,
                pageVersion: m.pageVersion,
                offerId: m.offerId,
                funnelStage: m.funnelStage,
                sessions: sessionCount,
                pageViews: m.pageViews,
                addToCart: m.addToCart,
                checkouts: m.checkouts,
                leads: m.leads,
                sales: m.sales,
                revenue: Math.round(m.revenue * 100) / 100,
                conversionRate: Math.round((m.sales / sessionCount) * 100 * 100) / 100
            }
        })
        .sort((a, b) => b.revenue - a.revenue);

    return results;
}
