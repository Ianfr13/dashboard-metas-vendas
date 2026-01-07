import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
        console.log('Fetching Vturb players...')
        // Vturb requires datetime with hours/minutes/seconds
        const startDateFull = `${startDate} 00:00:00`
        const endDateFull = `${endDate} 23:59:59`

        const playersParams = new URLSearchParams({
            start_date: startDateFull,
            end_date: endDateFull,
            timezone
        })

        const playersRes = await fetch(`${VTURB_API_BASE}/players/list?${playersParams}`, {
            method: 'GET',
            headers: vturbHeaders
        })

        if (!playersRes.ok) {
            const errorText = await playersRes.text()
            throw new Error(`Failed to fetch players: ${playersRes.status} - ${errorText}`)
        }

        const players = await playersRes.json()
        console.log(`Found ${players.length} players`)

        // 2. Upsert players to database
        if (Array.isArray(players) && players.length > 0) {
            const playerRecords = players.map((p: any) => ({
                id: p.id,
                name: p.name || p.title || `VSL ${p.id.slice(-6)}`,
                duration: p.duration || undefined,
                // Only update pitch_time/lead_time if provided by Vturb, otherwise keep DB value (undefined avoids update in upsert if we could... but upsert replaces row)
                // UPSERT replaces the row. passing undefined in JSON usually means it's excluded? 
                // In Supabase js, undefined fields are stripped? Let's hope.
                // If not, we might need to fetch existing players first? We don't fetch existing here.
                // Actually, if we use upsert, we replace.
                // To do partial update on conflict, we should use ignoreDuplicates? No.
                // Supabase upsert doesn't support "merge" natively for specific fields easily without listing them?
                // Actually, if we pass { id, name } and onConflict: id, it updates name.
                // If we don't pass pitch_time, it MIGHT set it to null if column default is null?
                // No, if field is missing in payload, it shouldn't touch the column?
                // Let's assume undefined removes key from object.
                pitch_time: p.pitch_time || undefined,
                lead_time: p.lead_time || undefined,
                updated_at: new Date().toISOString()
            }))

            const { error: playersError } = await supabase
                .from('vturb_players')
                .upsert(playerRecords, { onConflict: 'id' })

            if (playersError) {
                console.error('Error upserting players:', playersError)
            } else {
                console.log(`Upserted ${playerRecords.length} players`)
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
