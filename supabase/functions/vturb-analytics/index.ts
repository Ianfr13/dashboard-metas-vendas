import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const url = new URL(req.url)
        const action = url.searchParams.get('action')
        const startDate = url.searchParams.get('start_date')
        const endDate = url.searchParams.get('end_date')

        // Create Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        let result: unknown = null

        switch (action) {
            case 'player-stats': {
                // Fetch metrics
                const { data: metricsData, error: metricsError } = await supabase
                    .from('vturb_metrics')
                    .select('player_id, date, views, plays, finishes, unique_views, unique_plays')
                    .gte('date', startDate)
                    .lte('date', endDate)

                if (metricsError) {
                    throw new Error(`Metrics error: ${metricsError.message}`)
                }

                // Fetch players for name lookup
                const { data: playersData, error: playersError } = await supabase
                    .from('vturb_players')
                    .select('id, name, duration, pitch_time, lead_time')

                if (playersError) {
                    throw new Error(`Players error: ${playersError.message}`)
                }

                // Create player name lookup map
                const playerNames: Record<string, { name: string; duration: number; pitch_time: number; lead_time: number }> = {}
                playersData?.forEach((p: any) => {
                    playerNames[p.id] = {
                        name: p.name,
                        duration: p.duration || 0,
                        pitch_time: p.pitch_time || 0,
                        lead_time: p.lead_time || 0
                    }
                })

                // Aggregate metrics by player
                const playerMap: Record<string, any> = {}

                metricsData?.forEach((row: any) => {
                    const playerId = row.player_id
                    const playerInfo = playerNames[playerId]

                    if (!playerMap[playerId]) {
                        playerMap[playerId] = {
                            id: playerId,
                            name: playerInfo?.name || `VSL ${playerId.slice(-6)}`,
                            duration: playerInfo?.duration || 0,
                            pitch_time: playerInfo?.pitch_time || 0,
                            lead_time: playerInfo?.lead_time || 0,
                            views: 0,
                            plays: 0,
                            finishes: 0,
                            unique_views: 0,
                            unique_plays: 0
                        }
                    }

                    playerMap[playerId].views += row.views || 0
                    playerMap[playerId].plays += row.plays || 0
                    playerMap[playerId].finishes += row.finishes || 0
                    playerMap[playerId].unique_views += row.unique_views || 0
                    playerMap[playerId].unique_plays += row.unique_plays || 0
                })

                result = Object.values(playerMap).sort((a: any, b: any) => b.views - a.views)
                break
            }

            case 'list-players': {
                const { data, error } = await supabase
                    .from('vturb_players')
                    .select('*')
                    .order('name')

                if (error) {
                    throw new Error(`Database error: ${error.message}`)
                }

                result = data
                break
            }

            case 'update-settings': {
                if (req.method !== 'POST') {
                    throw new Error('Method not allowed')
                }
                const body = await req.json()
                const { id, pitch_time, lead_time } = body

                const { error } = await supabase
                    .from('vturb_players')
                    .update({ pitch_time, lead_time })
                    .eq('id', id)

                if (error) throw new Error(`Update error: ${error.message}`)

                result = { success: true }
                break
            }

            case 'debug-vturb-api': {
                const VTURB_API_TOKEN = Deno.env.get('VTURB_API_TOKEN')!
                const response = await fetch('https://analytics.vturb.net/api/v1/players/list', {
                    headers: {
                        'x-access-token': VTURB_API_TOKEN,
                        'Content-Type': 'application/json'
                    }
                })

                if (!response.ok) {
                    const text = await response.text()
                    throw new Error(`Vturb API error: ${response.status} ${text}`)
                }

                result = await response.json()
                break
            }

            case 'debug-list': {
                const VTURB_API_TOKEN = Deno.env.get('VTURB_API_TOKEN')!
                // Try fetching without date params to see if it returns full library
                const response = await fetch('https://analytics.vturb.net/api/v1/players/list', {
                    headers: {
                        'x-access-token': VTURB_API_TOKEN,
                        'Content-Type': 'application/json'
                    }
                })

                if (!response.ok) {
                    const text = await response.text()
                    throw new Error(`Vturb API error: ${response.status} ${text}`)
                }

                result = await response.json()
                break
            }

            case 'daily-metrics': {
                const playerId = url.searchParams.get('player_id')

                let query = supabase
                    .from('vturb_metrics')
                    .select('*')
                    .gte('date', startDate)
                    .lte('date', endDate)
                    .order('date', { ascending: true })

                if (playerId) {
                    query = query.eq('player_id', playerId)
                }

                const { data, error } = await query

                if (error) {
                    throw new Error(`Database error: ${error.message}`)
                }

                result = data
                break
            }

            case 'engagement': {
                // Fetch engagement/retention data directly from Vturb API
                const playerId = url.searchParams.get('player_id')
                let duration = url.searchParams.get('duration')

                if (!playerId) {
                    return new Response(
                        JSON.stringify({ error: 'player_id is required for engagement' }),
                        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                    )
                }

                // If duration not provided, get it from database
                if (!duration) {
                    const { data: playerData, error: dbError } = await supabase
                        .from('vturb_players')
                        .select('duration')
                        .eq('id', playerId)
                        .single()

                    console.log('Player duration lookup:', { playerId, playerData, dbError })
                    duration = String(playerData?.duration || 1800)
                }

                // Ensure duration is a positive integer (min 60 seconds)
                const durationInt = Math.max(60, parseInt(duration) || 1800)

                const vturbToken = Deno.env.get('VTURB_API_TOKEN')
                if (!vturbToken) {
                    throw new Error('VTURB_API_TOKEN not configured')
                }

                const startDateFull = `${startDate} 00:00:00`
                const endDateFull = `${endDate} 23:59:59`

                const response = await fetch('https://analytics.vturb.net/times/user_engagement', {
                    method: 'POST',
                    headers: {
                        'X-Api-Token': vturbToken,
                        'X-Api-Version': 'v1',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        player_id: playerId,
                        video_duration: durationInt,
                        start_date: startDateFull,
                        end_date: endDateFull,
                        timezone: 'America/Sao_Paulo'
                    })
                })

                if (!response.ok) {
                    const errorText = await response.text()
                    throw new Error(`Vturb API error: ${response.status} - ${errorText}`)
                }

                const engagementData = await response.json()

                // Transform to minute-by-minute retention
                // API returns { grouped_timed: [{total_users, timed}], average_watched_time, engagement_rate }
                const retentionByMinute: { minute: number; retention: number; viewers: number }[] = []

                if (engagementData?.grouped_timed && Array.isArray(engagementData.grouped_timed)) {
                    const groupedTimed = engagementData.grouped_timed.sort((a: any, b: any) => a.timed - b.timed)

                    // Total viewers = sum of all users (those who watched at all)
                    const totalViewers = groupedTimed.reduce((sum: number, d: any) => sum + (d.total_users || 0), 0)

                    // Group by minute - count viewers who watched UP TO that minute
                    for (let min = 0; min <= Math.ceil(durationInt / 60); min++) {
                        const sec = min * 60
                        // Count viewers who reached at least this second
                        const viewersStillWatching = groupedTimed
                            .filter((d: any) => d.timed >= sec)
                            .reduce((sum: number, d: any) => sum + (d.total_users || 0), 0)

                        retentionByMinute.push({
                            minute: min,
                            viewers: viewersStillWatching,
                            retention: totalViewers > 0 ? (viewersStillWatching / totalViewers) * 100 : 0
                        })
                    }
                }

                result = retentionByMinute
                break
            }

            default:
                return new Response(
                    JSON.stringify({ error: 'Invalid action. Use: player-stats, list-players, daily-metrics, engagement' }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
        }

        return new Response(
            JSON.stringify(result),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Vturb Analytics Error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return new Response(
            JSON.stringify({ error: errorMessage }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
