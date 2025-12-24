import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Simulation Parameters Table
 * Stores user-defined simulation parameters for different scenarios
 */
export const simulationParams = mysqlTable("simulation_params", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(), // Nome da simulação
  scenario: mysqlEnum("scenario", ["3M", "4M", "5M"]).notNull(),
  
  // Taxas de Conversão (armazenadas como percentuais: 1.5 = 1.5%)
  vslConversionRate: text("vslConversionRate").notNull(),
  tslConversionRate: text("tslConversionRate").notNull(),
  checkoutConversionRate: text("checkoutConversionRate").notNull(),
  upsellConversionRate: text("upsellConversionRate").notNull(),
  sdrConversionRate: text("sdrConversionRate").notNull(),
  
  // Custos e Métricas de Tráfego
  targetCPA: text("targetCPA").notNull(),
  targetCPL: text("targetCPL").notNull(),
  avgCTR: text("avgCTR").notNull(),
  
  // Tickets
  frontTicket: text("frontTicket").notNull(),
  upsellTicket: text("upsellTicket").notNull(),
  avgTicket: text("avgTicket").notNull(),
  
  // Time Comercial
  sdrDailyMeetings: int("sdrDailyMeetings").notNull().default(4),
  sdrCount: int("sdrCount").notNull().default(1),
  closerCount: int("closerCount").notNull().default(2),
  
  // Metadata
  isActive: int("isActive").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SimulationParams = typeof simulationParams.$inferSelect;
export type InsertSimulationParams = typeof simulationParams.$inferInsert;

/**
 * Daily Results Table
 * Stores actual daily performance data
 */
export const dailyResults = mysqlTable("daily_results", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: timestamp("date").notNull(), // Data do resultado
  scenario: mysqlEnum("scenario", ["3M", "4M", "5M"]).notNull(),
  week: int("week").notNull(), // Semana do mês (1-4)
  
  // Vendas Realizadas
  marketingDirectSales: int("marketingDirectSales").notNull().default(0),
  commercialSales: int("commercialSales").notNull().default(0),
  
  // Receita Realizada
  marketingDirectRevenue: text("marketingDirectRevenue").notNull(),
  commercialRevenue: text("commercialRevenue").notNull(),
  
  // Métricas de Tráfego Realizadas
  actualViews: int("actualViews").default(0),
  actualLeads: int("actualLeads").default(0),
  actualInvestment: text("actualInvestment"),
  actualCPA: text("actualCPA"),
  actualCPL: text("actualCPL"),
  
  // Metadata
  notes: text("notes"), // Observações do dia
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DailyResults = typeof dailyResults.$inferSelect;
export type InsertDailyResults = typeof dailyResults.$inferInsert;

/**
 * Calculated Metrics Table (Cache)
 * Stores pre-calculated metrics for performance
 */
export const calculatedMetrics = mysqlTable("calculated_metrics", {
  id: int("id").autoincrement().primaryKey(),
  simulationParamsId: int("simulationParamsId").notNull(),
  scenario: mysqlEnum("scenario", ["3M", "4M", "5M"]).notNull(),
  period: mysqlEnum("period", ["daily", "weekly", "monthly"]).notNull(),
  week: int("week"), // Null para monthly, 1-4 para weekly/daily
  day: int("day"), // Null para weekly/monthly, 1-31 para daily
  
  // Métricas Calculadas
  requiredViews: int("requiredViews").notNull(),
  requiredLeads: int("requiredLeads").notNull(),
  requiredClicks: int("requiredClicks").notNull(),
  trafficInvestment: text("trafficInvestment").notNull(),
  expectedRevenue: text("expectedRevenue").notNull(),
  roi: text("roi").notNull(), // Percentual
  roas: text("roas").notNull(), // Multiplicador
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CalculatedMetrics = typeof calculatedMetrics.$inferSelect;
export type InsertCalculatedMetrics = typeof calculatedMetrics.$inferInsert;