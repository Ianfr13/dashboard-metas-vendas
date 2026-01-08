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
    name: string
    status: string
    objective: string
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

interface AdSetMetrics {
    id: string
    campaignId: string
    name: string
    status: string
    spend: number
    impressions: number
    clicks: number
    leads: number
    purchases: number
    cpc: number
    ctr: number
    costPerLead: number
}

interface AdMetrics {
    id: string
    adsetId: string
    campaignId: string
    name: string
    status: string
    creativeThumbnail: string | null
    spend: number
    impressions: number
    clicks: number
    leads: number
    purchases: number
    cpc: number
    ctr: number
    costPerLead: number
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

    // Build base query for insights
    let insightsQuery = supabase
        .from('facebook_insights')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)

    if (accountId) {
        insightsQuery = insightsQuery.eq('account_id', accountId)
    }
    if (campaignId) {
        insightsQuery = insightsQuery.eq('campaign_id', campaignId)
    }

    const { data: insights, error: insightsError } = await insightsQuery

    if (insightsError) {
        console.error('[facebook.ts] Error fetching insights:', insightsError)
        throw new Error('Failed to fetch Facebook insights')
    }

    // Fetch campaigns for metadata
    const { data: campaigns } = await supabase
        .from('facebook_campaigns')
        .select('id, account_id, name, status, objective')

    const campaignMap = new Map(campaigns?.map(c => [c.id, c]) || [])

    // Fetch accounts for metadata
    const { data: accounts } = await supabase
        .from('facebook_ad_accounts')
        .select('id, name')
        .eq('active', true)

    const accountMap = new Map(accounts?.map(a => [a.id, a]) || [])

    // Fetch ad sets
    const { data: adsets } = await supabase
        .from('facebook_adsets')
        .select('id, campaign_id, name, status')

    // Fetch ads
    const { data: ads } = await supabase
        .from('facebook_ads')
        .select('id, adset_id, campaign_id, name, status, creative_thumbnail_url')

    // Calculate summary metrics
    const summary = calculateSummary(insights || [])

    // Aggregate by account
    const byAccount = aggregateByAccount(insights || [], accountMap)

    // Aggregate by campaign
    const byCampaign = aggregateByCampaign(insights || [], campaignMap)

    // Aggregate by adset
    const byAdSet = aggregateByAdSet(insights || [], adsets || [])

    // Aggregate by ad
    const byAd = aggregateByAd(insights || [], ads || [])

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
        spend: acc.spend + (i.spend || 0),
        impressions: acc.impressions + (i.impressions || 0),
        clicks: acc.clicks + (i.clicks || 0),
        reach: acc.reach + (i.reach || 0),
        leads: acc.leads + (i.leads || 0),
        purchases: acc.purchases + (i.purchases || 0),
        purchaseValue: acc.purchaseValue + (i.purchase_value || 0)
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

        existing.spend += i.spend || 0
        existing.impressions += i.impressions || 0
        existing.clicks += i.clicks || 0
        existing.leads += i.leads || 0
        existing.purchases += i.purchases || 0
        existing.purchaseValue += i.purchase_value || 0

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

function aggregateByCampaign(insights: any[], campaignMap: Map<string, any>): CampaignMetrics[] {
    const byCampaign = new Map<string, any>()

    for (const i of insights) {
        if (!i.campaign_id) continue

        const existing = byCampaign.get(i.campaign_id) || {
            id: i.campaign_id,
            accountId: i.account_id,
            spend: 0, impressions: 0, clicks: 0, leads: 0, purchases: 0, purchaseValue: 0
        }

        existing.spend += i.spend || 0
        existing.impressions += i.impressions || 0
        existing.clicks += i.clicks || 0
        existing.leads += i.leads || 0
        existing.purchases += i.purchases || 0
        existing.purchaseValue += i.purchase_value || 0

        byCampaign.set(i.campaign_id, existing)
    }

    return Array.from(byCampaign.values()).map(camp => {
        const meta = campaignMap.get(camp.id)
        return {
            id: camp.id,
            accountId: camp.accountId,
            name: meta?.name || camp.id,
            status: meta?.status || 'UNKNOWN',
            objective: meta?.objective || '',
            spend: camp.spend,
            impressions: camp.impressions,
            clicks: camp.clicks,
            leads: camp.leads,
            purchases: camp.purchases,
            purchaseValue: camp.purchaseValue,
            cpc: camp.clicks > 0 ? camp.spend / camp.clicks : 0,
            cpm: camp.impressions > 0 ? (camp.spend / camp.impressions) * 1000 : 0,
            ctr: camp.impressions > 0 ? (camp.clicks / camp.impressions) * 100 : 0,
            costPerLead: camp.leads > 0 ? camp.spend / camp.leads : 0,
            costPerPurchase: camp.purchases > 0 ? camp.spend / camp.purchases : 0,
            roas: camp.spend > 0 ? camp.purchaseValue / camp.spend : 0
        }
    }).sort((a, b) => b.spend - a.spend)
}

