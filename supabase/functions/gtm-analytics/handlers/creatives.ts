import { SupabaseClient } from 'jsr:@supabase/supabase-js@2'

export interface CreativeMetrics {
    creativeId: string
    adName: string
    source: string
    medium: string
    pageViews: number
    leads: number
    addToWishlist: number
    addToCart: number
    checkouts: number
    sales: number
    revenue: number
    conversionRate: number
    bestPlacement: string
}

export async function getCreativeRanking(
    supabase: SupabaseClient,
    startDate: string,
    endDate: string
): Promise<CreativeMetrics[]> {
    // Fix: Adjust endDate to include full day
    const end = endDate.includes('T') ? endDate : `${endDate}T23:59:59`

    const { data: events, error } = await supabase
        .from('gtm_analytics_view')
        .select('traffic_source, traffic_medium, utm_content, utm_term, event_name, value')
        .gte('timestamp', startDate)
        .lte('timestamp', end)
        .not('utm_content', 'is', null)

    if (error) {
        throw new Error(`Error fetching creative metrics: ${error.message}`)
    }

    // Helper interface for placement stats
    interface PlacementStats {
        sales: number
        checkouts: number
        addToCart: number
        addToWishlist: number
        pageViews: number
    }

    const creativeMap = new Map<string, CreativeMetrics & { placements: Map<string, PlacementStats> }>()

    events?.forEach(event => {
        const creativeId = event.utm_content || '(not set)'
        const medium = event.traffic_medium || '(not set)'

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
                conversionRate: 0,
                bestPlacement: '',
                placements: new Map()
            })
        }

        const metrics = creativeMap.get(creativeId)!

        // Init placement stats if needed
        if (!metrics.placements.has(medium)) {
            metrics.placements.set(medium, {
                sales: 0,
                checkouts: 0,
                addToCart: 0,
                addToWishlist: 0,
                pageViews: 0
            })
        }
        const pStats = metrics.placements.get(medium)!

        if (event.event_name === 'page_view') {
            metrics.pageViews++
            pStats.pageViews++
        } else if (event.event_name === 'generate_lead') {
            metrics.leads++
        } else if (event.event_name === 'add_to_wishlist') {
            metrics.addToWishlist++
            pStats.addToWishlist++
        } else if (event.event_name === 'add_to_cart') {
            metrics.addToCart++
            pStats.addToCart++
        } else if (event.event_name === 'begin_checkout' || event.event_name === 'beginCheckout') {
            metrics.checkouts++
            pStats.checkouts++
        } else if (event.event_name === 'purchase') {
            metrics.sales++
            metrics.revenue += Number(event.value || 0)
            pStats.sales++
        }
    })

    const ranking: CreativeMetrics[] = Array.from(creativeMap.values())
        .map(m => {
            // Determine Best Placement
            let bestPlacement = '-'
            if (m.placements.size > 0) {
                // Sort placements
                const sortedPlacements = Array.from(m.placements.entries()).sort(([, a], [, b]) => {
                    if (b.sales !== a.sales) return b.sales - a.sales
                    if (b.checkouts !== a.checkouts) return b.checkouts - a.checkouts
                    if (b.addToCart !== a.addToCart) return b.addToCart - a.addToCart
                    if (b.addToWishlist !== a.addToWishlist) return b.addToWishlist - a.addToWishlist
                    return b.pageViews - a.pageViews
                })
                bestPlacement = sortedPlacements[0][0] // The key (medium)
            }

            // Remove internal 'placements' map before returning
            const { placements, ...rest } = m
            return {
                ...rest,
                bestPlacement,
                revenue: Math.round(m.revenue * 100) / 100,
                conversionRate: m.pageViews > 0
                    ? Math.round((m.sales / m.pageViews) * 100 * 100) / 100
                    : 0
            }
        })
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
