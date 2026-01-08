import { SupabaseClient } from 'jsr:@supabase/supabase-js@2'

export interface FacebookMetricsResponse {
    summary: {
        totalSpend: number
        totalImpressions: number
        totalClicks: number
        totalReach: number
        totalLeads: number
        totalPurchases: number
        totalPurchaseValue: number
        avgCpc: number
        avgCpm: number
        avgCtr: number
        avgCostPerLead: number
        avgCostPerPurchase: number
        roas: number
    }
    byAccount: AccountMetrics[]
    byCampaign: CampaignMetrics[]
    byAdSet: AdSetMetrics[]
    byAd: AdMetrics[]
    evolution: DailyMetrics[]
}

export async function getFacebookAccounts(supabase: SupabaseClient) {
    const { data, error } = await supabase
        .from('facebook_ad_accounts')
        .select('id, name, currency, account_status')
        .eq('active', true)
        .order('name')

    if (error) throw new Error(`Failed to fetch accounts: ${error.message}`)
    return data
}

interface AccountMetrics {
    id: string
    name: string
    spend: number
    impressions: number
    clicks: number
    leads: number
    purchases: number
    purchaseValue: number
    cpc: number
    cpm: number
    ctr: number
    costPerLead: number
    costPerPurchase: number
    roas: number
}

interface CampaignMetrics {
    id: string
    accountId: string
    accountName: string
    name: string
    status: string
    objective: string
    spend: number
    impressions: number
    reach: number
    frequency: number
    clicks: number
    uniqueClicks: number
    ctr: number
    uniqueCtr: number
    cpc: number
    cpm: number
    cpp: number
    leads: number
    purchases: number
    purchaseValue: number
    addToCart: number
    initiateCheckout: number
    landingPageViews: number
    linkClicks: number
    leadValue: number
    costPerLead: number
    costPerPurchase: number
    roas: number
    videoViews: number
    videoP25Watched: number
    videoP50Watched: number
    videoP75Watched: number
    videoP100Watched: number
}

interface AdSetMetrics {
    id: string
    campaignId: string
    campaignName: string
    name: string
    status: string
    spend: number
    impressions: number
    reach: number
    clicks: number
    leads: number
    purchases: number
    purchaseValue: number
    addToCart: number
    initiateCheckout: number
    landingPageViews: number
    linkClicks: number
    cpc: number
    cpm: number
    ctr: number
    costPerLead: number
    costPerPurchase: number
    roas: number
}

interface AdMetrics {
    id: string
    adsetId: string
    adsetName: string
    campaignId: string
    campaignName: string
    name: string
    status: string
    creativeThumbnail: string | null
    spend: number
    impressions: number
    reach: number
    clicks: number
    leads: number
    purchases: number
    purchaseValue: number
    addToCart: number
    initiateCheckout: number
    landingPageViews: number
    linkClicks: number
    cpc: number
    cpm: number
    ctr: number
    costPerLead: number
    costPerPurchase: number
    roas: number
}

interface DailyMetrics {
    date: string
    spend: number
    impressions: number
    clicks: number
    leads: number
    purchases: number
    purchaseValue: number
}

