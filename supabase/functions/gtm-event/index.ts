import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Edge Function: gtm-event
 * 
 * Propósito: APENAS receber eventos do GTM e salvar na tabela gtm_events
 * 
 * Segurança: Valida um secret token no header X-GTM-Secret
 * - Impede que pessoas enviem dados falsos
 * - Mantém a função "pública" (sem JWT de usuário)
 * - Apenas quem tem o token pode enviar eventos
 * 
 * Filosofia: Keep it simple!
 * - Não faz processamento complexo
 * - Não atualiza outras tabelas
 * - Apenas salva o evento bruto
 * - Frontend faz todo o resto
 */

// Secret token para validação (configurado via variável de ambiente)
const GTM_SECRET = Deno.env.get('GTM_SECRET') || 'b646bc7e395f08aa2ee33001fbd6056874c3e0b732e6ed1b62dd251825d4f276';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validar secret token
    const providedSecret = req.headers.get('X-GTM-Secret');
    
    if (!providedSecret || providedSecret !== GTM_SECRET) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid or missing secret token' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    // GTM events são públicos (com token) - usamos service role key no servidor
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
    } = body;

    if (!event_name) {
      throw new Error('event_name is required');
    }

    // Get client IP and user agent
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || null;

    // Simplesmente salva o evento na tabela gtm_events
    const { error: insertError } = await supabaseClient
      .from('gtm_events')
      .insert({
        event_name,
        event_data: event_data ? JSON.stringify(event_data) : null,
        user_id: user_id || null,
        session_id: session_id || null,
        ip_address: clientIP,
        user_agent: userAgent,
        page_url: page_url || null,
        referrer: referrer || null,
      });

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Event recorded successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error processing GTM event:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
