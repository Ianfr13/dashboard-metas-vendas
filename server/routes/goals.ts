import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { goals, subGoals, dailyResults } from "../../drizzle/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export const goalsRouter = router({
  // List all goals
  list: protectedProcedure
    .input(
      z.object({
        scenario: z.enum(["3M", "4M", "5M"]).optional(),
        period: z.enum(["monthly", "weekly", "daily"]).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      let conditions = [eq(goals.userId, ctx.user.id)];
      
      if (input?.scenario) {
        conditions.push(eq(goals.scenario, input.scenario));
      }
      
      if (input?.period) {
        conditions.push(eq(goals.period, input.period));
      }
      
      const result = await db.select().from(goals).where(and(...conditions));
      return result;
    }),

  // Get single goal with sub-goals
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const goal = await db
        .select()
        .from(goals)
        .where(and(eq(goals.id, input.id), eq(goals.userId, ctx.user.id)))
        .limit(1);
      
      if (!goal.length) {
        throw new Error("Goal not found");
      }
      
      const subs = await db
        .select()
        .from(subGoals)
        .where(eq(subGoals.goalId, input.id));
      
      return {
        ...goal[0],
        subGoals: subs,
      };
    }),

  // Create goal
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        scenario: z.enum(["3M", "4M", "5M"]),
        period: z.enum(["monthly", "weekly", "daily"]),
        targetRevenue: z.string(),
        targetSales: z.number(),
        targetMarketingSales: z.number(),
        targetCommercialSales: z.number(),
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.insert(goals).values({
        userId: ctx.user.id,
        ...input,
      });
      
      return { id: Number((result as any).insertId), success: true };
    }),

  // Update goal
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        targetRevenue: z.string().optional(),
        targetSales: z.number().optional(),
        targetMarketingSales: z.number().optional(),
        targetCommercialSales: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        isActive: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { id, ...updates } = input;
      
      await db
        .update(goals)
        .set(updates)
        .where(and(eq(goals.id, id), eq(goals.userId, ctx.user.id)));
      
      return { success: true };
    }),

  // Delete goal
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Delete sub-goals first
      await db.delete(subGoals).where(eq(subGoals.goalId, input.id));
      
      // Delete goal
      await db
        .delete(goals)
        .where(and(eq(goals.id, input.id), eq(goals.userId, ctx.user.id)));
      
      return { success: true };
    }),

  // Create sub-goal
  createSubGoal: protectedProcedure
    .input(
      z.object({
        goalId: z.number(),
        name: z.string(),
        category: z.enum(["product", "funnel", "channel", "team", "other"]),
        targetRevenue: z.string(),
        targetSales: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.insert(subGoals).values({
        userId: ctx.user.id,
        ...input,
        currentRevenue: "0",
        currentSales: 0,
      });
      
      return { id: Number((result as any).insertId), success: true };
    }),

  // Update sub-goal
  updateSubGoal: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        targetRevenue: z.string().optional(),
        targetSales: z.number().optional(),
        currentRevenue: z.string().optional(),
        currentSales: z.number().optional(),
        isActive: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { id, ...updates } = input;
      
      await db
        .update(subGoals)
        .set(updates)
        .where(and(eq(subGoals.id, id), eq(subGoals.userId, ctx.user.id)));
      
      return { success: true };
    }),

  // Delete sub-goal
  deleteSubGoal: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .delete(subGoals)
        .where(and(eq(subGoals.id, input.id), eq(subGoals.userId, ctx.user.id)));
      
      return { success: true };
    }),

  // Get progress for a goal
  getProgress: protectedProcedure
    .input(z.object({ goalId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Get goal
      const goal = await db
        .select()
        .from(goals)
        .where(and(eq(goals.id, input.goalId), eq(goals.userId, ctx.user.id)))
        .limit(1);
      
      if (!goal.length) {
        throw new Error("Goal not found");
      }
      
      const g = goal[0];
      
      // Get actual results in the date range
      const results = await db
        .select()
        .from(dailyResults)
        .where(
          and(
            eq(dailyResults.userId, ctx.user.id),
            gte(dailyResults.date, g.startDate),
            lte(dailyResults.date, g.endDate)
          )
        );
      
      // Calculate totals
      let totalRevenue = 0;
      let totalSales = 0;
      let marketingSales = 0;
      let commercialSales = 0;
      
      results.forEach((r) => {
        const mRevenue = parseFloat(r.marketingDirectRevenue || "0");
        const cRevenue = parseFloat(r.commercialRevenue || "0");
        totalRevenue += mRevenue + cRevenue;
        totalSales += (r.marketingDirectSales || 0) + (r.commercialSales || 0);
        marketingSales += r.marketingDirectSales || 0;
        commercialSales += r.commercialSales || 0;
      });
      
      // Calculate percentages
      const targetRev = parseFloat(g.targetRevenue);
      const revenueProgress = targetRev > 0 ? (totalRevenue / targetRev) * 100 : 0;
      const salesProgress = g.targetSales > 0 ? (totalSales / g.targetSales) * 100 : 0;
      
      // Calculate days
      const now = new Date();
      const start = new Date(g.startDate);
      const end = new Date(g.endDate);
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const daysElapsed = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, totalDays - daysElapsed);
      
      // Calculate expected progress (linear)
      const expectedProgress = totalDays > 0 ? (daysElapsed / totalDays) * 100 : 0;
      
      // Calculate deficit/surplus
      const revenueDeficit = totalRevenue - (targetRev * (daysElapsed / totalDays));
      const salesDeficit = totalSales - (g.targetSales * (daysElapsed / totalDays));
      
      return {
        goal: g,
        current: {
          revenue: totalRevenue,
          sales: totalSales,
          marketingSales,
          commercialSales,
        },
        progress: {
          revenue: revenueProgress,
          sales: salesProgress,
          expected: expectedProgress,
        },
        deficit: {
          revenue: revenueDeficit,
          sales: salesDeficit,
        },
        days: {
          total: totalDays,
          elapsed: daysElapsed,
          remaining: daysRemaining,
        },
      };
    }),

  // Get daily progress
  getDailyProgress: protectedProcedure
    .input(z.object({ date: z.date() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Find active daily goal
      const dailyGoals = await db
        .select()
        .from(goals)
        .where(
          and(
            eq(goals.userId, ctx.user.id),
            eq(goals.period, "daily"),
            lte(goals.startDate, input.date),
            gte(goals.endDate, input.date)
          )
        );
      
      if (!dailyGoals.length) {
        return null;
      }
      
      const goal = dailyGoals[0];
      
      // Get results for this day
      const dayStart = new Date(input.date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(input.date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const results = await db
        .select()
        .from(dailyResults)
        .where(
          and(
            eq(dailyResults.userId, ctx.user.id),
            gte(dailyResults.date, dayStart),
            lte(dailyResults.date, dayEnd)
          )
        );
      
      let totalRevenue = 0;
      let totalSales = 0;
      
      results.forEach((r) => {
        const mRevenue = parseFloat(r.marketingDirectRevenue || "0");
        const cRevenue = parseFloat(r.commercialRevenue || "0");
        totalRevenue += mRevenue + cRevenue;
        totalSales += (r.marketingDirectSales || 0) + (r.commercialSales || 0);
      });
      
      const targetRev = parseFloat(goal.targetRevenue);
      const revenueProgress = targetRev > 0 ? (totalRevenue / targetRev) * 100 : 0;
      const salesProgress = goal.targetSales > 0 ? (totalSales / goal.targetSales) * 100 : 0;
      
      return {
        goal,
        current: {
          revenue: totalRevenue,
          sales: totalSales,
        },
        progress: {
          revenue: revenueProgress,
          sales: salesProgress,
        },
        deficit: {
          revenue: totalRevenue - targetRev,
          sales: totalSales - goal.targetSales,
        },
      };
    }),
});
