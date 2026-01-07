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
                    .select('id, name, duration')

                if (playersError) {
                    throw new Error(`Players error: ${playersError.message}`)
                }

                // Create player name lookup map
                const playerNames: Record<string, { name: string; duration: number }> = {}
                playersData?.forEach((p: any) => {
                    playerNames[p.id] = { name: p.name, duration: p.duration || 0 }
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

            default:
                return new Response(
                    JSON.stringify({ error: 'Invalid action. Use: player-stats, list-players, daily-metrics' }),
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
