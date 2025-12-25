import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

export interface ProductMetrics {
  produto: string
  vendas: number
  receita: number
  ticketMedio: number
}

export async function getProductMetrics(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string
): Promise<ProductMetrics[]> {
  const { data: events, error } = await supabase
    .from('gtm_events')
    .select('event_data')
    .eq('event_name', 'purchase')
    .gte('timestamp', startDate)
    .lte('timestamp', endDate)

  if (error) {
    throw new Error(`Error fetching purchases: ${error.message}`)
  }

  // Agrupar por produto
  const productData = new Map<string, { vendas: number; receita: number }>()

  events?.forEach(event => {
    try {
      const eventData = JSON.parse(event.event_data || '{}')
      const productName = eventData.product_name || eventData.item_name || 'Produto Desconhecido'
      const value = parseFloat(eventData.value || eventData.transaction_value || '0')

      if (!productData.has(productName)) {
        productData.set(productName, { vendas: 0, receita: 0 })
      }

      const data = productData.get(productName)!
      data.vendas++
      data.receita += value
    } catch (e) {
      console.error('Error parsing product data:', e)
    }
  })

  // Converter para array
  const productMetrics: ProductMetrics[] = Array.from(productData.entries())
    .map(([produto, data]) => ({
      produto,
      vendas: data.vendas,
      receita: Math.round(data.receita * 100) / 100,
      ticketMedio: Math.round((data.receita / data.vendas) * 100) / 100
    }))
    .sort((a, b) => b.receita - a.receita)

  return productMetrics
}
