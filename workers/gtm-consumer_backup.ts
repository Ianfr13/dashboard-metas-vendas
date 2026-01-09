/**
 * GTM Consumer Worker
 * 
 * Processa batch de eventos da Queue e faz bulk INSERT no Supabase.
 * Executa automaticamente quando a Queue atinge 100 mensagens ou 60 segundos.
 */

export interface Env {
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
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
    ip_address?: string;
    user_agent?: string;
    timestamp?: string;
}

interface SupabaseRow {
    event_name: string;
    event_data: string | null;
    user_id: string | null;
    session_id: string | null;
    page_url: string | null;
    referrer: string | null;
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    utm_content: string | null;
    utm_term: string | null;
    page_title: string | null;
    device_type: string | null;
    browser: string | null;
    os: string | null;
    screen_resolution: string | null;
    funnel_id: string | null;
    ip_address: string | null;
    user_agent: string | null;
    canal: string;
    timestamp: string;
}

export default {
    async queue(batch: MessageBatch<GTMEvent>, env: Env): Promise<void> {
        console.log(`[gtm-consumer] Processing batch of ${batch.messages.length} events`);

        // Converter eventos para formato do Supabase
        const rows: SupabaseRow[] = batch.messages.map(msg => {
            const event = msg.body;

            // Determinar canal baseado em utm_term
            const canal = (event.utm_term?.toLowerCase() === 'comercial') ? 'comercial' : 'marketing';

            return {
                event_name: event.event_name,
                event_data: event.event_data ? (typeof event.event_data === 'string' ? event.event_data : JSON.stringify(event.event_data)) : null,
                user_id: event.user_id || null,
                session_id: event.session_id || null,
                page_url: event.page_url || null,
                referrer: event.referrer || null,
                utm_source: event.utm_source || null,
                utm_medium: event.utm_medium || null,
                utm_campaign: event.utm_campaign || null,
                utm_content: event.utm_content || null,
                utm_term: event.utm_term || null,
                page_title: event.page_title || null,
                device_type: event.device_type || null,
                browser: event.browser || null,
                os: event.os || null,
                screen_resolution: event.screen_resolution || null,
                funnel_id: event.funnel_id || null,
                ip_address: event.ip_address || null,
                user_agent: event.user_agent || null,
                canal: canal,
                timestamp: event.timestamp || new Date().toISOString(),
            };
        });

        // Bulk INSERT no Supabase via REST API
        const response = await fetch(`${env.SUPABASE_URL}/rest/v1/gtm_events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
                'Prefer': 'return=minimal', // Não retornar os dados inseridos (mais rápido)
            },
            body: JSON.stringify(rows),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[gtm-consumer] Supabase error: ${response.status} - ${errorText}`);

            // Se falhou, retry automático pela Queue
            throw new Error(`Supabase insert failed: ${response.status}`);
        }

        console.log(`[gtm-consumer] Successfully inserted ${rows.length} events`);

        // Acknowledge todas as mensagens
        for (const msg of batch.messages) {
            msg.ack();
        }
    }
};
