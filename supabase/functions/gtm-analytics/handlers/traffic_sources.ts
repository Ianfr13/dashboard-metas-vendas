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
    // Query na view criada
    const { data: events, error } = await supabase
        .from('gtm_analytics_view')
        .select('traffic_source, traffic_medium, event_name, value, session_id')
        .gte('timestamp', startDate)
        .lte('timestamp', endDate)

    if (error) {
        throw new Error(`Error fetching traffic sources: ${error.message}`)
    }

    // Agrupar
    const sourceMap = new Map<string, {
        sessions: Set<string>,
        pageViews: number,
        leads: number,
        sales: number,
        revenue: number
    }>()

    events?.forEach(event => {
        const key = `${event.traffic_source}|${event.traffic_medium}`

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
            metrics.revenue += Number(event.value || 0)
        }
    })

    // Converter para array
    const trafficMetrics: TrafficSourceMetrics[] = Array.from(sourceMap.entries())
        .map(([key, metrics]) => {
            const [source, medium] = key.split('|')
            // Se tiver session_id, usa o size. Se não, usa pageViews como proxy.
            // Se ambos forem 0, usa 0 (não força 1 artificialmente)
            const sessionCount = metrics.sessions.size > 0
                ? metrics.sessions.size
                : (metrics.pageViews > 0 ? metrics.pageViews : 0)

            // Evitar divisão por zero no cálculo de taxa, mas permitir sessions=0 na display
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
