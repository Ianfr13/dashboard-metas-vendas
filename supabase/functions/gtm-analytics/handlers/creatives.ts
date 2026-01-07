import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

export interface CreativeMetrics {
    creativeId: string // utm_content
    adName: string // utm_term
    source: string // utm_source
    medium: string // utm_medium
    pageViews: number // Total de visitas
    leads: number
    checkouts: number
    sales: number
    revenue: number
    conversionRate: number
    roas?: number // Future usage
}

export async function getCreativeRanking(
    supabase: SupabaseClient,
    startDate: string,
    endDate: string
): Promise<CreativeMetrics[]> {
    // Query views for data including utm_content and utm_term
    // We check for events where utm_content IS NOT NULL to avoid unnecessary data
    const { data: events, error } = await supabase
        .from('gtm_analytics_view')
        .select('traffic_source, traffic_medium, utm_content, utm_term, event_name, value')
        .gte('timestamp', startDate)
        .lte('timestamp', endDate)
        .neq('utm_content', null) // Only interested in events tracking a specific creative

    if (error) {
        throw new Error(`Error fetching creative metrics: ${error.message}`)
    }

    // Map to aggregate data
    const creativeMap = new Map<string, CreativeMetrics>()

    events?.forEach(event => {
        // ID is utm_content. If empty (unlikely due to filter), skip or group as '(not set)'
        const creativeId = event.utm_content || '(not set)'

        if (!creativeMap.has(creativeId)) {
            creativeMap.set(creativeId, {
                creativeId,
                adName: event.utm_term || '',
                source: event.traffic_source || '',
                medium: event.traffic_medium || '',
                pageViews: 0,
                leads: 0,
                checkouts: 0,
                sales: 0,
                revenue: 0,
                conversionRate: 0
            })
        }

        const metrics = creativeMap.get(creativeId)!

        // Aggregate counts directly from event names
        // Note: 'page_view' might be 'gtm.js' historically, but view handles logic? 
        // No, view just extracts data. We rely on corrected event names in DB or handle both.
        // Assuming latest script fixes names to 'page_view'.
        if (event.event_name === 'page_view') {
            metrics.pageViews++
        } else if (event.event_name === 'generate_lead') {
            metrics.leads++
        } else if (event.event_name === 'begin_checkout' || event.event_name === 'beginCheckout') {
            metrics.checkouts++
        } else if (event.event_name === 'purchase') {
            metrics.sales++
            metrics.revenue += Number(event.value || 0)
        }
    })

    // Calculate rates and convert to array
    const ranking: CreativeMetrics[] = Array.from(creativeMap.values())
        .map(m => ({
            ...m,
            revenue: Math.round(m.revenue * 100) / 100,
            conversionRate: m.pageViews > 0
                ? Math.round((m.sales / m.pageViews) * 100 * 100) / 100
                : 0
        }))
        .sort((a, b) => b.sales - a.sales || b.revenue - a.revenue) // Sort by Sales, then Revenue

    return ranking
}
