import { Router } from "express";
import { getDb } from "../db";
import { gtmEvents } from "../../drizzle/schema";
import { sql, count, gte, lte } from "drizzle-orm";

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

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    await db.insert(gtmEvents).values({
      eventName: event_name,
      eventData: event_data ? JSON.stringify(event_data) : null,
      userId: user_id || null,
      sessionId: session_id || null,
      ipAddress: req.ip || req.headers["x-forwarded-for"] as string || null,
      userAgent: req.headers["user-agent"] || null,
      pageUrl: page_url || null,
      referrer: referrer || null,
    });

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

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    await db.insert(gtmEvents).values({
      eventName: "page_view",
      eventData: JSON.stringify({
        page_url,
        page_title,
        referrer,
      }),
      userId: user_id || null,
      sessionId: session_id || null,
      ipAddress: req.ip || req.headers["x-forwarded-for"] as string || null,
      userAgent: req.headers["user-agent"] || null,
      pageUrl: page_url || null,
      referrer: referrer || null,
    });

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

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    await db.insert(gtmEvents).values({
      eventName: "generate_lead",
      eventData: JSON.stringify({
        email,
        name,
        phone,
        source,
      }),
      userId: user_id || null,
      sessionId: session_id || null,
      ipAddress: req.ip || req.headers["x-forwarded-for"] as string || null,
      userAgent: req.headers["user-agent"] || null,
      pageUrl: page_url || null,
      referrer: referrer || null,
    });

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

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    await db.insert(gtmEvents).values({
      eventName: "begin_checkout",
      eventData: JSON.stringify({
        product_id,
        product_name,
        value,
        currency: currency || "BRL",
      }),
      userId: user_id || null,
      sessionId: session_id || null,
      ipAddress: req.ip || req.headers["x-forwarded-for"] as string || null,
      userAgent: req.headers["user-agent"] || null,
      pageUrl: page_url || null,
      referrer: referrer || null,
    });

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

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    await db.insert(gtmEvents).values({
      eventName: "purchase",
      eventData: JSON.stringify({
        transaction_id,
        value,
        currency: currency || "BRL",
        product_id,
        product_name,
        quantity: quantity || 1,
      }),
      userId: user_id || null,
      sessionId: session_id || null,
      ipAddress: req.ip || req.headers["x-forwarded-for"] as string || null,
      userAgent: req.headers["user-agent"] || null,
      pageUrl: page_url || null,
      referrer: referrer || null,
    });

    res.json({ success: true, message: "Purchase recorded" });
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

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    // Usar Drizzle ORM para query
    const results = await db
      .select({
        event_name: gtmEvents.eventName,
        count: count(),
      })
      .from(gtmEvents)
      .where(
        sql`${gtmEvents.timestamp} >= ${start_date || "2025-01-01"} AND ${gtmEvents.timestamp} <= ${end_date || "2025-12-31"}`
      )
      .groupBy(gtmEvents.eventName);

    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Error fetching GTM stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
