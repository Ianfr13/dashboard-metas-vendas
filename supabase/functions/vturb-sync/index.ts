import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const VTURB_API_BASE = 'https://analytics.vturb.net'

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const url = new URL(req.url)
        const startDate = url.searchParams.get('start_date') || new Date().toISOString().split('T')[0]
        const endDate = url.searchParams.get('end_date') || new Date().toISOString().split('T')[0]
        const timezone = 'America/Sao_Paulo'

        // Get Vturb API token
        const vturbToken = Deno.env.get('VTURB_API_TOKEN')
        if (!vturbToken) {
            return new Response(
                JSON.stringify({ error: 'VTURB_API_TOKEN not configured' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Create Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        const vturbHeaders = {
            'X-Api-Token': vturbToken,
            'X-Api-Version': 'v1',
            'Content-Type': 'application/json'
        }

        // 1. Fetch players list from Vturb
        // NOTE: Do NOT pass start_date/end_date to players/list - those params filter by player CREATION date,
        // not by activity. We want ALL players, then fetch metrics for the specified date range.
        console.log('Fetching Vturb players...')

        // Dates for metrics queries (not for player listing)
        const startDateFull = `${startDate} 00:00:00`
        const endDateFull = `${endDate} 23:59:59`

        // Fetch ALL players (no date filter)
        const playersRes = await fetch(`${VTURB_API_BASE}/players/list`, {
            method: 'GET',
            headers: vturbHeaders
        })

        if (!playersRes.ok) {
            const errorText = await playersRes.text()
            throw new Error(`Failed to fetch players: ${playersRes.status} - ${errorText}`)
        }

        const players = await playersRes.json()
        console.log(`Found ${players.length} players`)


        // 3. Fetch custom metrics for each player to get Lead Time
        // This must be done per player, which might be slow if many players.
        // We can optimize by doing it in parallel or only for active players?
        // For now, let's map over players.
        console.log('Fetching custom metrics...')
        const playersWithMetrics = await Promise.all(players.map(async (p: any) => {
            try {
                // VTurb API requires POST with player_id, start_date, end_date in body
                const metricsRes = await fetch(`${VTURB_API_BASE}/custom_metrics/list`, {
                    method: 'POST',
                    headers: vturbHeaders,
                    body: JSON.stringify({
                        player_id: p.id,
                        start_date: startDateFull,
                        end_date: endDateFull,
                        timezone
                    })
                })

                let leadTime = undefined

                if (metricsRes.ok) {
                    const metrics = await metricsRes.json()
                    console.log(`Player ${p.id} (${p.name || 'unnamed'}) custom metrics:`, JSON.stringify(metrics))
                    if (Array.isArray(metrics) && metrics.length > 0) {
                        // Look for a metric named "Lead", "Retenção Lead", etc
                        const leadMetric = metrics.find((m: any) =>
                            m.name && (
                                m.name.toLowerCase().includes('lead') ||
                                m.name.toLowerCase().includes('retencao') ||
                                m.name.toLowerCase().includes('retenção')
                            )
                        )

                        if (leadMetric) {
                            console.log(`Found lead metric for ${p.id}:`, JSON.stringify(leadMetric))
                            if (leadMetric.time !== undefined) {
                                leadTime = leadMetric.time
                            }
                        }
                    } else {
                        console.log(`Player ${p.id} has no custom metrics or empty array`)
                    }
                } else {
                    const errorText = await metricsRes.text()
                    console.log(`Player ${p.id} custom metrics fetch failed: ${metricsRes.status} - ${errorText}`)
                }

                return {
                    ...p,
                    lead_time_fetched: leadTime
                }
            } catch (err) {
                console.error(`Error fetching metrics for ${p.id}:`, err)
                return p
            }
        }))

        // 2 (Revised). Upsert players to database with fetched lead_time
        // Also handle "inactive" (deleted) players.
        // First, get ALL current players from DB to identify deletions.
        const { data: currentDbPlayers } = await supabase
            .from('vturb_players')
            .select('id')

        const currentDbIds = new Set(currentDbPlayers?.map((p: any) => p.id) || [])
        const fetchedIds = new Set(players.map((p: any) => p.id))

        // Any ID in DB but NOT in fetched list should be marked active=false
        const idsToDelete = [...currentDbIds].filter(id => !fetchedIds.has(id))

        const playerRecords = playersWithMetrics.map((p: any) => ({
            id: p.id,
            name: p.name || p.title || `VSL ${p.id.slice(-6)}`,
            duration: p.duration || undefined,
            pitch_time: p.pitch_time || undefined,
            lead_time: p.lead_time_fetched !== undefined ? p.lead_time_fetched : (p.lead_time || undefined),
            active: true, // Marked as active since they came from API
            updated_at: new Date().toISOString()
        }))

        // Add records for "deleted" players to mark them inactive
        idsToDelete.forEach(id => {
            playerRecords.push({
                id: id,
                active: false,
                updated_at: new Date().toISOString()
            })
        })

        if (playerRecords.length > 0) {
            const { error: playersError } = await supabase
                .from('vturb_players')
                .upsert(playerRecords, { onConflict: 'id' })

            if (playersError) {
                console.error('Error upserting players:', playersError)
            } else {
                console.log(`Upserted ${playerRecords.length} players (incl. ${idsToDelete.length} inactive)`)
            }
        }

        // 3. Fetch event stats from Vturb
        console.log('Fetching Vturb event stats...')
        const statsRes = await fetch(`${VTURB_API_BASE}/events/total_by_company_players`, {
            method: 'POST',
            headers: vturbHeaders,
            body: JSON.stringify({
                events: ['started', 'finished', 'viewed'],
                start_date: startDateFull,
                end_date: endDateFull
            })
        })

        if (!statsRes.ok) {
            const errorText = await statsRes.text()
            throw new Error(`Failed to fetch stats: ${statsRes.status} - ${errorText}`)
        }

        const stats = await statsRes.json()
        console.log(`Found ${stats.length} stat records`)

        // 4. Aggregate stats by player and save
        const playerStats: Record<string, { views: number; plays: number; finishes: number; unique_views: number; unique_plays: number }> = {}

        if (Array.isArray(stats)) {
            stats.forEach((item: any) => {
                const playerId = item.player_id
                if (!playerId) return

                // STRICT FILTER: Only process metrics for players we confirmed as active
                if (!fetchedIds.has(playerId)) return

                if (!playerStats[playerId]) {
                    playerStats[playerId] = { views: 0, plays: 0, finishes: 0, unique_views: 0, unique_plays: 0 }
                }

                const total = item.total || 0
                const uniqueSessions = item.total_uniq_sessions || 0

                if (item.event === 'viewed') {
                    playerStats[playerId].views = total
                    playerStats[playerId].unique_views = uniqueSessions
                }
                if (item.event === 'started') {
                    playerStats[playerId].plays = total
                    playerStats[playerId].unique_plays = uniqueSessions
                }
                if (item.event === 'finished') {
                    playerStats[playerId].finishes = total
                }
            })
        }

        // 5. Upsert metrics to database
        const today = new Date().toISOString().split('T')[0]
        const metricsRecords = Object.entries(playerStats).map(([playerId, data]) => ({
            player_id: playerId,
            date: today,
            views: data.views,
            plays: data.plays,
            finishes: data.finishes,
            unique_views: data.unique_views,
            unique_plays: data.unique_plays,
            updated_at: new Date().toISOString()
        }))

        if (metricsRecords.length > 0) {
            const { error: metricsError } = await supabase
                .from('vturb_metrics')
                .upsert(metricsRecords, { onConflict: 'player_id,date' })

            if (metricsError) {
                console.error('Error upserting metrics:', metricsError)
            } else {
                console.log(`Upserted ${metricsRecords.length} metric records`)
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                players_synced: players.length,
                metrics_synced: metricsRecords.length,
                sample_player: players.length > 0 ? players[0] : null
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Vturb Sync Error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return new Response(
            JSON.stringify({ error: errorMessage }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
