import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { products } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const productsRouter = router({
  // Listar todos os produtos
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const allProducts = await db.select().from(products).where(eq(products.active, 1));
    return allProducts;
  }),

  // Obter um produto específico
  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [product] = await db.select().from(products).where(eq(products.id, input.id));
      return product;
    }),

  // Criar novo produto
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        price: z.number().positive(),
        type: z.enum(["front", "upsell", "high-ticket"]),
        channel: z.enum(["marketing", "comercial", "both"]).default("both"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.insert(products).values({
        name: input.name,
        price: input.price.toString(),
        type: input.type,
        channel: input.channel,
        active: 1,
      });
      
      return { id: Number(result[0].insertId), ...input };
    }),

  // Atualizar produto
  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        price: z.number().positive().optional(),
        type: z.enum(["front", "upsell", "high-ticket"]).optional(),
        channel: z.enum(["marketing", "comercial", "both"]).optional(),
        active: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...updateData } = input;
      const updates: any = {};
      
      if (updateData.name) updates.name = updateData.name;
      if (updateData.price !== undefined) updates.price = updateData.price.toString();
      if (updateData.type) updates.type = updateData.type;
      if (updateData.channel) updates.channel = updateData.channel;
      if (updateData.active !== undefined) updates.active = updateData.active;
      
      await db.update(products).set(updates).where(eq(products.id, id));
      
      return { id, ...updates };
    }),

  // Deletar produto (soft delete)
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.update(products).set({ active: 0 }).where(eq(products.id, input.id));
      
      return { success: true };
    }),
});
