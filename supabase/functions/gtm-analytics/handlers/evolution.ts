import { SupabaseClient } from 'jsr:@supabase/supabase-js@2'

export interface EvolutionData {
  date: string
  count: number
}

export async function getEvolutionChart(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string,
  eventName: string,
  groupBy: 'hour' | 'day' | 'week'
): Promise<EvolutionData[]> {
  const { data: events, error } = await supabase
    .from('gtm_events')
    .select('event_name, timestamp')
    .eq('event_name', eventName)
    .gte('timestamp', startDate)
    .lte('timestamp', endDate)
    .order('timestamp', { ascending: true })

  if (error) {
    throw new Error(`Error fetching events: ${error.message}`)
  }

  // Agrupar por período
  const groupedData = new Map<string, number>()

  events?.forEach(event => {
    const date = new Date(event.timestamp)
    let key: string

    if (groupBy === 'hour') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`
    } else if (groupBy === 'week') {
      // Agrupar por semana (início da semana)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      key = weekStart.toISOString().split('T')[0]
    } else {
      // Default: day
      key = date.toISOString().split('T')[0]
    }

    groupedData.set(key, (groupedData.get(key) || 0) + 1)
  })

  // Converter para array
  const evolutionData: EvolutionData[] = Array.from(groupedData.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return evolutionData
}
