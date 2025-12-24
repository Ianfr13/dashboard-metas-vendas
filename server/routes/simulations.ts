import { router, protectedProcedure } from "../_core/trpc.js";
import { getDb } from "../db.js";
import { simulationParams, dailyResults } from "../../drizzle/schema.js";
import { eq, and, desc } from "drizzle-orm";
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
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const simulations = await db
      .select()
      .from(simulationParams)
      .where(eq(simulationParams.userId, ctx.user.id))
      .orderBy(desc(simulationParams.updatedAt));

    return simulations;
  }),

  // Obter uma simulação específica
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const simulation = await db
        .select()
        .from(simulationParams)
        .where(
          and(
            eq(simulationParams.id, input.id),
            eq(simulationParams.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (simulation.length === 0) {
        throw new Error("Simulation not found");
      }

      return simulation[0];
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
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.insert(simulationParams).values({
        userId: ctx.user.id,
        name: input.name,
        scenario: input.scenario,
        vslConversionRate: input.vslConversionRate.toString(),
        tslConversionRate: input.tslConversionRate.toString(),
        checkoutConversionRate: input.checkoutConversionRate.toString(),
        upsellConversionRate: input.upsellConversionRate.toString(),
        sdrConversionRate: input.sdrConversionRate.toString(),
        targetCPA: input.targetCPA.toString(),
        targetCPL: input.targetCPL.toString(),
        avgCTR: input.avgCTR.toString(),
        frontTicket: input.frontTicket.toString(),
        upsellTicket: input.upsellTicket.toString(),
        avgTicket: input.avgTicket.toString(),
        sdrDailyMeetings: input.sdrDailyMeetings,
        sdrCount: input.sdrCount,
        closerCount: input.closerCount,
      });

      return { id: result[0].insertId, message: "Simulation created successfully" };
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

      // Converter números para strings onde necessário
      const stringFields = [
        'vslConversionRate', 'tslConversionRate', 'checkoutConversionRate',
        'upsellConversionRate', 'sdrConversionRate', 'targetCPA', 'targetCPL',
        'avgCTR', 'frontTicket', 'upsellTicket', 'avgTicket'
      ] as const;

      const processedUpdates: any = { ...updates };
      stringFields.forEach(field => {
        if (processedUpdates[field] !== undefined) {
          processedUpdates[field] = processedUpdates[field].toString();
        }
      });

      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .update(simulationParams)
        .set(processedUpdates)
        .where(
          and(
            eq(simulationParams.id, id),
            eq(simulationParams.userId, ctx.user.id)
          )
        );

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
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.insert(dailyResults).values({
        userId: ctx.user.id,
        date: new Date(input.date),
        scenario: input.scenario,
        week: input.week,
        marketingDirectSales: input.marketingDirectSales,
        commercialSales: input.commercialSales,
        marketingDirectRevenue: input.marketingDirectRevenue.toString(),
        commercialRevenue: input.commercialRevenue.toString(),
        actualViews: input.actualViews,
        actualLeads: input.actualLeads,
        actualInvestment: input.actualInvestment?.toString(),
        actualCPA: input.actualCPA?.toString(),
        actualCPL: input.actualCPL?.toString(),
        notes: input.notes,
      });

      return { id: result[0].insertId, message: "Daily result saved successfully" };
    }),

  // Obter resultados
  getResults: protectedProcedure
    .input(
      z.object({
        scenario: z.enum(["3M", "4M", "5M"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const results = await db
        .select()
        .from(dailyResults)
        .where(
          and(
            eq(dailyResults.userId, ctx.user.id),
            input.scenario ? eq(dailyResults.scenario, input.scenario) : undefined
          )
        )
        .orderBy(desc(dailyResults.date));

      return results;
    }),
});
