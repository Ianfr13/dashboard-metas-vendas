import { Router } from "express";
import { getDb } from "../db";
import { gtmEvents } from "../../drizzle/schema";
import { sql, and, gte, lte } from "drizzle-orm";

const router = Router();

/**
 * Endpoint para buscar métricas de um funil específico
 * POST /api/funil/metricas
 * Body: { funilUrl, produtos: [{ valor, tipo }] }
 * Retorna todas as vendas com timestamp para o frontend filtrar por período
 */
router.post("/metricas", async (req, res) => {
  try {
    const { funilUrl, produtos } = req.body;

    if (!funilUrl) {
      return res.status(400).json({ error: "funilUrl is required" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    // Buscar TODOS os eventos de purchase que contêm a URL do funil
    const purchases = await db
      .select()
      .from(gtmEvents)
      .where(
        and(
          sql`${gtmEvents.eventName} = 'purchase'`,
          sql`${gtmEvents.pageUrl} LIKE ${`%${funilUrl}%`}`
        )
      );

    // Processar vendas e extrair dados
    const vendas = purchases.map((p) => {
      const eventData = JSON.parse(p.eventData || "{}");
      return {
        id: p.id,
        transactionId: eventData.transaction_id,
        value: parseFloat(eventData.value) || 0,
        pageUrl: p.pageUrl,
        createdAt: p.createdAt,
      };
    });

    // Calcular métricas básicas
    const totalVendas = vendas.length;
    const receitaTotal = vendas.reduce((sum, v) => sum + v.value, 0);
    const ticketMedio = totalVendas > 0 ? receitaTotal / totalVendas : 0;

    // Identificar tipo de cada venda baseado no valor
    const vendasPorTipo: Record<string, number> = {
      frontend: 0,
      backend: 0,
      downsell: 0,
    };

    if (produtos && Array.isArray(produtos)) {
      vendas.forEach((venda) => {
        // Encontrar produto que mais se aproxima do valor da venda (tolerância de R$ 5)
        const produtoMatch = produtos.find(
          (p: any) => Math.abs(p.valor - venda.value) <= 5
        );
        
        if (produtoMatch) {
          vendasPorTipo[produtoMatch.tipo] = (vendasPorTipo[produtoMatch.tipo] || 0) + 1;
        }
      });
    }

    // Calcular taxas de take reais
    const vendasFrontend = vendasPorTipo.frontend || 0;
    const taxaTakeUpsell = vendasFrontend > 0 
      ? (vendasPorTipo.backend / vendasFrontend) * 100 
      : 0;
    const taxaTakeDownsell = vendasFrontend > 0 
      ? (vendasPorTipo.downsell / vendasFrontend) * 100 
      : 0;

    res.json({
      success: true,
      funil: {
        url: funilUrl,
      },
      metricas: {
        totalVendas,
        receitaTotal,
        ticketMedio,
        vendasPorTipo,
        taxaTakeUpsell,
        taxaTakeDownsell,
      },
      vendas: vendas.map((v) => ({
        id: v.id,
        valor: v.value,
        data: v.createdAt,
        url: v.pageUrl,
      })),
    });
  } catch (error) {
    console.error("Error fetching funil metricas:", error);
    res.status(500).json({ error: "Failed to fetch funil metricas" });
  }
});

export default router;
