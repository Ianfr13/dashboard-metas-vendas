import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";

export const productsRouter = router({
  // Listar todos os produtos
  list: publicProcedure.query(async () => {
    const supabase = await getDb();
    if (!supabase) throw new Error("Database not available");
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', 1);
    
    if (error) throw error;
    return data || [];
  }),

  // Obter um produto específico
  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const supabase = await getDb();
      if (!supabase) throw new Error("Database not available");
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', input.id)
        .single();
      
      if (error) throw error;
      return data;
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
      const supabase = await getDb();
      if (!supabase) throw new Error("Database not available");
      
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: input.name,
          price: input.price.toString(),
          type: input.type,
          channel: input.channel,
          active: 1,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
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
      const supabase = await getDb();
      if (!supabase) throw new Error("Database not available");
      
      const { id, ...updateData } = input;
      const updates: any = {};
      
      if (updateData.name) updates.name = updateData.name;
      if (updateData.price !== undefined) updates.price = updateData.price.toString();
      if (updateData.type) updates.type = updateData.type;
      if (updateData.channel) updates.channel = updateData.channel;
      if (updateData.active !== undefined) updates.active = updateData.active;
      
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }),

  // Deletar produto (soft delete)
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const supabase = await getDb();
      if (!supabase) throw new Error("Database not available");
      
      const { error } = await supabase
        .from('products')
        .update({ active: 0 })
        .eq('id', input.id);
      
      if (error) throw error;
      return { success: true };
    }),
});
