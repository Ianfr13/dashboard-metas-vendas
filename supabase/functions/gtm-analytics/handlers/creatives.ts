import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface CreativeMetrics {
    creativeId: string
    funnelType: 'compra' | 'leads'
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
    spend: number
    cpa: number
    cpl: number
    costPerCheckout: number
    costPerAddToCart: number
}

export async function getCreativeRanking(
    supabase: SupabaseClient,
    startDate: string,
    endDate: string
): Promise<CreativeMetrics[]> {
    // Fix: Adjust endDate to include full day
    const end = endDate.includes('T') ? endDate : `${endDate}T23:59:59`

    // Helper to fetch all rows using pagination
    async function fetchAllRows<T>(
        table: string,
        select: string,
        filters: (query: any) => any = q => q
    ): Promise<T[]> {
        let allData: T[] = [];
        let page = 0;
        const PAGE_SIZE = 1000;

        while (true) {
            let query = supabase
                .from(table)
                .select(select)
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

            query = filters(query);

            const { data, error } = await query;
            if (error) {
                console.error(`[creatives.ts] Error fetching ${table} (page ${page}):`, error);
                throw new Error(`Failed to fetch ${table}`);
            }

            if (!data || data.length === 0) break;

            allData = allData.concat(data);
            if (data.length < PAGE_SIZE) break;

            page++;
        }

        return allData;
    }

    // Include event_data_json to extract page_location and ftype
    const events = await fetchAllRows<any>('gtm_analytics_view', 'traffic_source, traffic_medium, utm_content, utm_term, event_name, value, event_data_json', (q) => {
        return q.gte('timestamp', startDate).lte('timestamp', end).not('utm_content', 'is', null);
    });

    // Fetch Facebook Ads links
    const { data: adsData } = await supabase.from('facebook_ads').select('id, preview_shareable_link');
    const adLinkMap = new Map(adsData?.map((a: any) => [a.id, a.preview_shareable_link]) || []);

    // Format dates for Facebook Insights (YYYY-MM-DD)
    const startDateYMD = startDate.split('T')[0];
    const endDateYMD = endDate.split('T')[0];

    // Fetch Facebook Ads spend data using pagination
    const insightsData = await fetchAllRows<any>('facebook_insights', 'ad_id, spend', (q) => {
        return q.gte('date', startDateYMD).lte('date', endDateYMD).not('ad_id', 'is', null);
    });

    // Create spend map: ad_id -> total spend
    const spendMap = new Map<string, number>();
    insightsData?.forEach((insight: any) => {
        const adId = insight.ad_id;
        if (adId) {
            const current = spendMap.get(adId) || 0;
            spendMap.set(adId, current + Number(insight.spend || 0));
        }
    });


    if (!events || events.length === 0) {
        return [];
    }

    // Helper interface for placement stats
    interface PlacementStats {
        sales: number
        checkouts: number
        addToCart: number
        addToWishlist: number
        pageViews: number
    }

    // Key: creativeId|funnelType
    const creativeMap = new Map<string, CreativeMetrics & { placements: Map<string, PlacementStats> }>()

    events.forEach(event => {
        const creativeId = event.utm_content || '(not set)'
        const medium = event.traffic_medium || '(not set)'

        // Extract funnelType from event_data_json.page_location
        let ftype: 'compra' | 'leads' = 'compra';
        try {
            const eventData = typeof event.event_data_json === 'string'
                ? JSON.parse(event.event_data_json)
                : (event.event_data_json || {});

            const location = eventData.page_location || '';
            const ftypeMatch = location.match(/ftype=([^/&?]+)/);
            if (ftypeMatch && ftypeMatch[1] === 'leads') {
                ftype = 'leads';
            }
        } catch (e) {
            // ignore parse error, default to compra
        }

        const key = `${creativeId}|${ftype}`;

        if (!creativeMap.has(key)) {
            creativeMap.set(key, {
                creativeId,
                funnelType: ftype,
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
                spend: 0,
                cpa: 0,
                cpl: 0,
                costPerCheckout: 0,
                costPerAddToCart: 0,
                placements: new Map()
            })
        }

        const metrics = creativeMap.get(key)!

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

            // Get spend from spendMap
            const spend = spendMap.get(m.creativeId) || 0;

            // Calculate cost metrics
            const cpa = m.sales > 0 ? spend / m.sales : 0;
            const cpl = m.leads > 0 ? spend / m.leads : 0;
            const costPerCheckout = m.checkouts > 0 ? spend / m.checkouts : 0;
            const costPerAddToCart = m.addToCart > 0 ? spend / m.addToCart : 0;

            // Remove internal 'placements' map before returning
            const { placements, ...rest } = m
            return {
                ...rest,
                bestPlacement,
                revenue: Math.round(m.revenue * 100) / 100,
                conversionRate: m.pageViews > 0
                    ? Math.round((m.sales / m.pageViews) * 100 * 100) / 100
                    : 0,
                preview_shareable_link: adLinkMap.get(m.creativeId),
                spend: Math.round(spend * 100) / 100,
                cpa: Math.round(cpa * 100) / 100,
                cpl: Math.round(cpl * 100) / 100,
                costPerCheckout: Math.round(costPerCheckout * 100) / 100,
                costPerAddToCart: Math.round(costPerAddToCart * 100) / 100
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
