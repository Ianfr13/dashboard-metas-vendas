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
        leads: number,
        sales: number,
        revenue: number
    }>()

    events?.forEach(event => {
        const key = `${event.traffic_source}|${event.traffic_medium}`

        if (!sourceMap.has(key)) {
            sourceMap.set(key, {
                sessions: new Set(),
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
            const sessionCount = metrics.sessions.size || 1 // Evitar divisão por zero se não tiver session_id trackeado

            return {
                source,
                medium,
                sessions: sessionCount,
                leads: metrics.leads,
                sales: metrics.sales,
                revenue: Math.round(metrics.revenue * 100) / 100,
                conversionRate: Math.round((metrics.sales / sessionCount) * 100 * 100) / 100
            }
        })
        .sort((a, b) => b.revenue - a.revenue) // Ordernar por receita

    return trafficMetrics
}
