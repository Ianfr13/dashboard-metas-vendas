/**
 * GTM Producer Worker
 * 
 * Recebe eventos do GTM e coloca na Cloudflare Queue para processamento em batch.
 * Isso elimina o custo de Edge Function por evento individual.
 */

export interface Env {
    GTM_QUEUE: Queue<GTMEvent>;
    GTM_SECRET: string;
}

interface GTMEvent {
    event_name: string;
    event_data?: any;
    user_id?: string;
    session_id?: string;
    page_url?: string;
    referrer?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
    page_title?: string;
    device_type?: string;
    browser?: string;
    os?: string;
    screen_resolution?: string;
    funnel_id?: string;
    // Metadados adicionados pelo worker
    ip_address?: string;
    user_agent?: string;
    timestamp?: string;
}

// Domínios permitidos
const ALLOWED_ORIGINS = [
    'douravita.com.br',
    'lp.douravita.com.br',
    'pay.douravita.com.br',
    'localhost',
    '127.0.0.1'
];

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-GTM-Secret',
};

function isOriginAllowed(origin: string | null, referer: string | null): boolean {
    const urlToCheck = origin || referer;
    if (!urlToCheck) return false;

    try {
        const url = new URL(urlToCheck);
        return ALLOWED_ORIGINS.some(domain =>
            url.hostname === domain || url.hostname.endsWith('.' + domain)
        );
    } catch {
        return false;
    }
}

// Extrai UTMs de uma URL
function extractUtms(urlStr: string) {
    try {
        const url = new URL(urlStr);
        const params = url.searchParams;
        return {
            utm_source: params.get('utm_source'),
            utm_medium: params.get('utm_medium'),
            utm_campaign: params.get('utm_campaign'),
            utm_content: params.get('utm_content'),
            utm_term: params.get('utm_term'),
        };
    } catch {
        return {};
    }
}

// Extrai funnel_id do path da URL
function extractFunnelId(urlStr: string): string | null {
    try {
        const url = new URL(urlStr);
        const pathParts = url.pathname.split('/').filter(Boolean);
        return pathParts.length > 0 ? pathParts[pathParts.length - 1] : url.hostname;
    } catch {
        return null;
    }
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response('ok', { headers: corsHeaders });
        }

        // Only accept POST
        if (request.method !== 'POST') {
            return new Response(JSON.stringify({ error: 'Method not allowed' }), {
                status: 405,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        try {
            const clientIP = request.headers.get('cf-connecting-ip') ||
                request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                'unknown';

            const origin = request.headers.get('origin');
            const referer = request.headers.get('referer');

            // Validar origem
            if (!isOriginAllowed(origin, referer)) {
                return new Response(JSON.stringify({ error: 'Forbidden' }), {
                    status: 403,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // Validar X-GTM-Secret
            const providedSecret = request.headers.get('X-GTM-Secret');
            if (!providedSecret || providedSecret !== env.GTM_SECRET) {
                return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            const body = await request.json() as GTMEvent;

            if (!body.event_name) {
                return new Response(JSON.stringify({ error: 'event_name is required' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // Extração automática de UTMs se page_url estiver presente
            const extracted = body.page_url ? extractUtms(body.page_url) : {};

            // Enriquecer evento com metadados
            const enrichedEvent: GTMEvent = {
                ...body,
                utm_source: body.utm_source || extracted.utm_source || undefined,
                utm_medium: body.utm_medium || extracted.utm_medium || undefined,
                utm_campaign: body.utm_campaign || extracted.utm_campaign || undefined,
                utm_content: body.utm_content || extracted.utm_content || undefined,
                utm_term: body.utm_term || extracted.utm_term || undefined,
                funnel_id: body.funnel_id || (body.page_url ? extractFunnelId(body.page_url) : undefined) || undefined,
                ip_address: clientIP,
                user_agent: request.headers.get('user-agent') || undefined,
                timestamp: new Date().toISOString(),
            };

            // Enviar para a Queue (batch processing)
            await env.GTM_QUEUE.send(enrichedEvent);

            return new Response(JSON.stringify({ success: true, queued: true }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } catch (error: any) {
            console.error('Error in gtm-producer:', error);
            return new Response(JSON.stringify({ error: error.message }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    }
};
