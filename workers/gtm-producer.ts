import webpush from 'web-push';

/**
 * GTM Producer Worker
 * 
 * Recebe eventos do GTM e coloca na Cloudflare Queue para processamento em batch.
 * Isso elimina o custo de Edge Function por evento individual.
 */

export interface Env {
    GTM_QUEUE: Queue<GTMEvent>;
    GTM_SECRET: string;
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    VAPID_PUBLIC_KEY: string;
    VAPID_PRIVATE_KEY: string;
    VAPID_SUBJECT: string;
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

interface PushSubscriptionRow {
    subscription: webpush.PushSubscription;
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60; // 1 minuto em segundos
const RATE_LIMIT_MAX = 100; // 100 eventos por minuto por IP

// Map para tracking de rate limit (em memória, reset a cada deploy)
const rateLimitMap = new Map<string, { count: number, resetAt: number }>();

/**
 * Verifica se o IP está dentro do rate limit
 */
function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record || now > record.resetAt) {
        // Criar novo registro ou resetar
        rateLimitMap.set(ip, {
            count: 1,
            resetAt: now + (RATE_LIMIT_WINDOW * 1000)
        });
        return true;
    }

    if (record.count >= RATE_LIMIT_MAX) {
        // Limite excedido
        return false;
    }

    // Incrementar contador
    record.count++;
    return true;
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

// Extrai funnel_id do parâmetro 'fid=' no path da URL
function extractFunnelId(urlStr: string): string | null {
    try {
        const url = new URL(urlStr);
        // Buscar padrão fid=valor no pathname
        const fidMatch = url.pathname.match(/fid=([^/&?]+)/);
        return fidMatch ? fidMatch[1] : null;
    } catch {
        return null;
    }
}


export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
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

            // Verificar rate limit
            if (!checkRateLimit(clientIP)) {
                return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
                    status: 429,
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json',
                        'Retry-After': '60'
                    }
                });
            }

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

            // LOG: Payload recebido do GTM (antes de qualquer processamento)
            if (body.event_name === 'purchase') {
                console.log('[gtm-producer] 🛒 PURCHASE EVENT RECEIVED:');
                console.log('[gtm-producer] Event Name:', body.event_name);
                console.log('[gtm-producer] Event Data (raw):', JSON.stringify(body.event_data, null, 2));
                console.log('[gtm-producer] Page URL:', body.page_url);
                console.log('[gtm-producer] Session ID:', body.session_id);
            }

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

            // LOG: Evento enriquecido (após processamento)
            if (enrichedEvent.event_name === 'purchase') {
                console.log('[gtm-producer] 📦 ENRICHED EVENT:');
                console.log('[gtm-producer] Funnel ID extracted:', enrichedEvent.funnel_id);
                console.log('[gtm-producer] Event Data (enriched):', JSON.stringify(enrichedEvent.event_data, null, 2));
                console.log('[gtm-producer] UTM Source:', enrichedEvent.utm_source);
                console.log('[gtm-producer] UTM Medium:', enrichedEvent.utm_medium);
                console.log('[gtm-producer] IP Address:', enrichedEvent.ip_address);
            }

            // Enviar para a Queue (batch processing)
            await env.GTM_QUEUE.send(enrichedEvent);

            // Handle Push Notification for purchase events (Immediate)
            if (enrichedEvent.event_name === 'purchase' && env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
                ctx.waitUntil((async () => {
                    try {
                        webpush.setVapidDetails(
                            env.VAPID_SUBJECT || 'mailto:admin@example.com',
                            env.VAPID_PUBLIC_KEY,
                            env.VAPID_PRIVATE_KEY
                        );

                        // Fetch subscriptions from Supabase
                        const subResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/push_subscriptions?select=subscription`, {
                            headers: {
                                'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
                                'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
                            }
                        });

                        if (!subResponse.ok) {
                            console.error('[gtm-producer] Failed to fetch subscriptions:', await subResponse.text());
                            return;
                        }

                        const subscriptions: PushSubscriptionRow[] = await subResponse.json();
                        const eventData = enrichedEvent.event_data ? (typeof enrichedEvent.event_data === 'string' ? JSON.parse(enrichedEvent.event_data) : enrichedEvent.event_data) : {};
                        const amount = eventData.value || eventData.transaction_value || 0;
                        const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);

                        let productName = "Produto";
                        if (eventData.items && Array.isArray(eventData.items) && eventData.items.length > 0) {
                            productName = eventData.items[0].item_name || eventData.items[0].product_name || "Produto";
                        } else if (eventData.item_name) {
                            productName = eventData.item_name;
                        } else if (eventData.product_name) {
                            productName = eventData.product_name;
                        }

                        const payload = {
                            title: "Nova Venda!",
                            body: `Venda de ${productName} por ${formattedAmount}`,
                            url: "/dashboard"
                        };

                        await Promise.allSettled(subscriptions.map(async (sub) => {
                            try {
                                await webpush.sendNotification(sub.subscription, JSON.stringify(payload));
                            } catch (error: any) {
                                if (error.statusCode === 410) {
                                    console.log('Subscription expired');
                                } else {
                                    console.error('Error sending push:', error);
                                }
                            }
                        }));
                        console.log('[gtm-producer] Immediate push notification sent');

                    } catch (err) {
                        console.error('[gtm-producer] Error sending immediate push:', err);
                    }
                })());
            }

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
