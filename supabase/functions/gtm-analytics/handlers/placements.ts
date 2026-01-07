import { SupabaseClient } from 'jsr:@supabase/supabase-js@2'

export interface PlacementMetrics {
    placement: string // traffic_medium
    source: string // traffic_source
    sales: number
    revenue: number
    conversionRate: number
    pageViews: number // para calcular conversao
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
        // Agrupar por source + medium (ex: meta_ads | Instagram_Reels)
        // Se medium for genérico (cpc, paid), talvez não seja útil como "posicionamento",
        // Mas vamos mostrar o que vier.
        const medium = event.traffic_medium || '(not set)'
        const source = event.traffic_source || '(not set)'
        const key = `${source}|${medium}`

        if (!map.has(key)) {
            map.set(key, {
                placement: medium,
                source: source,
                sales: 0,
                revenue: 0,
                pageViews: 0,
                conversionRate: 0
            })
        }

        const m = map.get(key)!

        if (event.event_name === 'purchase') {
            m.sales++
            m.revenue += Number(event.value || 0)
        } else if (event.event_name === 'page_view') {
            m.pageViews++
        }
    })

    const ranking = Array.from(map.values())
        .map(m => ({
            ...m,
            revenue: Math.round(m.revenue * 100) / 100,
            conversionRate: m.pageViews > 0
                ? Math.round((m.sales / m.pageViews) * 100 * 100) / 100
                : 0
        }))
        .sort((a, b) => b.sales - a.sales || b.revenue - a.revenue) // Foco total em VENDA

    return ranking
}
