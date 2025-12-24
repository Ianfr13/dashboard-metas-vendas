import { Router, Request, Response } from "express";
import { getDb } from "../db.js";
import { dailyResults } from "../../drizzle/schema.js";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

/**
 * Função auxiliar para determinar o cenário e semana com base na data
 */
function getScenarioAndWeek(date: Date): { scenario: '3M' | '4M' | '5M', week: number } {
  // Janeiro 2025
  const day = date.getDate();
  
  let week: number;
  if (day >= 1 && day <= 7) week = 1;
  else if (day >= 8 && day <= 14) week = 2;
  else if (day >= 15 && day <= 21) week = 3;
  else week = 4;
  
  // Por padrão, usar cenário 3M (pode ser configurado via env ou banco)
  const scenario = (process.env.DEFAULT_SCENARIO as '3M' | '4M' | '5M') || '3M';
  
  return { scenario, week };
}

/**
 * Função auxiliar para processar venda
 */
async function processSale(data: {
  productName: string;
  amount: number;
  date: Date;
  isHighTicket?: boolean;
  metadata?: any;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { scenario, week } = getScenarioAndWeek(data.date);
  
  // Determinar se é venda de marketing direto ou comercial
  const isCommercial = data.isHighTicket || data.amount >= 5000;
  
  // Buscar resultado do dia ou criar novo
  const dateStr = data.date.toISOString().split('T')[0];
  const existing = await db
    .select()
    .from(dailyResults)
    .where(
      and(
        eq(dailyResults.date, data.date),
        eq(dailyResults.scenario, scenario)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Atualizar resultado existente
    const current = existing[0];
    const newMarketingSales = isCommercial ? current.marketingDirectSales : current.marketingDirectSales + 1;
    const newCommercialSales = isCommercial ? current.commercialSales + 1 : current.commercialSales;
    const newMarketingRevenue = isCommercial 
      ? parseFloat(current.marketingDirectRevenue)
      : parseFloat(current.marketingDirectRevenue) + data.amount;
    const newCommercialRevenue = isCommercial
      ? parseFloat(current.commercialRevenue) + data.amount
      : parseFloat(current.commercialRevenue);

    await db
      .update(dailyResults)
      .set({
        marketingDirectSales: newMarketingSales,
        commercialSales: newCommercialSales,
        marketingDirectRevenue: newMarketingRevenue.toString(),
        commercialRevenue: newCommercialRevenue.toString(),
      })
      .where(eq(dailyResults.id, current.id));
  } else {
    // Criar novo resultado
    await db.insert(dailyResults).values({
      userId: 1, // Sistema (pode ser configurado)
      date: data.date,
      scenario,
      week,
      marketingDirectSales: isCommercial ? 0 : 1,
      commercialSales: isCommercial ? 1 : 0,
      marketingDirectRevenue: isCommercial ? "0" : data.amount.toString(),
      commercialRevenue: isCommercial ? data.amount.toString() : "0",
      actualViews: 0,
      actualLeads: 0,
      actualInvestment: "0",
      actualCPA: "0",
      actualCPL: "0",
    });
  }

  return { scenario, week, isCommercial };
}

/**
 * POST /api/webhooks/sale
 * Endpoint genérico para receber vendas
 */
router.post("/sale", async (req: Request, res: Response) => {
  try {
    const { product_name, amount, date, is_high_ticket, metadata } = req.body;

    if (!product_name || !amount) {
      return res.status(400).json({ 
        error: "Missing required fields: product_name, amount" 
      });
    }

    const saleDate = date ? new Date(date) : new Date();
    
    const result = await processSale({
      productName: product_name,
      amount: parseFloat(amount),
      date: saleDate,
      isHighTicket: is_high_ticket,
      metadata,
    });

    res.json({
      success: true,
      message: "Sale processed successfully",
      data: {
        scenario: result.scenario,
        week: result.week,
        type: result.isCommercial ? "commercial" : "marketing_direct",
      },
    });
  } catch (error) {
    console.error("Error processing sale:", error);
    res.status(500).json({ 
      error: "Failed to process sale",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/webhooks/stripe
 * Webhook específico para Stripe
 */
router.post("/stripe", async (req: Request, res: Response) => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // Validar assinatura do Stripe (se configurado)
    if (webhookSecret && sig) {
      // Aqui você adicionaria a validação real do Stripe
      // const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    }

    const event = req.body;

    // Processar apenas eventos de pagamento bem-sucedido
    if (event.type === 'checkout.session.completed' || event.type === 'payment_intent.succeeded') {
      const session = event.data.object;
      
      await processSale({
        productName: session.metadata?.product_name || 'Stripe Product',
        amount: session.amount_total ? session.amount_total / 100 : session.amount / 100,
        date: new Date(session.created * 1000),
        isHighTicket: session.metadata?.is_high_ticket === 'true',
        metadata: session.metadata,
      });
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Error processing Stripe webhook:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

/**
 * POST /api/webhooks/hotmart
 * Webhook específico para Hotmart
 */
router.post("/hotmart", async (req: Request, res: Response) => {
  try {
    const { event, data } = req.body;

    // Processar apenas eventos de compra aprovada
    if (event === 'PURCHASE_APPROVED' || event === 'PURCHASE_COMPLETE') {
      await processSale({
        productName: data.product?.name || 'Hotmart Product',
        amount: parseFloat(data.purchase?.price?.value || data.purchase?.offer?.price || 0),
        date: new Date(data.purchase?.approved_date || data.purchase?.order_date),
        isHighTicket: parseFloat(data.purchase?.price?.value || 0) >= 5000,
        metadata: {
          transaction_id: data.purchase?.transaction,
          buyer_email: data.buyer?.email,
        },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error processing Hotmart webhook:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

/**
 * POST /api/webhooks/kiwify
 * Webhook específico para Kiwify
 */
router.post("/kiwify", async (req: Request, res: Response) => {
  try {
    const { order_status, Product, order_amount, created_at } = req.body;

    // Processar apenas pedidos aprovados
    if (order_status === 'paid' || order_status === 'approved') {
      await processSale({
        productName: Product?.product_name || 'Kiwify Product',
        amount: parseFloat(order_amount || 0),
        date: new Date(created_at),
        isHighTicket: parseFloat(order_amount || 0) >= 5000,
        metadata: req.body,
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error processing Kiwify webhook:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

/**
 * POST /api/webhooks/braip
 * Webhook específico para Braip
 */
router.post("/braip", async (req: Request, res: Response) => {
  try {
    const { trans_status, prod_name, trans_value, trans_createdate } = req.body;

    // Processar apenas transações aprovadas
    if (trans_status === '1' || trans_status === 1) {
      await processSale({
        productName: prod_name || 'Braip Product',
        amount: parseFloat(trans_value || 0),
        date: new Date(trans_createdate),
        isHighTicket: parseFloat(trans_value || 0) >= 5000,
        metadata: req.body,
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error processing Braip webhook:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

/**
 * GET /api/webhooks/test
 * Endpoint de teste para simular uma venda
 */
router.get("/test", async (req: Request, res: Response) => {
  try {
    const result = await processSale({
      productName: "Teste - Assinatura Creatina",
      amount: 797,
      date: new Date(),
      isHighTicket: false,
      metadata: { test: true },
    });

    res.json({
      success: true,
      message: "Test sale created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error creating test sale:", error);
    res.status(500).json({ 
      error: "Failed to create test sale",
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
});

export default router;
