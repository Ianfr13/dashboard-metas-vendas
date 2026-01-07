import { corsHeaders } from '../_shared/cors.ts'

const VTURB_API_BASE = 'https://analytics.vturb.net'

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
        const timezone = url.searchParams.get('timezone') || 'America/Sao_Paulo'

        // Get Vturb API token from environment
        const vturbToken = Deno.env.get('VTURB_API_TOKEN')
        if (!vturbToken) {
            return new Response(
                JSON.stringify({ error: 'VTURB_API_TOKEN not configured' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const headers = {
            'X-Api-Token': vturbToken,
            'X-Api-Version': 'v1',
            'Content-Type': 'application/json'
        }

        let result: unknown = null

        switch (action) {
            case 'list-players': {
                // GET /players/list
                const params = new URLSearchParams()
                if (startDate) params.append('start_date', startDate)
                if (endDate) params.append('end_date', endDate)
                params.append('timezone', timezone)

                const response = await fetch(`${VTURB_API_BASE}/players/list?${params}`, {
                    method: 'GET',
                    headers
                })

                if (!response.ok) {
                    const errorText = await response.text()
                    throw new Error(`Vturb API error: ${response.status} - ${errorText}`)
                }

                result = await response.json()
                break
            }

            case 'player-stats': {
                // POST /events/total_by_company_players
                const body = {
                    events: ['started', 'finished', 'viewed'],
                    start_date: startDate,
                    end_date: endDate
                }

                const response = await fetch(`${VTURB_API_BASE}/events/total_by_company_players`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body)
                })

                if (!response.ok) {
                    const errorText = await response.text()
                    throw new Error(`Vturb API error: ${response.status} - ${errorText}`)
                }

                result = await response.json()
                break
            }

            case 'session-stats': {
                // POST /sessions/stats - requires player_id
                const playerId = url.searchParams.get('player_id')
                if (!playerId) {
                    return new Response(
                        JSON.stringify({ error: 'player_id is required for session-stats' }),
                        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                    )
                }

                const body = {
                    player_id: playerId,
                    start_date: startDate,
                    end_date: endDate,
                    timezone
                }

                const response = await fetch(`${VTURB_API_BASE}/sessions/stats`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body)
                })

                if (!response.ok) {
                    const errorText = await response.text()
                    throw new Error(`Vturb API error: ${response.status} - ${errorText}`)
                }

                result = await response.json()
                break
            }

            case 'full-stats': {
                // Get both players list and their stats combined
                const playersParams = new URLSearchParams()
                if (startDate) playersParams.append('start_date', startDate)
                if (endDate) playersParams.append('end_date', endDate)
                playersParams.append('timezone', timezone)

                // 1. Get players list
                const playersRes = await fetch(`${VTURB_API_BASE}/players/list?${playersParams}`, {
                    method: 'GET',
                    headers
                })

                if (!playersRes.ok) {
                    const errorText = await playersRes.text()
                    throw new Error(`Vturb players error: ${playersRes.status} - ${errorText}`)
                }

                const players = await playersRes.json()

                // 2. Get events stats
                const statsBody = {
                    events: ['started', 'finished', 'viewed'],
                    start_date: startDate,
                    end_date: endDate
                }

                const statsRes = await fetch(`${VTURB_API_BASE}/events/total_by_company_players`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(statsBody)
                })

                if (!statsRes.ok) {
                    const errorText = await statsRes.text()
                    throw new Error(`Vturb stats error: ${statsRes.status} - ${errorText}`)
                }

                const stats = await statsRes.json()

                // 3. Try to get session stats for each player (with rate limiting consideration)
                const playerSessions: Record<string, unknown> = {}

                // Limit to first 5 players to avoid rate limiting
                const topPlayers = Array.isArray(players) ? players.slice(0, 5) : []

                for (const player of topPlayers) {
                    try {
                        const sessionBody = {
                            player_id: player.id,
                            start_date: startDate,
                            end_date: endDate,
                            timezone
                        }

                        const sessionRes = await fetch(`${VTURB_API_BASE}/sessions/stats`, {
                            method: 'POST',
                            headers,
                            body: JSON.stringify(sessionBody)
                        })

                        if (sessionRes.ok) {
                            playerSessions[player.id] = await sessionRes.json()
                        }
                    } catch (e) {
                        console.error(`Error fetching session for player ${player.id}:`, e)
                    }
                }

                // Combine all data
                result = {
                    players: players,
                    eventStats: stats,
                    sessionStats: playerSessions
                }
                break
            }

            case 'conversions': {
                // POST /conversions/stats_by_day
                const playerId = url.searchParams.get('player_id')

                const body: Record<string, unknown> = {
                    start_date: startDate,
                    end_date: endDate,
                    timezone
                }

                if (playerId) {
                    body.player_id = playerId
                }

                const response = await fetch(`${VTURB_API_BASE}/conversions/stats_by_day`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body)
                })

                if (!response.ok) {
                    const errorText = await response.text()
                    throw new Error(`Vturb API error: ${response.status} - ${errorText}`)
                }

                result = await response.json()
                break
            }

            case 'engagement': {
                // POST /times/user_engagement
                const playerId = url.searchParams.get('player_id')
                const duration = url.searchParams.get('duration') || '600' // Default 10 min

                if (!playerId) {
                    return new Response(
                        JSON.stringify({ error: 'player_id is required for engagement' }),
                        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                    )
                }

                const body = {
                    player_id: playerId,
                    duration: parseInt(duration),
                    start_date: startDate,
                    end_date: endDate,
                    timezone
                }

                const response = await fetch(`${VTURB_API_BASE}/times/user_engagement`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body)
                })

                if (!response.ok) {
                    const errorText = await response.text()
                    throw new Error(`Vturb API error: ${response.status} - ${errorText}`)
                }

                result = await response.json()
                break
            }

            default:
                return new Response(
                    JSON.stringify({ error: 'Invalid action. Use: list-players, player-stats, session-stats, full-stats, conversions, engagement' }),
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
