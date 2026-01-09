import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface PushPayload {
    title: string;
    body: string;
    url?: string;
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "" // Must utilize service role for broadcasting
        );

        // Get VAPID keys from env
        const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
        const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
        const vapidSubject = "mailto:admin@douravita.com"; // Customize this

        if (!vapidPublicKey || !vapidPrivateKey) {
            throw new Error("VAPID keys not configured");
        }

        webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

        const { record } = await req.json(); // Payload from Database Webhook

        if (!record || record.event_name !== 'purchase') {
            // Return success to avoid webhook retry logic if it's just not the right event type
            return new Response(JSON.stringify({ message: "Not a purchase event" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Parse event_data if it's a string, or use directly if jsonb
        const eventData = typeof record.event_data === "string"
            ? JSON.parse(record.event_data)
            : record.event_data;

        // Adjust fields based on GTM purchase event structure
        // Common GTM/GA4 structure: { value: 100, currency: "BRL", items: [...], transaction_id: "..." }
        const amount = eventData.value || eventData.transaction_value || 0;

        // Try to get first product name
        let productName = "Produto";
        if (eventData.items && Array.isArray(eventData.items) && eventData.items.length > 0) {
            productName = eventData.items[0].item_name || eventData.items[0].product_name || "Produto";
        } else if (eventData.item_name) {
            productName = eventData.item_name;
        } else if (eventData.product_name) {
            productName = eventData.product_name;
        }

        // Format currency
        const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);

        const payload: PushPayload = {
            title: "Nova Venda",
            body: `Venda de ${productName} por ${formattedAmount}`,
            url: "/dashboard", // Deep link
        };

        // Fetch all subscriptions
        // Optimization: In a real app, you might want to filter by user or batch this
        const { data: subscriptions, error: subError } = await supabase
            .from("push_subscriptions")
            .select("subscription");

        if (subError) throw subError;

        const results = await Promise.allSettled(
            subscriptions.map(async (sub) => {
                try {
                    await webpush.sendNotification(
                        sub.subscription,
                        JSON.stringify(payload)
                    );
                    return { status: "fulfilled" };
                } catch (error) {
                    if (error.statusCode === 410) {
                        // Subscription expired, remove it
                        // We can't easily delete here without the ID, so we might skip or improving the query to include ID
                        console.log("Subscription expired");
                    }
                    throw error;
                }
            })
        );

        const successCount = results.filter(r => r.status === 'fulfilled').length;

        return new Response(JSON.stringify({ success: true, sent: successCount }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