export async function getFacebookMetrics(
    supabase: SupabaseClient,
    startDate: string,
    endDate: string,
    accountId?: string,
    campaignId?: string
): Promise<FacebookMetricsResponse> {

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
                console.error(`[facebook.ts] Error fetching ${table} (page ${page}):`, error);
                throw new Error(`Failed to fetch ${table}`);
            }

            if (!data || data.length === 0) break;

            allData = allData.concat(data);
            if (data.length < PAGE_SIZE) break;

            page++;
        }

        return allData;
    }

    // Fetch insights (potentially large dataset)
    const insights = await fetchAllRows<any>('facebook_insights', '*', (q) => {
        let query = q.gte('date', startDate).lte('date', endDate);
        if (accountId) query = query.eq('account_id', accountId);
        if (campaignId) query = query.eq('campaign_id', campaignId);
        return query;
    });

    // Fetch campaigns
    const campaigns = await fetchAllRows<any>('facebook_campaigns', 'id, account_id, name, status, objective');
    const campaignMap = new Map(campaigns.map(c => [c.id, c]));

    // Fetch accounts
    const accounts = await fetchAllRows<any>('facebook_ad_accounts', 'id, name', (q) => q.eq('active', true));
    const accountMap = new Map(accounts.map(a => [a.id, a]));

    // Fetch ad sets
    const adsets = await fetchAllRows<any>('facebook_adsets', 'id, campaign_id, name, status');
    // const adsetMap = new Map(adsets.map(a => [a.id, a])); // Unused in this scope but good to have if needed

    // Fetch ads
    const ads = await fetchAllRows<any>('facebook_ads', 'id, adset_id, campaign_id, name, status, creative_thumbnail_url');
    const adsetMap = new Map(adsets?.map(a => [a.id, a]) || []); // Re-instantiated here for aggregateByAd

    // Calculate summary metrics
    const summary = calculateSummary(insights || [])

    // Aggregate by account
    const byAccount = aggregateByAccount(insights || [], accountMap)

    // Aggregate by campaign
    const byCampaign = aggregateByCampaign(insights || [], campaignMap, accountMap)

    // Aggregate by adset
    const byAdSet = aggregateByAdSet(insights || [], adsets || [], campaignMap)

    // Aggregate by ad
    const byAd = aggregateByAd(insights || [], ads || [], adsetMap, campaignMap)

    // Evolution by day
    const evolution = aggregateByDay(insights || [])

    return {
        summary,
        byAccount,
        byCampaign,
        byAdSet,
        byAd,
        evolution
    }
}

function calculateSummary(insights: any[]): FacebookMetricsResponse['summary'] {
    const totals = insights.reduce((acc, i) => ({
        spend: acc.spend + Number(i.spend || 0),
        impressions: acc.impressions + Number(i.impressions || 0),
        clicks: acc.clicks + Number(i.clicks || 0),
        reach: acc.reach + Number(i.reach || 0),
        leads: acc.leads + Number(i.leads || 0),
        purchases: acc.purchases + Number(i.purchases || 0),
        purchaseValue: acc.purchaseValue + Number(i.purchase_value || 0)
    }), { spend: 0, impressions: 0, clicks: 0, reach: 0, leads: 0, purchases: 0, purchaseValue: 0 })

    return {
        totalSpend: totals.spend,
        totalImpressions: totals.impressions,
        totalClicks: totals.clicks,
        totalReach: totals.reach,
        totalLeads: totals.leads,
        totalPurchases: totals.purchases,
        totalPurchaseValue: totals.purchaseValue,
        avgCpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
        avgCpm: totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0,
        avgCtr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
        avgCostPerLead: totals.leads > 0 ? totals.spend / totals.leads : 0,
        avgCostPerPurchase: totals.purchases > 0 ? totals.spend / totals.purchases : 0,
        roas: totals.spend > 0 ? totals.purchaseValue / totals.spend : 0
    }
}

