import { Router } from "express";
import { getDb } from "../db";

const router = Router();

/**
 * Endpoint genérico para receber qualquer evento do GTM
 * POST /api/gtm/event
 */
router.post("/event", async (req, res) => {
  try {
    const {
      event_name,
      event_data,
      user_id,
      session_id,
      page_url,
      referrer,
    } = req.body;

    if (!event_name) {
      return res.status(400).json({ error: "event_name is required" });
    }

    const supabase = await getDb();
    if (!supabase) {
      return res.status(500).json({ error: "Database not available" });
    }

    const { error } = await supabase
      .from('gtm_events')
      .insert({
        event_name: event_name,
        event_data: event_data ? JSON.stringify(event_data) : null,
        user_id: user_id || null,
        session_id: session_id || null,
        ip_address: req.ip || req.headers["x-forwarded-for"] as string || null,
        user_agent: req.headers["user-agent"] || null,
        page_url: page_url || null,
        referrer: referrer || null,
      });

    if (error) throw error;

    res.json({ success: true, message: "Event recorded successfully" });
  } catch (error) {
    console.error("Error recording GTM event:", error);
    res.status(500).json({ error: "Failed to record event" });
  }
});

/**
 * Endpoint específico para page_view (Views VSL)
 * POST /api/gtm/page-view
 */
router.post("/page-view", async (req, res) => {
  try {
    const {
      user_id,
      session_id,
      page_url,
      page_title,
      referrer,
    } = req.body;

    const supabase = await getDb();
    if (!supabase) {
      return res.status(500).json({ error: "Database not available" });
    }

    const { error } = await supabase
      .from('gtm_events')
      .insert({
        event_name: "page_view",
        event_data: JSON.stringify({
          page_url,
          page_title,
          referrer,
        }),
        user_id: user_id || null,
        session_id: session_id || null,
        ip_address: req.ip || req.headers["x-forwarded-for"] as string || null,
        user_agent: req.headers["user-agent"] || null,
        page_url: page_url || null,
        referrer: referrer || null,
      });

    if (error) throw error;

    res.json({ success: true, message: "Page view recorded" });
  } catch (error) {
    console.error("Error recording page view:", error);
    res.status(500).json({ error: "Failed to record page view" });
  }
});

/**
 * Endpoint específico para generate_lead (Leads Gerados)
 * POST /api/gtm/generate-lead
 */
router.post("/generate-lead", async (req, res) => {
  try {
    const {
      user_id,
      session_id,
      email,
      name,
      phone,
      source,
      page_url,
      referrer,
    } = req.body;

    const supabase = await getDb();
    if (!supabase) {
      return res.status(500).json({ error: "Database not available" });
    }

    const { error } = await supabase
      .from('gtm_events')
      .insert({
        event_name: "generate_lead",
        event_data: JSON.stringify({
          email,
          name,
          phone,
          source,
        }),
        user_id: user_id || null,
        session_id: session_id || null,
        ip_address: req.ip || req.headers["x-forwarded-for"] as string || null,
        user_agent: req.headers["user-agent"] || null,
        page_url: page_url || null,
        referrer: referrer || null,
      });

    if (error) throw error;

    res.json({ success: true, message: "Lead recorded" });
  } catch (error) {
    console.error("Error recording lead:", error);
    res.status(500).json({ error: "Failed to record lead" });
  }
});

/**
 * Endpoint específico para begin_checkout (Checkout Iniciado)
 * POST /api/gtm/begin-checkout
 */
