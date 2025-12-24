import { router, protectedProcedure } from "../_core/trpc.js";
import { getDb } from "../db.js";
import { z } from "zod";

// Função auxiliar para calcular métricas
function calculateMetrics(params: {
  targetRevenue: number;
  vslConversionRate: number;
  checkoutConversionRate: number;
  upsellConversionRate: number;
  targetCPA: number;
  targetCPL: number;
  avgCTR: number;
  frontTicket: number;
  upsellTicket: number;
}) {
  const {
    targetRevenue,
    vslConversionRate,
    checkoutConversionRate,
    upsellConversionRate,
    targetCPA,
    targetCPL,
    avgCTR,
    frontTicket,
    upsellTicket,
  } = params;

  // Calcular ticket médio com upsell
  const avgTicket = frontTicket + (upsellTicket * (upsellConversionRate / 100));

  // Número de vendas necessárias
  const requiredSales = Math.ceil(targetRevenue / avgTicket);

  // Leads necessários (considerando conversão de checkout)
  const requiredLeads = Math.ceil(requiredSales / (checkoutConversionRate / 100));

  // Views necessários (considerando conversão VSL)
  const requiredViews = Math.ceil(requiredLeads / (vslConversionRate / 100));

  // Clicks necessários (considerando CTR)
  const requiredClicks = Math.ceil(requiredViews / (avgCTR / 100));

  // Investimento em tráfego
  const trafficInvestment = requiredSales * targetCPA;

  // ROI e ROAS
  const roi = ((targetRevenue - trafficInvestment) / trafficInvestment) * 100;
  const roas = targetRevenue / trafficInvestment;

  return {
    requiredSales,
    requiredLeads,
    requiredViews,
    requiredClicks,
    trafficInvestment,
    avgTicket,
    roi,
    roas,
  };
}