function aggregateByAccount(insights: any[], accountMap: Map<string, any>): AccountMetrics[] {
    const byAccount = new Map<string, any>()

    for (const i of insights) {
        const existing = byAccount.get(i.account_id) || {
            id: i.account_id,
            spend: 0, impressions: 0, clicks: 0, leads: 0, purchases: 0, purchaseValue: 0
        }

        existing.spend += Number(i.spend || 0)
        existing.impressions += Number(i.impressions || 0)
        existing.clicks += Number(i.clicks || 0)
        existing.leads += Number(i.leads || 0)
        existing.purchases += Number(i.purchases || 0)
        existing.purchaseValue += Number(i.purchase_value || 0)

        byAccount.set(i.account_id, existing)
    }

    return Array.from(byAccount.values()).map(acc => ({
        id: acc.id,
        name: accountMap.get(acc.id)?.name || acc.id,
        spend: acc.spend,
        impressions: acc.impressions,
        clicks: acc.clicks,
        leads: acc.leads,
        purchases: acc.purchases,
        purchaseValue: acc.purchaseValue,
        cpc: acc.clicks > 0 ? acc.spend / acc.clicks : 0,
        cpm: acc.impressions > 0 ? (acc.spend / acc.impressions) * 1000 : 0,
        ctr: acc.impressions > 0 ? (acc.clicks / acc.impressions) * 100 : 0,
        costPerLead: acc.leads > 0 ? acc.spend / acc.leads : 0,
        costPerPurchase: acc.purchases > 0 ? acc.spend / acc.purchases : 0,
        roas: acc.spend > 0 ? acc.purchaseValue / acc.spend : 0
    }))
}

function aggregateByCampaign(insights: any[], campaignMap: Map<string, any>, accountMap: Map<string, any>): CampaignMetrics[] {
    const byCampaign = new Map<string, any>()

    // Initialize with all campaigns
    for (const camp of campaignMap.values()) {
        byCampaign.set(camp.id, {
            id: camp.id,
            accountId: camp.account_id,
            spend: 0, impressions: 0, reach: 0, clicks: 0, uniqueClicks: 0,
            leads: 0, purchases: 0, purchaseValue: 0, leadValue: 0,
            addToCart: 0, initiateCheckout: 0, landingPageViews: 0, linkClicks: 0,
            videoViews: 0, videoP25Watched: 0, videoP50Watched: 0, videoP75Watched: 0, videoP100Watched: 0
        })
    }

    for (const i of insights) {
        if (!i.campaign_id) continue

        const existing = byCampaign.get(i.campaign_id)
        // If campaign exists in map (or if we want to support campaigns not in our metadata table for some reason)
        if (!existing) continue // Skip insights for unknown campaigns to be safe, or we could create them.

        existing.spend += Number(i.spend || 0)
        existing.impressions += Number(i.impressions || 0)
        existing.reach += Number(i.reach || 0)
        existing.clicks += Number(i.clicks || 0)
        existing.uniqueClicks += Number(i.unique_clicks || 0)
        existing.leads += Number(i.leads || 0)
        existing.purchases += Number(i.purchases || 0)
        existing.purchaseValue += Number(i.purchase_value || 0)
        existing.leadValue += Number(i.lead_value || 0)
        existing.addToCart += Number(i.add_to_cart || 0)
        existing.initiateCheckout += Number(i.initiate_checkout || 0)
        existing.landingPageViews += Number(i.landing_page_views || 0)
        existing.linkClicks += Number(i.link_clicks || 0)
        existing.videoViews += Number(i.video_views || 0)
        existing.videoP25Watched += Number(i.video_p25_watched || 0)
        existing.videoP50Watched += Number(i.video_p50_watched || 0)
        existing.videoP75Watched += Number(i.video_p75_watched || 0)
        existing.videoP100Watched += Number(i.video_p100_watched || 0)
    }

    return Array.from(byCampaign.values()).map(camp => {
        const meta = campaignMap.get(camp.id)
        const accountName = accountMap.get(camp.accountId)?.name || camp.accountId

        return {
            id: camp.id,
            accountId: camp.accountId,
            accountName,
            name: meta?.name || camp.id,
            status: meta?.status || 'UNKNOWN',
            objective: meta?.objective || '',
            spend: camp.spend,
            impressions: camp.impressions,
            reach: camp.reach,
            frequency: camp.reach > 0 ? camp.impressions / camp.reach : 0,
            clicks: camp.clicks,
            uniqueClicks: camp.uniqueClicks,
            ctr: camp.impressions > 0 ? (camp.clicks / camp.impressions) * 100 : 0,
            uniqueCtr: camp.impressions > 0 ? (camp.uniqueClicks / camp.impressions) * 100 : 0,
            cpc: camp.clicks > 0 ? camp.spend / camp.clicks : 0,
            cpm: camp.impressions > 0 ? (camp.spend / camp.impressions) * 1000 : 0,
            cpp: camp.reach > 0 ? (camp.spend / camp.reach) * 1000 : 0,
            leads: camp.leads,
            purchases: camp.purchases,
            purchaseValue: camp.purchaseValue,
            addToCart: camp.addToCart,
            initiateCheckout: camp.initiateCheckout,
            landingPageViews: camp.landingPageViews,
            linkClicks: camp.linkClicks,
            leadValue: camp.leadValue,
            costPerLead: camp.leads > 0 ? camp.spend / camp.leads : 0,
            costPerPurchase: camp.purchases > 0 ? camp.spend / camp.purchases : 0,
            roas: camp.spend > 0 ? camp.purchaseValue / camp.spend : 0,
            videoViews: camp.videoViews,
            videoP25Watched: camp.videoP25Watched,
            videoP50Watched: camp.videoP50Watched,
            videoP75Watched: camp.videoP75Watched,
            videoP100Watched: camp.videoP100Watched
        }
    }).sort((a, b) => b.spend - a.spend)
}

