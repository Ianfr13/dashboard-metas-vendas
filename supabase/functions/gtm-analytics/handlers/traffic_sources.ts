import { SupabaseClient } from 'jsr:@supabase/supabase-js@2'

export interface TrafficSourceMetrics {
    source: string
    medium: string
    sessions: number
    leads: number
    sales: number
    revenue: number
    conversionRate: number
}

export async function getTrafficSources(
    supabase: SupabaseClient,
    startDate: string,
    endDate: string
): Promise<TrafficSourceMetrics[]> {

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
                console.error(`[traffic_sources.ts] Error fetching ${table} (page ${page}):`, error);
                throw new Error(`Failed to fetch ${table}`);
            }

            if (!data || data.length === 0) break;

            allData = allData.concat(data);
            if (data.length < PAGE_SIZE) break;

            page++;
        }

        return allData;
    }

    // Query raw events to handle attribution manually
    const events = await fetchAllRows<any>('gtm_events', 'event_name, event_data, utm_source, utm_medium, referrer, session_id', (q) => {
        return q.gte('timestamp', startDate).lte('timestamp', endDate);
    });

    // Helper for normalization
    const normalizeSource = (source: string | null, referrer: string | null): { source: string, medium: string } => {
        let s = (source || '').toLowerCase().trim();
        let m = 'unknown';

        // 1. Try UTM Source
        if (s) {
            if (s === 'ig' || s === 'instagram.com' || s === 'l.instagram.com') s = 'instagram';
            if (s === 'fb' || s === 'facebook.com' || s === 'l.facebook.com') s = 'facebook';
            if (s === 'google' || s === 'google.com') s = 'google';
            if (s === 'yt' || s === 'youtube.com') s = 'youtube';
            if (s === 'tiktok.com') s = 'tiktok';

            return { source: s, medium: 'cpc' }; // Default to cpc if utm exists but medium is missing? Or 'referral'? 
            // Ideally we pass medium too, wait.
        }

        // 2. Try Referrer
        if (referrer) {
            try {
                const url = new URL(referrer);
                const hostname = url.hostname.replace('www.', '');

                if (hostname.includes('instagram')) return { source: 'instagram', medium: 'organic' };
                if (hostname.includes('facebook')) return { source: 'facebook', medium: 'organic' };
                if (hostname.includes('google')) return { source: 'google', medium: 'organic' };
                if (hostname.includes('youtube')) return { source: 'youtube', medium: 'organic' };
                if (hostname.includes('tiktok')) return { source: 'tiktok', medium: 'organic' };
                if (hostname.includes('bing')) return { source: 'bing', medium: 'organic' };

                return { source: hostname, medium: 'referral' };
            } catch {
                // Invalid referrer URL
            }
        }

        // 3. Direct
        return { source: 'direct', medium: '(none)' };
    };

    // Agrupar
    const sourceMap = new Map<string, {
        sessions: Set<string>,
        pageViews: number,
        leads: number,
        sales: number,
        revenue: number
    }>()

    events.forEach(event => {
        // Parse value for purchase
        let revenueValue = 0;
        if (event.event_name === 'purchase') {
            const eventData = typeof event.event_data === 'string'
                ? JSON.parse(event.event_data || '{}')
                : event.event_data || {};
            revenueValue = parseFloat(eventData.value || eventData.transaction_value || '0');
        }

        // Determine Attribution
        // Note: UTMs might come from event columns (if you added them) or event_data.
        // The query selects utm_source, utm_medium columns.
        let rawSource = event.utm_source;
        let rawMedium = event.utm_medium;

        // Normalize
        const normalized = normalizeSource(rawSource, event.referrer);

        // If UTM medium existed, keep it (unless we fell back to referrer)
        if (rawSource) {
            normalized.medium = (rawMedium || 'cpc').toLowerCase().trim(); // Assume cpc/paid if UTMs are present usually
        }

        const key = `${normalized.source}|${normalized.medium}`;

        if (!sourceMap.has(key)) {
            sourceMap.set(key, {
                sessions: new Set(),
                pageViews: 0,
                leads: 0,
                sales: 0,
                revenue: 0
            })
        }

        const metrics = sourceMap.get(key)!

        // Contar Sessões (Distinct Session ID)
        if (event.session_id) {
            metrics.sessions.add(event.session_id)
        }

        // Contar Page Views como fallback para sessões
        if (event.event_name === 'page_view') {
            metrics.pageViews++
        }

        // Contar Conversões
        if (event.event_name === 'generate_lead') {
            metrics.leads++
        } else if (event.event_name === 'purchase') {
            metrics.sales++
            metrics.revenue += revenueValue
        }
    })

    // Converter para array
    const trafficMetrics: TrafficSourceMetrics[] = Array.from(sourceMap.entries())
        .map(([key, metrics]) => {
            const [source, medium] = key.split('|')
            // Se tiver session_id, usa o size. Se não, usa pageViews como proxy.
            const sessionCount = metrics.sessions.size > 0
                ? metrics.sessions.size
                : (metrics.pageViews > 0 ? metrics.pageViews : 0)

            const safeSessions = sessionCount || 1

            return {
                source,
                medium,
                sessions: sessionCount,
                leads: metrics.leads,
                sales: metrics.sales,
                revenue: Math.round(metrics.revenue * 100) / 100,
                conversionRate: Math.round((metrics.sales / safeSessions) * 100 * 100) / 100
            }
        })
        .sort((a, b) => b.revenue - a.revenue) // Ordernar por receita

    return trafficMetrics
}
