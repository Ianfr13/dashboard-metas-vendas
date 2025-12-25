import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

interface FunnelMetrics {
  etapas: {
    pageViews: number
    leads: number
    checkouts: number
    purchases: number
  }
  conversao: {
    viewsParaLeads: number
    leadsParaCheckout: number
    checkoutParaVenda: number
    endToEnd: number
  }
  financeiro: {
    receitaTotal: number
    ticketMedio: number
  }
}

interface EvolutionData {
  date: string
  count: number
}

interface ProductMetrics {
  produto: string
  vendas: number
  receita: number
  ticketMedio: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'funnel'
    const startDate = url.searchParams.get('start_date')
    const endDate = url.searchParams.get('end_date')
    const eventName = url.searchParams.get('event_name') || 'purchase'
    const groupBy = url.searchParams.get('group_by') || 'day' // hour, day, week

    if (!startDate || !endDate) {
      return new Response(
        JSON.stringify({ error: 'Missing start_date or end_date parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ===== AÇÃO: FUNNEL METRICS =====
    if (action === 'funnel') {
      // Buscar eventos do GTM no período
      const { data: events, error } = await supabase
        .from('gtm_events')
        .select('event_name, event_data, timestamp')
        .gte('timestamp', startDate)
        .lte('timestamp', endDate)

      if (error) {
        throw new Error(`Error fetching GTM events: ${error.message}`)
      }

      // Contar eventos por tipo
      let pageViews = 0
      let leads = 0
      let checkouts = 0
      let purchases = 0
      let receitaTotal = 0

      events?.forEach(event => {
        const eventData = JSON.parse(event.event_data || '{}')
        
        switch (event.event_name) {
          case 'page_view':
            pageViews++
            break
          case 'generate_lead':
            leads++
            break
          case 'begin_checkout':
            checkouts++
            break
          case 'purchase':
            purchases++
            const value = parseFloat(eventData.value || eventData.transaction_value || '0')
            receitaTotal += value
            break
        }
      })

      // Calcular taxas de conversão
      const viewsParaLeads = pageViews > 0 ? (leads / pageViews) * 100 : 0
      const leadsParaCheckout = leads > 0 ? (checkouts / leads) * 100 : 0
      const checkoutParaVenda = checkouts > 0 ? (purchases / checkouts) * 100 : 0
      const endToEnd = pageViews > 0 ? (purchases / pageViews) * 100 : 0

      const ticketMedio = purchases > 0 ? receitaTotal / purchases : 0

      const funnelMetrics: FunnelMetrics = {
        etapas: {
          pageViews,
          leads,
          checkouts,
          purchases
        },
        conversao: {
          viewsParaLeads: Math.round(viewsParaLeads * 100) / 100,
          leadsParaCheckout: Math.round(leadsParaCheckout * 100) / 100,
          checkoutParaVenda: Math.round(checkoutParaVenda * 100) / 100,
          endToEnd: Math.round(endToEnd * 100) / 100
        },
        financeiro: {
          receitaTotal: Math.round(receitaTotal * 100) / 100,
          ticketMedio: Math.round(ticketMedio * 100) / 100
        }
      }

      return new Response(JSON.stringify(funnelMetrics), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    // ===== AÇÃO: EVOLUTION CHART =====
    if (action === 'evolution') {
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

      return new Response(JSON.stringify(evolutionData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    // ===== AÇÃO: PRODUCT METRICS =====
    if (action === 'products') {
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

      return new Response(JSON.stringify(productMetrics), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    // Ação inválida
    return new Response(
      JSON.stringify({ error: 'Invalid action. Use: funnel, evolution, or products' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in gtm-analytics function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
