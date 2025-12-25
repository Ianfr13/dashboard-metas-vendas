import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

export interface GTMSale {
  value: number
  transactionId?: string
  userEmail?: string
  timestamp: string
}

export async function getGTMSales(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string
): Promise<GTMSale[]> {
  const { data: gtmSales, error } = await supabase
    .from('gtm_events')
    .select('*')
    .eq('event_name', 'purchase')
    .gte('timestamp', startDate)
    .lte('timestamp', endDate)

  if (error) {
    throw new Error(`Error fetching GTM sales: ${error.message}`)
  }

  return (gtmSales || []).map(sale => {
    try {
      const eventData = JSON.parse(sale.event_data || '{}')
      return {
        value: parseFloat(eventData.value || eventData.transaction_value || '0'),
        transactionId: eventData.transaction_id,
        userEmail: eventData.user_email || sale.user_id,
        timestamp: sale.timestamp
      }
    } catch (e) {
      console.error('Error parsing GTM sale:', e)
      return {
        value: 0,
        timestamp: sale.timestamp
      }
    }
  })
}
