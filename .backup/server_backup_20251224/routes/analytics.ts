import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { dailyResults } from "../../drizzle/schema";
import { and, between, eq, gte, lte, sql } from "drizzle-orm";

export const analyticsRouter = router({
  /**
   * Buscar vendas por data específica
   */
  getByDate: publicProcedure
    .input(
      z.object({
        date: z.string(), // YYYY-MM-DD
        scenario: z.enum(["3M", "4M", "5M"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Database not available");

      const startOfDay = new Date(input.date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(input.date);
      endOfDay.setHours(23, 59, 59, 999);

      const conditions = [
        gte(dailyResults.date, startOfDay),
        lte(dailyResults.date, endOfDay),
      ];

      if (input.scenario) {
        conditions.push(eq(dailyResults.scenario, input.scenario));
      }

      const results = await dbInstance
        .select()
        .from(dailyResults)
        .where(and(...conditions));

      // Calcular totais
      const totals = results.reduce(
        (acc: any, row: any) => {
          acc.marketingSales += row.marketingDirectSales;
          acc.commercialSales += row.commercialSales;
          acc.marketingRevenue += parseFloat(row.marketingDirectRevenue);
          acc.commercialRevenue += parseFloat(row.commercialRevenue);
          acc.totalViews += row.actualViews || 0;
          acc.totalLeads += row.actualLeads || 0;
          return acc;
        },
        {
          marketingSales: 0,
          commercialSales: 0,
          marketingRevenue: 0,
          commercialRevenue: 0,
          totalViews: 0,
          totalLeads: 0,
        }
      );

      return {
        date: input.date,
        ...totals,
        totalRevenue: totals.marketingRevenue + totals.commercialRevenue,
        totalSales: totals.marketingSales + totals.commercialSales,
        results,
      };
    }),

  /**
   * Buscar vendas por período (range de datas)
   */
  getByPeriod: publicProcedure
    .input(
      z.object({
        startDate: z.string(), // YYYY-MM-DD
        endDate: z.string(), // YYYY-MM-DD
        scenario: z.enum(["3M", "4M", "5M"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Database not available");

      const start = new Date(input.startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(input.endDate);
      end.setHours(23, 59, 59, 999);

      const conditions = [
        gte(dailyResults.date, start),
        lte(dailyResults.date, end),
      ];

      if (input.scenario) {
        conditions.push(eq(dailyResults.scenario, input.scenario));
      }

      const results = await dbInstance
        .select()
        .from(dailyResults)
        .where(and(...conditions))
        .orderBy(dailyResults.date);

      // Calcular totais
      const totals = results.reduce(
        (acc: any, row: any) => {
          acc.marketingSales += row.marketingDirectSales;
          acc.commercialSales += row.commercialSales;
          acc.marketingRevenue += parseFloat(row.marketingDirectRevenue);
          acc.commercialRevenue += parseFloat(row.commercialRevenue);
          acc.totalViews += row.actualViews || 0;
          acc.totalLeads += row.actualLeads || 0;
          return acc;
        },
        {
          marketingSales: 0,
          commercialSales: 0,
          marketingRevenue: 0,
          commercialRevenue: 0,
          totalViews: 0,
          totalLeads: 0,
        }
      );

      // Agrupar por dia
      const dailyData = results.map((row: any) => ({
        date: row.date,
        marketingSales: row.marketingDirectSales,
        commercialSales: row.commercialSales,
        marketingRevenue: parseFloat(row.marketingDirectRevenue),
        commercialRevenue: parseFloat(row.commercialRevenue),
        totalRevenue:
          parseFloat(row.marketingDirectRevenue) +
          parseFloat(row.commercialRevenue),
        totalSales: row.marketingDirectSales + row.commercialSales,
        views: row.actualViews || 0,
        leads: row.actualLeads || 0,
      }));

      return {
        startDate: input.startDate,
        endDate: input.endDate,
        ...totals,
        totalRevenue: totals.marketingRevenue + totals.commercialRevenue,
        totalSales: totals.marketingSales + totals.commercialSales,
        dailyData,
      };
    }),

  /**
   * Buscar vendas do mês
   */
  getByMonth: publicProcedure
    .input(
      z.object({
        year: z.number(),
        month: z.number().min(1).max(12),
        scenario: z.enum(["3M", "4M", "5M"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Database not available");

      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0, 23, 59, 59, 999);

      const conditions = [
        gte(dailyResults.date, startDate),
        lte(dailyResults.date, endDate),
      ];

      if (input.scenario) {
        conditions.push(eq(dailyResults.scenario, input.scenario));
      }

      const results = await dbInstance
        .select()
        .from(dailyResults)
        .where(and(...conditions))
        .orderBy(dailyResults.date);

      // Calcular totais
      const totals = results.reduce(
        (acc: any, row: any) => {
          acc.marketingSales += row.marketingDirectSales;
          acc.commercialSales += row.commercialSales;
          acc.marketingRevenue += parseFloat(row.marketingDirectRevenue);
          acc.commercialRevenue += parseFloat(row.commercialRevenue);
          acc.totalViews += row.actualViews || 0;
          acc.totalLeads += row.actualLeads || 0;
          return acc;
        },
        {
          marketingSales: 0,
          commercialSales: 0,
          marketingRevenue: 0,
          commercialRevenue: 0,
          totalViews: 0,
          totalLeads: 0,
        }
      );

      // Agrupar por semana
      const weeklyData: Record<number, any> = {};
      results.forEach((row: any) => {
        const date = new Date(row.date);
        const weekOfMonth = Math.ceil(date.getDate() / 7);
        
        if (!weeklyData[weekOfMonth]) {
          weeklyData[weekOfMonth] = {
            week: weekOfMonth,
            marketingSales: 0,
            commercialSales: 0,
            marketingRevenue: 0,
            commercialRevenue: 0,
            totalRevenue: 0,
            totalSales: 0,
            views: 0,
            leads: 0,
          };
        }

        weeklyData[weekOfMonth].marketingSales += row.marketingDirectSales;
        weeklyData[weekOfMonth].commercialSales += row.commercialSales;
        weeklyData[weekOfMonth].marketingRevenue += parseFloat(row.marketingDirectRevenue);
        weeklyData[weekOfMonth].commercialRevenue += parseFloat(row.commercialRevenue);
        weeklyData[weekOfMonth].totalRevenue +=
          parseFloat(row.marketingDirectRevenue) +
          parseFloat(row.commercialRevenue);
        weeklyData[weekOfMonth].totalSales +=
          row.marketingDirectSales + row.commercialSales;
        weeklyData[weekOfMonth].views += row.actualViews || 0;
        weeklyData[weekOfMonth].leads += row.actualLeads || 0;
      });

      return {
        year: input.year,
        month: input.month,
        ...totals,
        totalRevenue: totals.marketingRevenue + totals.commercialRevenue,
        totalSales: totals.marketingSales + totals.commercialSales,
        weeklyData: Object.values(weeklyData),
        dailyData: results.map((row: any) => ({
          date: row.date,
          marketingSales: row.marketingDirectSales,
          commercialSales: row.commercialSales,
          marketingRevenue: parseFloat(row.marketingDirectRevenue),
          commercialRevenue: parseFloat(row.commercialRevenue),
          totalRevenue:
            parseFloat(row.marketingDirectRevenue) +
            parseFloat(row.commercialRevenue),
          totalSales: row.marketingDirectSales + row.commercialSales,
          views: row.actualViews || 0,
          leads: row.actualLeads || 0,
        })),
      };
    }),

  /**
   * Comparar dois períodos
   */
  comparePeriods: publicProcedure
    .input(
      z.object({
        period1Start: z.string(),
        period1End: z.string(),
        period2Start: z.string(),
        period2End: z.string(),
        scenario: z.enum(["3M", "4M", "5M"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      if (!db) throw new Error("Database not available");

      // Helper function to get period data
      const getPeriodData = async (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const conditions = [
          gte(dailyResults.date, start),
          lte(dailyResults.date, end),
        ];

        if (input.scenario) {
          conditions.push(eq(dailyResults.scenario, input.scenario));
        }

        const dbInstance = await db;
        if (!dbInstance) throw new Error("Database not available");
        
        const results = await dbInstance
          .select()
          .from(dailyResults)
          .where(and(...conditions));

        const totals = results.reduce(
          (acc: any, row: any) => {
            acc.marketingSales += row.marketingDirectSales;
            acc.commercialSales += row.commercialSales;
            acc.marketingRevenue += parseFloat(row.marketingDirectRevenue);
            acc.commercialRevenue += parseFloat(row.commercialRevenue);
            acc.totalViews += row.actualViews || 0;
            acc.totalLeads += row.actualLeads || 0;
            return acc;
          },
          {
            marketingSales: 0,
            commercialSales: 0,
            marketingRevenue: 0,
            commercialRevenue: 0,
            totalViews: 0,
            totalLeads: 0,
          }
        );

        return {
          ...totals,
          totalRevenue: totals.marketingRevenue + totals.commercialRevenue,
          totalSales: totals.marketingSales + totals.commercialSales,
        };
      };

      const period1 = await getPeriodData(input.period1Start, input.period1End);
      const period2 = await getPeriodData(input.period2Start, input.period2End);

      // Calculate differences
      const diff = {
        marketingSales: period2.marketingSales - period1.marketingSales,
        commercialSales: period2.commercialSales - period1.commercialSales,
        totalSales: period2.totalSales - period1.totalSales,
        marketingRevenue: period2.marketingRevenue - period1.marketingRevenue,
        commercialRevenue: period2.commercialRevenue - period1.commercialRevenue,
        totalRevenue: period2.totalRevenue - period1.totalRevenue,
        totalViews: period2.totalViews - period1.totalViews,
        totalLeads: period2.totalLeads - period1.totalLeads,
      };

      // Calculate percentage changes
      const percentageChange = {
        marketingSales: period1.marketingSales > 0 
          ? ((diff.marketingSales / period1.marketingSales) * 100).toFixed(2)
          : "N/A",
        commercialSales: period1.commercialSales > 0
          ? ((diff.commercialSales / period1.commercialSales) * 100).toFixed(2)
          : "N/A",
        totalSales: period1.totalSales > 0
          ? ((diff.totalSales / period1.totalSales) * 100).toFixed(2)
          : "N/A",
        totalRevenue: period1.totalRevenue > 0
          ? ((diff.totalRevenue / period1.totalRevenue) * 100).toFixed(2)
          : "N/A",
      };

      return {
        period1: {
          startDate: input.period1Start,
          endDate: input.period1End,
          ...period1,
        },
        period2: {
          startDate: input.period2Start,
          endDate: input.period2End,
          ...period2,
        },
        difference: diff,
        percentageChange,
      };
    }),
});
