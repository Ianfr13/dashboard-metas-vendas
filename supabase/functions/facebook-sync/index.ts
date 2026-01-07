import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const FB_GRAPH_API = 'https://graph.facebook.com/v21.0'

// Métricas disponíveis para buscar da API
const AVAILABLE_METRICS = [
    'spend', 'impressions', 'reach', 'frequency',
    'clicks', 'unique_clicks', 'ctr', 'unique_ctr', 'cpc', 'cpm', 'cpp',
    'actions', 'action_values', 'cost_per_action_type',
    'video_p25_watched_actions', 'video_p50_watched_actions',
    'video_p75_watched_actions', 'video_p100_watched_actions'
]

// Default metrics if not specified
const DEFAULT_METRICS = [
    'spend', 'impressions', 'reach', 'clicks', 'ctr', 'cpc', 'cpm',
    'actions', 'action_values', 'cost_per_action_type'
]

interface FBCampaign {
    id: string
    name: string
    status: string
    effective_status: string
    objective: string
    buying_type?: string
    daily_budget?: string
    lifetime_budget?: string
    budget_remaining?: string
    start_time?: string
    stop_time?: string
    created_time?: string
}

interface FBAdSet {
    id: string
    campaign_id: string
    name: string
    status: string
    effective_status: string
    optimization_goal?: string
    billing_event?: string
    bid_amount?: string
    daily_budget?: string
    lifetime_budget?: string
    targeting?: any
    start_time?: string
    end_time?: string
    created_time?: string
}

interface FBAd {
    id: string
    adset_id: string
    campaign_id: string
    name: string
    status: string
    effective_status: string
    creative?: { id: string, thumbnail_url?: string }
    preview_shareable_link?: string
    created_time?: string
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const url = new URL(req.url)
        const action = url.searchParams.get('action') || 'sync'
        const startDate = url.searchParams.get('start_date') || getDefaultStartDate()
        const endDate = url.searchParams.get('end_date') || getDefaultEndDate()
        const accountId = url.searchParams.get('account_id') // Optional: sync specific account
        const level = url.searchParams.get('level') || 'campaign' // campaign, adset, ad
        const customMetrics = url.searchParams.get('metrics')?.split(',') || DEFAULT_METRICS

