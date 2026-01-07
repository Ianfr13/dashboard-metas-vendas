import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Edge Function: gtm-event
 * 
 * Propósito: Receber eventos do GTM e salvar na tabela gtm_events com metadados (UTMs, dispositivo, etc)
 * 
 * Segurança: Valida um secret token no header X-GTM-Secret
 */

const GTM_SECRET = Deno.env.get('GTM_SECRET') || 'b646bc7e395f08aa2ee33001fbd6056874c3e0b732e6ed1b62dd251825d4f276';

// Domínios permitidos (adicione seus domínios aqui)
const ALLOWED_ORIGINS = [
  'douravita.com.br',
  'lp.douravita.com.br',
  'pay.douravita.com.br',
  'localhost',
  '127.0.0.1'
];

// Rate Limiter simples em memória (100 requests por minuto por IP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100;
const RATE_WINDOW_MS = 60000; // 1 minuto

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false; // Bloqueado
  }

  record.count++;
  return true;
}

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

// Helper para extrair UTMs de uma URL caso não venham explícitas
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
  } catch (e) {
    return {};
  }
}

// Helper para extrair funnel_id do path da URL
function extractFunnelId(urlStr: string): string | null {
  try {
    const url = new URL(urlStr);
    const pathParts = url.pathname.split('/').filter(Boolean);
    // Retorna o último segmento do path (ex: /lpvsl-jan26 -> "lpvsl-jan26")
    return pathParts.length > 0 ? pathParts[pathParts.length - 1] : url.hostname;
  } catch (e) {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');

    console.log(`[GTM-EVENT] Request from IP: ${clientIP}, Origin: ${origin}, Referer: ${referer}`);

    // 1. Rate Limiting
    if (!checkRateLimit(clientIP)) {
      console.warn(`[GTM-EVENT] RATE LIMITED: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Too Many Requests' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
      );
    }

    // 2. Validar origem (CORS adicional)
    if (!isOriginAllowed(origin, referer)) {
      console.warn(`[GTM-EVENT] BLOCKED ORIGIN: ${origin || referer}`);
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    } else {
      console.log(`[GTM-EVENT] ORIGIN ALLOWED: ${origin || referer}`);
    }

    // 3. Validar X-GTM-Secret
    const providedSecret = req.headers.get('X-GTM-Secret');

    if (!providedSecret || providedSecret !== GTM_SECRET) {
      console.warn(`[GTM-EVENT] UNAUTHORIZED: Invalid or missing secret`);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const body = await req.json();
    const {
      event_name,
      event_data,
      user_id,
      session_id,
      page_url,
      referrer,
      // Novos campos explícitos
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      page_title,
      device_type,
      browser,
      os,
      screen_resolution,
      funnel_id
    } = body;

    if (!event_name) {
      throw new Error('event_name is required');
    }

    // Extração automática de UTMs se page_url estiver presente e UTMs explícitas estiverem vazias
    const extracted = page_url ? extractUtms(page_url) : {};

    const finalUtms = {
      utm_source: utm_source || extracted.utm_source || null,
      utm_medium: utm_medium || extracted.utm_medium || null,
      utm_campaign: utm_campaign || extracted.utm_campaign || null,
      utm_content: utm_content || extracted.utm_content || null,
      utm_term: utm_term || extracted.utm_term || null,
    };


    const userAgent = req.headers.get('user-agent') || null;

    const { error: insertError } = await supabaseClient
      .from('gtm_events')
      .insert({
        event_name,
        event_data: event_data ? (typeof event_data === 'string' ? event_data : JSON.stringify(event_data)) : null,
        user_id: user_id || null,
        session_id: session_id || null,
        ip_address: clientIP,
        user_agent: userAgent,
        page_url: page_url || null,
        referrer: referrer || null,
        // Novos metadados
        ...finalUtms,
        page_title: page_title || null,
        device_type: device_type || null,
        browser: browser || null,
        os: os || null,
        screen_resolution: screen_resolution || null,
        funnel_id: funnel_id || (page_url ? extractFunnelId(page_url) : null)
      });

    if (insertError) throw insertError;

    console.log(`[GTM-EVENT] SUCCESS: ${event_name} from ${page_url}, funnel_id: ${funnel_id || extractFunnelId(page_url || '')}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error processing GTM event:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