router.post("/begin-checkout", async (req, res) => {
  try {
    const {
      user_id,
      session_id,
      product_id,
      product_name,
      value,
      currency,
      page_url,
      referrer,
    } = req.body;

    const supabase = await getDb();
    if (!supabase) {
      return res.status(500).json({ error: "Database not available" });
    }

    const { error } = await supabase
      .from('gtm_events')
      .insert({
        event_name: "begin_checkout",
        event_data: JSON.stringify({
          product_id,
          product_name,
          value,
          currency: currency || "BRL",
        }),
        user_id: user_id || null,
        session_id: session_id || null,
        ip_address: req.ip || req.headers["x-forwarded-for"] as string || null,
        user_agent: req.headers["user-agent"] || null,
        page_url: page_url || null,
        referrer: referrer || null,
      });

    if (error) throw error;

    res.json({ success: true, message: "Checkout initiated recorded" });
  } catch (error) {
    console.error("Error recording checkout:", error);
    res.status(500).json({ error: "Failed to record checkout" });
  }
});

/**
 * Endpoint específico para purchase (Vendas Concluídas)
 * POST /api/gtm/purchase
 */
router.post("/purchase", async (req, res) => {
  try {
    const {
      user_id,
      session_id,
      transaction_id,
      value,
      currency,
      product_id,
      product_name,
      quantity,
      page_url,
      referrer,
    } = req.body;

    if (!transaction_id || !value) {
      return res.status(400).json({ error: "transaction_id and value are required" });
    }

    const supabase = await getDb();
    if (!supabase) {
      return res.status(500).json({ error: "Database not available" });
    }

    // Tentar identificar o funil pela URL da página
    let identifiedFunilId: string | null = null;
    let identifiedFunilNome: string | null = null;
    
    if (page_url) {
      // Buscar funis cadastrados
      const { data: funis } = await supabase
        .from('funis')
        .select('*')
        .not('url', 'is', null)
        .neq('url', '');
      
      if (funis) {
        const matchedFunil = funis.find(f => page_url.includes(f.url));
        if (matchedFunil) {
          identifiedFunilId = matchedFunil.id.toString();
          identifiedFunilNome = matchedFunil.nome;
        }
      }
    }

    const { error } = await supabase
      .from('gtm_events')
      .insert({
        event_name: "purchase",
        event_data: JSON.stringify({
          transaction_id,
          value,
          currency: currency || "BRL",
          product_id: product_id || null,
          product_name: product_name || null,
          quantity: quantity || 1,
          funil_id: identifiedFunilId,
          funil_nome: identifiedFunilNome,
          page_url,
        }),
        user_id: user_id || null,
        session_id: session_id || null,
        ip_address: req.ip || req.headers["x-forwarded-for"] as string || null,
        user_agent: req.headers["user-agent"] || null,
        page_url: page_url || null,
        referrer: referrer || null,
      });

    if (error) throw error;

    res.json({ 
      success: true, 
      message: "Purchase recorded",
      identified_funil: identifiedFunilId ? {
        id: identifiedFunilId,
        nome: identifiedFunilNome
      } : null,
      note: identifiedFunilId ? "Funil identificado pela URL" : "Funil será identificado pela URL na página de Métricas"
    });
  } catch (error) {
    console.error("Error recording purchase:", error);
    res.status(500).json({ error: "Failed to record purchase" });
  }
});

/**
 * Endpoint para buscar estatísticas de eventos
 * GET /api/gtm/stats?start_date=2025-01-01&end_date=2025-01-31
 */
router.get("/stats", async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const supabase = await getDb();
    if (!supabase) {
      return res.status(500).json({ error: "Database not available" });
    }

    // Query com agregação
    const { data, error } = await supabase
      .from('gtm_events')
      .select('event_name, timestamp')
      .gte('timestamp', start_date || '2025-01-01')
      .lte('timestamp', end_date || '2025-12-31');

    if (error) throw error;

    // Agregar os resultados manualmente
    const aggregated = data?.reduce((acc: any, row: any) => {
      const existing = acc.find((item: any) => item.event_name === row.event_name);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ event_name: row.event_name, count: 1 });
      }
      return acc;
    }, []);

    res.json({ success: true, data: aggregated || [] });
  } catch (error) {
    console.error("Error fetching GTM stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