function aggregateByAdSet(insights: any[], adsets: any[], campaignMap: Map<string, any>): AdSetMetrics[] {
    const adsetMap = new Map(adsets.map(a => [a.id, a]))
    const byAdSet = new Map<string, any>()

    // Initialize with all adsets
    for (const adset of adsets) {
        byAdSet.set(adset.id, {
            id: adset.id,
            campaignId: adset.campaign_id,
            spend: 0, impressions: 0, reach: 0, clicks: 0, leads: 0, purchases: 0,
            purchaseValue: 0, addToCart: 0, initiateCheckout: 0, landingPageViews: 0, linkClicks: 0
        })
    }

    for (const i of insights) {
        if (!i.adset_id) continue

        const existing = byAdSet.get(i.adset_id)
        if (!existing) continue

        existing.spend += Number(i.spend || 0)
        existing.impressions += Number(i.impressions || 0)
        existing.reach += Number(i.reach || 0)
        existing.clicks += Number(i.clicks || 0)
        existing.leads += Number(i.leads || 0)
        existing.purchases += Number(i.purchases || 0)
        existing.purchaseValue += Number(i.purchase_value || 0)
        existing.addToCart += Number(i.add_to_cart || 0)
        existing.initiateCheckout += Number(i.initiate_checkout || 0)
        existing.landingPageViews += Number(i.landing_page_views || 0)
        existing.linkClicks += Number(i.link_clicks || 0)
    }

    return Array.from(byAdSet.values()).map(adset => {
        const meta = adsetMap.get(adset.id)
        const campaignName = campaignMap.get(adset.campaignId)?.name || adset.campaignId

        return {
            id: adset.id,
            campaignId: adset.campaignId,
            campaignName,
            name: meta?.name || adset.id,
            status: meta?.status || 'UNKNOWN',
            spend: adset.spend,
            impressions: adset.impressions,
            reach: adset.reach,
            clicks: adset.clicks,
            leads: adset.leads,
            purchases: adset.purchases,
            purchaseValue: adset.purchaseValue,
            addToCart: adset.addToCart,
            initiateCheckout: adset.initiateCheckout,
            landingPageViews: adset.landingPageViews,
            linkClicks: adset.linkClicks,
            cpc: adset.clicks > 0 ? adset.spend / adset.clicks : 0,
            cpm: adset.impressions > 0 ? (adset.spend / adset.impressions) * 1000 : 0,
            ctr: adset.impressions > 0 ? (adset.clicks / adset.impressions) * 100 : 0,
            costPerLead: adset.leads > 0 ? adset.spend / adset.leads : 0,
            costPerPurchase: adset.purchases > 0 ? adset.spend / adset.purchases : 0,
            roas: adset.spend > 0 ? adset.purchaseValue / adset.spend : 0
        }
    }).sort((a, b) => b.spend - a.spend)
}

