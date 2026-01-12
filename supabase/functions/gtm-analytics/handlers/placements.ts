import { SupabaseClient } from 'jsr:@supabase/supabase-js@2'

export interface PlacementMetrics {
    placement: string // traffic_medium
    source: string // traffic_source
    sales: number
    leads: number // NEW: count of generate_lead events
    revenue: number
    conversionRate: number
    leadConversionRate: number // NEW: leads / pageViews
    pageViews: number // para calcular conversao
    isFormPlacement: boolean // NEW: true if this is a Facebook Form placement
}

export async function getPlacementRanking(
    supabase: SupabaseClient,
    startDate: string,
    endDate: string
): Promise<PlacementMetrics[]> {
    const { data: events, error } = await supabase
        .from('gtm_analytics_view')
        .select('traffic_source, traffic_medium, event_name, value')
        .gte('timestamp', startDate)
        .lte('timestamp', endDate)

    if (error) {
        throw new Error(`Error fetching placement metrics: ${error.message}`)
    }

    const map = new Map<string, PlacementMetrics>()

    events?.forEach(event => {
        const medium = event.traffic_medium || '(not set)'
        const source = event.traffic_source || '(not set)'
        const key = `${source}|${medium}`

        // Detect Form placements (Facebook Instant Form, Lead Ads)
        const mediumLower = medium.toLowerCase()
        const sourceLower = source.toLowerCase()
        const isFormPlacement = mediumLower.includes('form') ||
            mediumLower.includes('lead_form') ||
            mediumLower.includes('instant_form') ||
            (sourceLower.includes('facebook') && mediumLower.includes('lead'))

        if (!map.has(key)) {
            map.set(key, {
                placement: medium,
                source: source,
                sales: 0,
                leads: 0,
                revenue: 0,
                pageViews: 0,
                conversionRate: 0,
                leadConversionRate: 0,
                isFormPlacement
            })
        }

        const m = map.get(key)!

        if (event.event_name === 'purchase') {
            m.sales++
            m.revenue += Number(event.value || 0)
        } else if (event.event_name === 'page_view') {
            m.pageViews++
        } else if (event.event_name === 'generate_lead') {
            m.leads++
        }
    })

    const ranking = Array.from(map.values())
        .map(m => ({
            ...m,
            revenue: Math.round(m.revenue * 100) / 100,
            conversionRate: m.pageViews > 0
                ? Math.round((m.sales / m.pageViews) * 100 * 100) / 100
                : 0,
            leadConversionRate: m.pageViews > 0
                ? Math.round((m.leads / m.pageViews) * 100 * 100) / 100
                : 0
        }))
        .sort((a, b) => b.sales - a.sales || b.leads - a.leads || b.revenue - a.revenue)

    return ranking
}

