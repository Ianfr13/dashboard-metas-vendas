
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface FunnelPerformanceMetrics {
    funnelId: string
    funnelType: 'compra' | 'leads'
    funnelVersion: string
    pageVersion: string
    offerId: string
    funnelStage: string
    productName: string
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
    // Added 'page_url' to select list
    const events = await fetchAllRows<any>('gtm_events', 'event_name, event_data, session_id, page_url', (q) => {
        return q.gte('timestamp', startDate).lte('timestamp', endDateWithTime);
    });

    // Grouping Map
    // Key: fid|fver|pver|oid
    const map = new Map<string, {
        funnelId: string,
        funnelType: 'compra' | 'leads',
        funnelVersion: string,
        pageVersion: string,
        offerId: string,
        funnelStage: string,
        productName: string,
        sessions: Set<string>,
        pageViews: number,
        addToCart: number,
        checkouts: number,
        leads: number,
        sales: number,
        revenue: number
    }>()


    // 1. Group events by session_id
    const sessions = new Map<string, any[]>();
    // Store events without session_id separately
    const orphanEvents: any[] = [];

    events.forEach(event => {
        if (event.session_id) {
            if (!sessions.has(event.session_id)) {
                sessions.set(event.session_id, []);
            }
            sessions.get(event.session_id)?.push(event);
        } else {
            orphanEvents.push(event);
        }
    });

    // 2. Process each session to backfill funnel params
    const processedEvents: any[] = [...orphanEvents];

    sessions.forEach((sessionEvents) => {
        // Sort by time to find the "entry" event
        sessionEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        // Find the first event that has funnel params
        let sessionFunnelParams: any = null;

        for (const event of sessionEvents) {
            const eventData = typeof event.event_data === 'string'
                ? JSON.parse(event.event_data || '{}')
                : event.event_data || {};
            // Use top-level page_url column first, then event_data fallback
            const loc = (event.page_url || eventData.page_location || eventData.page_url || '');
            // Check regex like in the original logic
            const fidMatch = loc.match(/fid=([^/&?]+)/);

            if (fidMatch) {
                sessionFunnelParams = {
                    fid: fidMatch[1],
                    fver: loc.match(/fver=([^/&?]+)/)?.[1] || '(not set)',
                    pver: loc.match(/pver=([^/&?]+)/)?.[1] || '(not set)',
                    oid: loc.match(/oid=([^/&?]+)/)?.[1] || '(not set)',
                    fstg: loc.match(/fstg=([^/&?]+)/)?.[1] || '(not set)',
                    ftype: loc.match(/ftype=([^/&?]+)/)?.[1] || 'compra'
                };
                break; // Found the entry params
            }
        }

        // Apply backfilled params or defaults
        sessionEvents.forEach(event => {
            if (sessionFunnelParams) {
                // Attach a temporary property to use in calculation loop
                event._backfilled = sessionFunnelParams;
            }
            processedEvents.push(event);
        });
    });

    // 3. Main Aggregation
    processedEvents.forEach(event => {
        const eventData = typeof event.event_data === 'string'
            ? JSON.parse(event.event_data)
            : (event.event_data || {});

        // Use top-level page_url column first, then event_data fallback
        const location = (event.page_url || eventData.page_location || eventData.page_url || '') as string;

        // Use backfilled params if available, otherwise try URL extraction
        const backfilled = event._backfilled;

        const fidMatch = location.match(/fid=([^/&?]+)/);
        const fverMatch = location.match(/fver=([^/&?]+)/);
        const pverMatch = location.match(/pver=([^/&?]+)/);
        const oidMatch = location.match(/oid=([^/&?]+)/);
        const fstgMatch = location.match(/fstg=([^/&?]+)/);
        const ftypeMatch = location.match(/ftype=([^/&?]+)/);

        // STICT MODE: User requested to ONLY use 'fid=' parameter calling page_url
        // Eliminating database column fallback that brought in checkout slugs
        const fid = backfilled?.fid || fidMatch?.[1] || '(not set)';
        const fver = backfilled?.fver || fverMatch?.[1] || '(not set)';
        const pver = backfilled?.pver || pverMatch?.[1] || '(not set)';
        const oid = backfilled?.oid || oidMatch?.[1] || '(not set)';
        const fstg = backfilled?.fstg || fstgMatch?.[1] || '(not set)';
        const ftypeRaw = backfilled?.ftype || ftypeMatch?.[1] || 'compra';
        const ftype = (ftypeRaw === 'leads') ? 'leads' : 'compra';

        // Extract product name from event_data (sent by GTM on purchase/add_to_cart)
        const productName = eventData.product_name || '(not set)';

        // Unique Key for aggregation
        // ... (rest of logic remains similar)


        // Chave única para agroupamento (includes productName and funnelType)
        const key = `${fid}|${ftype}|${fver}|${pver}|${oid}|${fstg}|${productName}`;

        if (!map.has(key)) {
            map.set(key, {
                funnelId: fid,
                funnelType: ftype,
                funnelVersion: fver,
                pageVersion: pver,
                offerId: oid,
                funnelStage: fstg,
                productName: productName,
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
                funnelType: m.funnelType,
                funnelVersion: m.funnelVersion,
                pageVersion: m.pageVersion,
                offerId: m.offerId,
                funnelStage: m.funnelStage,
                productName: m.productName,
                sessions: sessionCount,
                pageViews: m.pageViews,
                addToCart: m.addToCart,
                checkouts: m.checkouts,
                leads: m.leads,
                sales: m.sales,
                revenue: Math.round(m.revenue * 100) / 100,
                conversionRate: m.funnelType === 'leads'
                    ? Math.round((m.leads / sessionCount) * 100 * 100) / 100
                    : Math.round((m.sales / sessionCount) * 100 * 100) / 100
            }
        })
        .sort((a, b) => b.revenue - a.revenue);

    return results;
}