        // Get Facebook token
        const fbToken = Deno.env.get('FACEBOOK_ACCESS_TOKEN')
        if (!fbToken) {
            return new Response(
                JSON.stringify({ error: 'FACEBOOK_ACCESS_TOKEN not configured' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Create Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        let result: any

        switch (action) {
            case 'sync':
                result = await syncAllData(supabase, fbToken, startDate, endDate, accountId, level, customMetrics)
                break

            case 'accounts':
                result = await fetchAdAccounts(fbToken)
                break

            case 'campaigns':
                result = await fetchCampaigns(fbToken, accountId)
                break

            case 'adsets':
                result = await fetchAdSets(fbToken, accountId)
                break

            case 'ads':
                result = await fetchAds(fbToken, accountId)
                break

            case 'insights':
                result = await fetchInsights(fbToken, accountId || '', startDate, endDate, level, customMetrics)
                break

            case 'refresh-token':
                result = await refreshToken(fbToken)
                break

            default:
                return new Response(
                    JSON.stringify({ error: 'Invalid action. Use: sync, accounts, campaigns, adsets, ads, insights' }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
        }

        return new Response(
            JSON.stringify(result),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Facebook Sync Error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return new Response(
            JSON.stringify({ error: errorMessage }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})

// ============================================
// MAIN SYNC FUNCTION
// ============================================

async function syncAllData(
    supabase: any,
    token: string,
    startDate: string,
    endDate: string,
    accountId: string | null,
    level: string,
    metrics: string[]
) {
    console.log(`[facebook-sync] Starting sync from ${startDate} to ${endDate}`)

    // 1. Fetch all ad accounts (or specific one)
    const accounts = await fetchAdAccounts(token, accountId)
    console.log(`[facebook-sync] Found ${accounts.length} ad accounts`)

    // Upsert accounts
    for (const acc of accounts) {
        await supabase.from('facebook_ad_accounts').upsert({
            id: acc.id,
            name: acc.name,
            currency: acc.currency || 'BRL',
            timezone: acc.timezone_name || 'America/Sao_Paulo',
            account_status: acc.account_status,
            active: acc.account_status === 1,
            updated_at: new Date().toISOString()
        }, { onConflict: 'id' })
    }

    let totalCampaigns = 0
    let totalAdSets = 0
    let totalAds = 0
    let totalInsights = 0

    // 2. For each account, fetch campaigns, adsets, ads, and insights
    for (const acc of accounts) {
        // Fetch and upsert campaigns
        const campaigns = await fetchCampaigns(token, acc.id)
        console.log(`[facebook-sync] Account ${acc.id}: ${campaigns.length} campaigns`)
        totalCampaigns += campaigns.length

        for (const camp of campaigns) {
            await supabase.from('facebook_campaigns').upsert({
                id: camp.id,
                account_id: acc.id,
                name: camp.name,
                status: camp.status,
                effective_status: camp.effective_status,
                objective: camp.objective,
                buying_type: camp.buying_type,
                daily_budget: camp.daily_budget ? parseFloat(camp.daily_budget) / 100 : null,
                lifetime_budget: camp.lifetime_budget ? parseFloat(camp.lifetime_budget) / 100 : null,
                budget_remaining: camp.budget_remaining ? parseFloat(camp.budget_remaining) / 100 : null,
                start_time: camp.start_time,
                stop_time: camp.stop_time,
                created_time: camp.created_time,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' })
        }

        // Fetch and upsert ad sets
        const adsets = await fetchAdSets(token, acc.id)
        console.log(`[facebook-sync] Account ${acc.id}: ${adsets.length} ad sets`)
        totalAdSets += adsets.length

        for (const adset of adsets) {
            await supabase.from('facebook_adsets').upsert({
                id: adset.id,
                campaign_id: adset.campaign_id,
                account_id: acc.id,
                name: adset.name,
                status: adset.status,
                effective_status: adset.effective_status,
                optimization_goal: adset.optimization_goal,
                billing_event: adset.billing_event,
                bid_amount: adset.bid_amount ? parseFloat(adset.bid_amount) / 100 : null,
                daily_budget: adset.daily_budget ? parseFloat(adset.daily_budget) / 100 : null,
                lifetime_budget: adset.lifetime_budget ? parseFloat(adset.lifetime_budget) / 100 : null,
                targeting: adset.targeting,
                start_time: adset.start_time,
                end_time: adset.end_time,
                created_time: adset.created_time,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' })
        }

        // Fetch and upsert ads
        const ads = await fetchAds(token, acc.id)
        console.log(`[facebook-sync] Account ${acc.id}: ${ads.length} ads`)
        totalAds += ads.length

        for (const ad of ads) {
            await supabase.from('facebook_ads').upsert({
                id: ad.id,
                adset_id: ad.adset_id,
                campaign_id: ad.campaign_id,
                account_id: acc.id,
                name: ad.name,
                status: ad.status,
                effective_status: ad.effective_status,
                creative_id: ad.creative?.id,
                creative_thumbnail_url: ad.creative?.thumbnail_url,
                preview_shareable_link: ad.preview_shareable_link,
                created_time: ad.created_time,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' })
        }

        // Fetch and upsert insights
        const insights = await fetchInsights(token, acc.id, startDate, endDate, level, metrics)
        console.log(`[facebook-sync] Account ${acc.id}: ${insights.length} insight records`)
        totalInsights += insights.length

        for (const insight of insights) {
            const record = parseInsightRecord(insight, acc.id)
            await supabase.from('facebook_insights').upsert(record, {
                onConflict: 'campaign_id,date'
            })
        }
    }

    return {
        success: true,
        synced: {
            accounts: accounts.length,
            campaigns: totalCampaigns,
            adsets: totalAdSets,
            ads: totalAds,
            insights: totalInsights
        },
        period: { start_date: startDate, end_date: endDate }
    }
}

// ============================================
// API FETCH FUNCTIONS
// ============================================

async function fetchAdAccounts(token: string, specificId?: string | null): Promise<any[]> {
    if (specificId) {
        const res = await fetch(
            `${FB_GRAPH_API}/${specificId}?fields=id,name,currency,timezone_name,account_status&access_token=${token}`
        )
        if (!res.ok) throw new Error(`Failed to fetch account: ${await res.text()}`)
        return [await res.json()]
    }

    // Fetch all accessible ad accounts
    const res = await fetch(
        `${FB_GRAPH_API}/me/adaccounts?fields=id,name,currency,timezone_name,account_status&limit=100&access_token=${token}`
    )
    if (!res.ok) throw new Error(`Failed to fetch accounts: ${await res.text()}`)
    const data = await res.json()
    return data.data || []
}

async function fetchCampaigns(token: string, accountId: string | null): Promise<FBCampaign[]> {
    if (!accountId) return []

    const fields = 'id,name,status,effective_status,objective,buying_type,daily_budget,lifetime_budget,budget_remaining,start_time,stop_time,created_time'
    const res = await fetch(
        `${FB_GRAPH_API}/${accountId}/campaigns?fields=${fields}&limit=500&access_token=${token}`
    )
    if (!res.ok) throw new Error(`Failed to fetch campaigns: ${await res.text()}`)
    const data = await res.json()
    return data.data || []
}

async function fetchAdSets(token: string, accountId: string | null): Promise<FBAdSet[]> {
    if (!accountId) return []

    const fields = 'id,campaign_id,name,status,effective_status,optimization_goal,billing_event,bid_amount,daily_budget,lifetime_budget,targeting,start_time,end_time,created_time'
    const res = await fetch(
        `${FB_GRAPH_API}/${accountId}/adsets?fields=${fields}&limit=500&access_token=${token}`
    )
    if (!res.ok) throw new Error(`Failed to fetch adsets: ${await res.text()}`)
    const data = await res.json()
    return data.data || []
}

async function fetchAds(token: string, accountId: string | null): Promise<FBAd[]> {
    if (!accountId) return []

    const fields = 'id,adset_id,campaign_id,name,status,effective_status,creative{id,thumbnail_url},preview_shareable_link,created_time'
    const res = await fetch(
        `${FB_GRAPH_API}/${accountId}/ads?fields=${fields}&limit=500&access_token=${token}`
    )
    if (!res.ok) throw new Error(`Failed to fetch ads: ${await res.text()}`)
    const data = await res.json()
    return data.data || []
}

async function fetchInsights(
    token: string,
    accountId: string,
    startDate: string,
    endDate: string,
    level: string,
    metrics: string[]
): Promise<any[]> {
    if (!accountId) return []

    const fields = metrics.join(',')
    const params = new URLSearchParams({
        fields,
        level,
        time_range: JSON.stringify({ since: startDate, until: endDate }),
        time_increment: '1', // Daily breakdown
        limit: '1000',
        access_token: token
    })

    const res = await fetch(`${FB_GRAPH_API}/${accountId}/insights?${params}`)
    if (!res.ok) {
        const errorText = await res.text()
        console.error(`[facebook-sync] Insights error: ${errorText}`)
        // Don't throw, just return empty
        return []
    }

    const data = await res.json()
    return data.data || []
}

async function refreshToken(currentToken: string): Promise<{ success: boolean, new_token?: string, expires_in?: number }> {
    const appId = Deno.env.get('FACEBOOK_APP_ID')
    const appSecret = Deno.env.get('FACEBOOK_APP_SECRET')

    if (!appId || !appSecret) {
        return { success: false }
    }

    const res = await fetch(
        `${FB_GRAPH_API}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${currentToken}`
    )

    if (!res.ok) {
        return { success: false }
    }

    const data = await res.json()
    return {
        success: true,
        new_token: data.access_token,
        expires_in: data.expires_in
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function parseInsightRecord(insight: any, accountId: string): any {
    // Parse actions array to extract specific conversion types
    const actions = insight.actions || []
    const actionValues = insight.action_values || []
    const costPerAction = insight.cost_per_action_type || []

    const getActionCount = (actionType: string): number => {
        const action = actions.find((a: any) => a.action_type === actionType)
        return action ? parseInt(action.value) : 0
    }

    const getActionValue = (actionType: string): number => {
        const action = actionValues.find((a: any) => a.action_type === actionType)
        return action ? parseFloat(action.value) : 0
    }

    const getCostPerAction = (actionType: string): number => {
        const action = costPerAction.find((a: any) => a.action_type === actionType)
        return action ? parseFloat(action.value) : 0
    }

    // Calculate leads (multiple possible action types)
    const leads = getActionCount('lead') ||
        getActionCount('onsite_conversion.lead_grouped') ||
        getActionCount('offsite_conversion.fb_pixel_lead')

    // Calculate purchases
    const purchases = getActionCount('purchase') ||
        getActionCount('offsite_conversion.fb_pixel_purchase') ||
        getActionCount('onsite_conversion.purchase')

    const purchaseValue = getActionValue('purchase') ||
        getActionValue('offsite_conversion.fb_pixel_purchase')

    const spend = parseFloat(insight.spend || '0')
    const costPerLead = getCostPerAction('lead') ||
        getCostPerAction('offsite_conversion.fb_pixel_lead') ||
        (leads > 0 ? spend / leads : 0)

    const costPerPurchase = getCostPerAction('purchase') ||
        getCostPerAction('offsite_conversion.fb_pixel_purchase') ||
        (purchases > 0 ? spend / purchases : 0)

    const roas = spend > 0 ? purchaseValue / spend : 0

    return {
        account_id: accountId,
        campaign_id: insight.campaign_id,
        adset_id: insight.adset_id || null,
        ad_id: insight.ad_id || null,
        date: insight.date_start,

        spend,
        impressions: parseInt(insight.impressions || '0'),
        reach: parseInt(insight.reach || '0'),
        frequency: parseFloat(insight.frequency || '0'),

        clicks: parseInt(insight.clicks || '0'),
        unique_clicks: parseInt(insight.unique_clicks || '0'),
        ctr: parseFloat(insight.ctr || '0'),
        unique_ctr: parseFloat(insight.unique_ctr || '0'),
        cpc: parseFloat(insight.cpc || '0'),
        cpm: parseFloat(insight.cpm || '0'),
        cpp: parseFloat(insight.cpp || '0'),

        leads,
        purchases,
        add_to_cart: getActionCount('add_to_cart') || getActionCount('offsite_conversion.fb_pixel_add_to_cart'),
        initiate_checkout: getActionCount('initiate_checkout') || getActionCount('offsite_conversion.fb_pixel_initiate_checkout'),
        landing_page_views: getActionCount('landing_page_view'),
        link_clicks: getActionCount('link_click'),

        purchase_value: purchaseValue,
        lead_value: getActionValue('lead'),

        cost_per_lead: costPerLead,
        cost_per_purchase: costPerPurchase,
        roas,

        video_views: getActionCount('video_view'),
        video_p25_watched: insight.video_p25_watched_actions?.[0]?.value || 0,
        video_p50_watched: insight.video_p50_watched_actions?.[0]?.value || 0,
        video_p75_watched: insight.video_p75_watched_actions?.[0]?.value || 0,
        video_p100_watched: insight.video_p100_watched_actions?.[0]?.value || 0,

        updated_at: new Date().toISOString()
    }
}

function getDefaultStartDate(): string {
    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    return firstOfMonth.toISOString().split('T')[0]
}

function getDefaultEndDate(): string {
    return new Date().toISOString().split('T')[0]
}