function aggregateByAdSet(insights: any[], adsets: any[]): AdSetMetrics[] {
    const adsetMap = new Map(adsets.map(a => [a.id, a]))
    const byAdSet = new Map<string, any>()

    for (const i of insights) {
        if (!i.adset_id) continue

        const existing = byAdSet.get(i.adset_id) || {
            id: i.adset_id,
            campaignId: i.campaign_id,
            spend: 0, impressions: 0, clicks: 0, leads: 0, purchases: 0
        }

        existing.spend += i.spend || 0
        existing.impressions += i.impressions || 0
        existing.clicks += i.clicks || 0
        existing.leads += i.leads || 0
        existing.purchases += i.purchases || 0

        byAdSet.set(i.adset_id, existing)
    }

    return Array.from(byAdSet.values()).map(adset => {
        const meta = adsetMap.get(adset.id)
        return {
            id: adset.id,
            campaignId: adset.campaignId,
            name: meta?.name || adset.id,
            status: meta?.status || 'UNKNOWN',
            spend: adset.spend,
            impressions: adset.impressions,
            clicks: adset.clicks,
            leads: adset.leads,
            purchases: adset.purchases,
            cpc: adset.clicks > 0 ? adset.spend / adset.clicks : 0,
            ctr: adset.impressions > 0 ? (adset.clicks / adset.impressions) * 100 : 0,
            costPerLead: adset.leads > 0 ? adset.spend / adset.leads : 0
        }
    }).sort((a, b) => b.spend - a.spend)
}

function aggregateByAd(insights: any[], ads: any[]): AdMetrics[] {
    const adMap = new Map(ads.map(a => [a.id, a]))
    const byAd = new Map<string, any>()

    for (const i of insights) {
        if (!i.ad_id) continue

        const existing = byAd.get(i.ad_id) || {
            id: i.ad_id,
            adsetId: i.adset_id,
            campaignId: i.campaign_id,
            spend: 0, impressions: 0, clicks: 0, leads: 0, purchases: 0
        }

        existing.spend += i.spend || 0
        existing.impressions += i.impressions || 0
        existing.clicks += i.clicks || 0
        existing.leads += i.leads || 0
        existing.purchases += i.purchases || 0

        byAd.set(i.ad_id, existing)
    }

    return Array.from(byAd.values()).map(ad => {
        const meta = adMap.get(ad.id)
        return {
            id: ad.id,
            adsetId: ad.adsetId,
            campaignId: ad.campaignId,
            name: meta?.name || ad.id,
            status: meta?.status || 'UNKNOWN',
            creativeThumbnail: meta?.creative_thumbnail_url || null,
            spend: ad.spend,
            impressions: ad.impressions,
            clicks: ad.clicks,
            leads: ad.leads,
            purchases: ad.purchases,
            cpc: ad.clicks > 0 ? ad.spend / ad.clicks : 0,
            ctr: ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0,
            costPerLead: ad.leads > 0 ? ad.spend / ad.leads : 0
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

        existing.spend += i.spend || 0
        existing.impressions += i.impressions || 0
        existing.clicks += i.clicks || 0
        existing.leads += i.leads || 0
        existing.purchases += i.purchases || 0
        existing.purchaseValue += i.purchase_value || 0

        byDay.set(date, existing)
    }

    return Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date))
}
