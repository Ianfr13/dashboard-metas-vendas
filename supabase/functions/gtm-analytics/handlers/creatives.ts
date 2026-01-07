import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

export interface CreativeMetrics {
    creativeId: string // utm_content
    adName: string // utm_term
    source: string // utm_source
    medium: string // utm_medium
    pageViews: number
    leads: number
    addToWishlist: number
    addToCart: number
    checkouts: number
    sales: number
    revenue: number
    conversionRate: number
}

export async function getCreativeRanking(
    supabase: SupabaseClient,
    startDate: string,
    endDate: string
): Promise<CreativeMetrics[]> {
    const { data: events, error } = await supabase
        .from('gtm_analytics_view')
        .select('traffic_source, traffic_medium, utm_content, utm_term, event_name, value')
        .gte('timestamp', startDate)
        .lte('timestamp', endDate)
        .neq('utm_content', null)

    if (error) {
        throw new Error(`Error fetching creative metrics: ${error.message}`)
    }

    const creativeMap = new Map<string, CreativeMetrics>()

    events?.forEach(event => {
        const creativeId = event.utm_content || '(not set)'

        if (!creativeMap.has(creativeId)) {
            creativeMap.set(creativeId, {
                creativeId,
                adName: event.utm_term || '',
                source: event.traffic_source || '',
                medium: event.traffic_medium || '',
                pageViews: 0,
                leads: 0,
                addToWishlist: 0,
                addToCart: 0,
                checkouts: 0,
                sales: 0,
                revenue: 0,
                conversionRate: 0
            })
        }

        const metrics = creativeMap.get(creativeId)!

        if (event.event_name === 'page_view') {
            metrics.pageViews++
        } else if (event.event_name === 'generate_lead') {
            metrics.leads++
        } else if (event.event_name === 'add_to_wishlist') {
            metrics.addToWishlist++
        } else if (event.event_name === 'add_to_cart') {
            metrics.addToCart++
        } else if (event.event_name === 'begin_checkout' || event.event_name === 'beginCheckout') {
            metrics.checkouts++
        } else if (event.event_name === 'purchase') {
            metrics.sales++
            metrics.revenue += Number(event.value || 0)
        }
    })

    const ranking: CreativeMetrics[] = Array.from(creativeMap.values())
        .map(m => ({
            ...m,
            revenue: Math.round(m.revenue * 100) / 100,
            conversionRate: m.pageViews > 0
                ? Math.round((m.sales / m.pageViews) * 100 * 100) / 100
                : 0
        }))
        // Sorting by weight: Purchase > IC > AddToCart > Wishlist > PageView
        .sort((a, b) => {
            if (b.sales !== a.sales) return b.sales - a.sales;
            if (b.checkouts !== a.checkouts) return b.checkouts - a.checkouts;
            if (b.addToCart !== a.addToCart) return b.addToCart - a.addToCart;
            if (b.addToWishlist !== a.addToWishlist) return b.addToWishlist - a.addToWishlist;
            return b.pageViews - a.pageViews;
        })

    return ranking
}