function aggregateByAd(insights: any[], ads: any[], adsetMap: Map<string, any>, campaignMap: Map<string, any>): AdMetrics[] {
    const adMap = new Map(ads.map(a => [a.id, a]))
    const byAd = new Map<string, any>()

    // Initialize with all ads
    for (const ad of ads) {
        byAd.set(ad.id, {
            id: ad.id,
            adsetId: ad.adset_id,
            campaignId: ad.campaign_id,
            spend: 0, impressions: 0, reach: 0, clicks: 0, leads: 0, purchases: 0,
            purchaseValue: 0, addToCart: 0, initiateCheckout: 0, landingPageViews: 0, linkClicks: 0
        })
    }

    for (const i of insights) {
        if (!i.ad_id) continue

        const existing = byAd.get(i.ad_id)
        if (!existing) continue

        existing.spend += Number(i.spend || 0)
        existing.impressions += Number(i.impressions || 0)
        existing.reach += Number(i.reach || 0)
        existing.clicks += Number(i.clicks || 0)
        existing.leads += Number(i.leads || 0)
        existing.purchases += Number(i.purchases || 0)
        existing.purchaseValue += Number(i.purchase_value || 0)
        existing.addToCart += Number(i.add_to_cart || 0)
        existing.initiateCheckout += Number(i.initiate_checkout || 0)
        existing.landingPageViews += Number(i.landing_page_views || 0)
        existing.linkClicks += Number(i.link_clicks || 0)
    }

    return Array.from(byAd.values()).map(ad => {
        const meta = adMap.get(ad.id)
        const adsetName = adsetMap.get(ad.adsetId)?.name || ad.adsetId
        const campaignName = campaignMap.get(ad.campaignId)?.name || ad.campaignId

        return {
            id: ad.id,
            adsetId: ad.adsetId,
            adsetName,
            campaignId: ad.campaignId,
            campaignName,
            name: meta?.name || ad.id,
            status: meta?.status || 'UNKNOWN',
            creativeThumbnail: meta?.creative_thumbnail_url || null,
            spend: ad.spend,
            impressions: ad.impressions,
            reach: ad.reach,
            clicks: ad.clicks,
            leads: ad.leads,
            purchases: ad.purchases,
            purchaseValue: ad.purchaseValue,
            addToCart: ad.addToCart,
            initiateCheckout: ad.initiateCheckout,
            landingPageViews: ad.landingPageViews,
            linkClicks: ad.linkClicks,
            cpc: ad.clicks > 0 ? ad.spend / ad.clicks : 0,
            cpm: ad.impressions > 0 ? (ad.spend / ad.impressions) * 1000 : 0,
            ctr: ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0,
            costPerLead: ad.leads > 0 ? ad.spend / ad.leads : 0,
            costPerPurchase: ad.purchases > 0 ? ad.spend / ad.purchases : 0,
            roas: ad.spend > 0 ? ad.purchaseValue / ad.spend : 0
        }
    }).sort((a, b) => b.spend - a.spend)
}

function aggregateByDay(insights: any[]): DailyMetrics[] {
    const byDay = new Map<string, any>()

    for (const i of insights) {
        const date = i.date
        const existing = byDay.get(date) || {
            date,
            spend: 0, impressions: 0, clicks: 0, leads: 0, purchases: 0, purchaseValue: 0
        }

        existing.spend += Number(i.spend || 0)
        existing.impressions += Number(i.impressions || 0)
        existing.clicks += Number(i.clicks || 0)
        existing.leads += Number(i.leads || 0)
        existing.purchases += Number(i.purchases || 0)
        existing.purchaseValue += Number(i.purchase_value || 0)

        byDay.set(date, existing)
    }

    return Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date))
}