export const simulationsRouter = router({
  // Listar todas as simulações do usuário
  list: protectedProcedure.query(async ({ ctx }) => {
    const supabase = await getDb();
    if (!supabase) throw new Error("Database not available");
    
    const { data, error } = await supabase
      .from('simulation_params')
      .select('*')
      .eq('user_id', ctx.user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }),

  // Obter uma simulação específica
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const supabase = await getDb();
      if (!supabase) throw new Error("Database not available");
      
      const { data, error } = await supabase
        .from('simulation_params')
        .select('*')
        .eq('id', input.id)
        .eq('user_id', ctx.user.id)
        .single();

      if (error || !data) {
        throw new Error("Simulation not found");
      }

      return data;
    }),

  // Criar nova simulação
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        scenario: z.enum(["3M", "4M", "5M"]),
        vslConversionRate: z.number(),
        tslConversionRate: z.number(),
        checkoutConversionRate: z.number(),
        upsellConversionRate: z.number(),
        sdrConversionRate: z.number(),
        targetCPA: z.number(),
        targetCPL: z.number(),
        avgCTR: z.number(),
        frontTicket: z.number(),
        upsellTicket: z.number(),
        avgTicket: z.number(),
        sdrDailyMeetings: z.number(),
        sdrCount: z.number(),
        closerCount: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = await getDb();
      if (!supabase) throw new Error("Database not available");
      
      const { data, error } = await supabase
        .from('simulation_params')
        .insert({
          user_id: ctx.user.id,
          name: input.name,
          scenario: input.scenario,
          vsl_conversion_rate: input.vslConversionRate.toString(),
          tsl_conversion_rate: input.tslConversionRate.toString(),
          checkout_conversion_rate: input.checkoutConversionRate.toString(),
          upsell_conversion_rate: input.upsellConversionRate.toString(),
          sdr_conversion_rate: input.sdrConversionRate.toString(),
          target_cpa: input.targetCPA.toString(),
          target_cpl: input.targetCPL.toString(),
          avg_ctr: input.avgCTR.toString(),
          front_ticket: input.frontTicket.toString(),
          upsell_ticket: input.upsellTicket.toString(),
          avg_ticket: input.avgTicket.toString(),
          sdr_daily_meetings: input.sdrDailyMeetings,
          sdr_count: input.sdrCount,
          closer_count: input.closerCount,
        })
        .select()
        .single();

      if (error) throw error;

      return { id: data.id, message: "Simulation created successfully" };
    }),

  // Atualizar simulação
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        scenario: z.enum(["3M", "4M", "5M"]).optional(),
        vslConversionRate: z.number().optional(),
        tslConversionRate: z.number().optional(),
        checkoutConversionRate: z.number().optional(),
        upsellConversionRate: z.number().optional(),
        sdrConversionRate: z.number().optional(),
        targetCPA: z.number().optional(),
        targetCPL: z.number().optional(),
        avgCTR: z.number().optional(),
        frontTicket: z.number().optional(),
        upsellTicket: z.number().optional(),
        avgTicket: z.number().optional(),
        sdrDailyMeetings: z.number().optional(),
        sdrCount: z.number().optional(),
        closerCount: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const supabase = await getDb();
      if (!supabase) throw new Error("Database not available");

      // Convert field names to snake_case and numbers to strings where needed
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.scenario !== undefined) updateData.scenario = updates.scenario;
      if (updates.vslConversionRate !== undefined) updateData.vsl_conversion_rate = updates.vslConversionRate.toString();
      if (updates.tslConversionRate !== undefined) updateData.tsl_conversion_rate = updates.tslConversionRate.toString();
      if (updates.checkoutConversionRate !== undefined) updateData.checkout_conversion_rate = updates.checkoutConversionRate.toString();
      if (updates.upsellConversionRate !== undefined) updateData.upsell_conversion_rate = updates.upsellConversionRate.toString();
      if (updates.sdrConversionRate !== undefined) updateData.sdr_conversion_rate = updates.sdrConversionRate.toString();
      if (updates.targetCPA !== undefined) updateData.target_cpa = updates.targetCPA.toString();
      if (updates.targetCPL !== undefined) updateData.target_cpl = updates.targetCPL.toString();
      if (updates.avgCTR !== undefined) updateData.avg_ctr = updates.avgCTR.toString();
      if (updates.frontTicket !== undefined) updateData.front_ticket = updates.frontTicket.toString();
      if (updates.upsellTicket !== undefined) updateData.upsell_ticket = updates.upsellTicket.toString();
      if (updates.avgTicket !== undefined) updateData.avg_ticket = updates.avgTicket.toString();
      if (updates.sdrDailyMeetings !== undefined) updateData.sdr_daily_meetings = updates.sdrDailyMeetings;
      if (updates.sdrCount !== undefined) updateData.sdr_count = updates.sdrCount;
      if (updates.closerCount !== undefined) updateData.closer_count = updates.closerCount;

      const { error } = await supabase
        .from('simulation_params')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', ctx.user.id);

      if (error) throw error;

      return { message: "Simulation updated successfully" };
    }),

  // Calcular métricas para parâmetros fornecidos
  calculate: protectedProcedure
    .input(
      z.object({
        targetRevenue: z.number(),
        vslConversionRate: z.number(),
        checkoutConversionRate: z.number(),
        upsellConversionRate: z.number(),
        targetCPA: z.number(),
        targetCPL: z.number(),
        avgCTR: z.number(),
        frontTicket: z.number(),
        upsellTicket: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      return calculateMetrics(input);
    }),

  // Adicionar resultado diário
  addResult: protectedProcedure
    .input(
      z.object({
        date: z.string(),
        scenario: z.enum(["3M", "4M", "5M"]),
        week: z.number(),
        marketingDirectSales: z.number(),
        commercialSales: z.number(),
        marketingDirectRevenue: z.number(),
        commercialRevenue: z.number(),
        actualViews: z.number().optional(),
        actualLeads: z.number().optional(),
        actualInvestment: z.number().optional(),
        actualCPA: z.number().optional(),
        actualCPL: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = await getDb();
      if (!supabase) throw new Error("Database not available");
      
      const { data, error } = await supabase
        .from('daily_results')
        .insert({
          user_id: ctx.user.id,
          date: input.date,
          scenario: input.scenario,
          week: input.week,
          marketing_direct_sales: input.marketingDirectSales,
          commercial_sales: input.commercialSales,
          marketing_direct_revenue: input.marketingDirectRevenue.toString(),
          commercial_revenue: input.commercialRevenue.toString(),
          actual_views: input.actualViews,
          actual_leads: input.actualLeads,
          actual_investment: input.actualInvestment?.toString(),
          actual_cpa: input.actualCPA?.toString(),
          actual_cpl: input.actualCPL?.toString(),
          notes: input.notes,
        })
        .select()
        .single();

      if (error) throw error;

      return { id: data.id, message: "Daily result saved successfully" };
    }),

  // Obter resultados
  getResults: protectedProcedure
    .input(
      z.object({
        scenario: z.enum(["3M", "4M", "5M"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const supabase = await getDb();
      if (!supabase) throw new Error("Database not available");
      
      let query = supabase
        .from('daily_results')
        .select('*')
        .eq('user_id', ctx.user.id);

      if (input.scenario) {
        query = query.eq('scenario', input.scenario);
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    }),
});
