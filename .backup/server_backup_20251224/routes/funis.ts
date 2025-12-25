import { Router } from "express";
import { getDb } from "../db";
import { funis, funilProdutos } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

/**
 * GET /api/funis
 * Buscar todos os funis ativos
 */
router.get("/", async (req, res) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    const allFunis = await db
      .select()
      .from(funis)
      .where(eq(funis.active, 1));

    // Buscar produtos de cada funil
    const funisComProdutos = await Promise.all(
      allFunis.map(async (funil) => {
        const produtos = await db
          .select()
          .from(funilProdutos)
          .where(eq(funilProdutos.funilId, funil.id));

        return {
          ...funil,
          produtos,
        };
      })
    );

    res.json({ success: true, funis: funisComProdutos });
  } catch (error) {
    console.error("Error fetching funis:", error);
    res.status(500).json({ error: "Failed to fetch funis" });
  }
});

/**
 * POST /api/funis
 * Criar novo funil
 */
router.post("/", async (req, res) => {
  try {
    const { nome, url, ticketMedio, produtos } = req.body;

    if (!nome) {
      return res.status(400).json({ error: "Nome is required" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    // Inserir funil
    const result = await db.insert(funis).values({
      nome,
      url: url || null,
      ticketMedio: ticketMedio || null,
      active: 1,
    });

    const funilId = Number(result[0].insertId);

    // Inserir produtos do funil
    if (produtos && Array.isArray(produtos)) {
      for (const produto of produtos) {
        await db.insert(funilProdutos).values({
          funilId,
          produtoId: produto.produtoId,
          tipo: produto.tipo,
          taxaTake: produto.taxaTake || null,
          ordem: produto.ordem || 0,
        });
      }
    }

    res.json({ success: true, funilId });
  } catch (error) {
    console.error("Error creating funil:", error);
    res.status(500).json({ error: "Failed to create funil" });
  }
});

/**
 * PUT /api/funis/:id
 * Atualizar funil existente
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, url, ticketMedio, produtos } = req.body;

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    // Atualizar funil
    await db
      .update(funis)
      .set({
        nome,
        url: url || null,
        ticketMedio: ticketMedio || null,
      })
      .where(eq(funis.id, Number(id)));

    // Remover produtos antigos
    await db.delete(funilProdutos).where(eq(funilProdutos.funilId, Number(id)));

    // Inserir novos produtos
    if (produtos && Array.isArray(produtos)) {
      for (const produto of produtos) {
        await db.insert(funilProdutos).values({
          funilId: Number(id),
          produtoId: produto.produtoId,
          tipo: produto.tipo,
          taxaTake: produto.taxaTake || null,
          ordem: produto.ordem || 0,
        });
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating funil:", error);
    res.status(500).json({ error: "Failed to update funil" });
  }
});

/**
 * DELETE /api/funis/:id
 * Deletar funil (soft delete)
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    await db
      .update(funis)
      .set({ active: 0 })
      .where(eq(funis.id, Number(id)));

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting funil:", error);
    res.status(500).json({ error: "Failed to delete funil" });
  }
});

export default router;
