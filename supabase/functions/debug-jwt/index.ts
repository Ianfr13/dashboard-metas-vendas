
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization')

        // Check if token exists
        if (!authHeader) {
            return new Response(
                JSON.stringify({
                    error: 'No Authorization header found',
                    headers: Object.fromEntries(req.headers.entries())
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            )
        }

        // Decode JWT (without verification, just for inspection)
        const token = authHeader.replace('Bearer ', '')
        const parts = token.split('.')
        let decodedPayload = null
        let decodeError = null

        try {
            if (parts.length === 3) {
                decodedPayload = JSON.parse(atob(parts[1]))
            }
        } catch (e) {
            decodeError = e.message
        }

        // Initialize Supabase client to verify token properly
        const supabaseClient = createClient(
            // @ts-ignore
            Deno.env.get('SUPABASE_URL') ?? '',
            // @ts-ignore
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        // Get user from Supabase to verify validity
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

        return new Response(
            JSON.stringify({
                status: 'debug_info',
                token_received: true,
                token_preview: token.substring(0, 15) + '...',
                decode_attempt: {
                    success: !!decodedPayload,
                    payload: decodedPayload,
                    error: decodeError
                },
                supabase_validation: {
                    user_found: !!user,
                    user_id: user?.id,
                    user_email: user?.email,
                    error: userError
                },
                raw_header: authHeader
            }, null, 2),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
