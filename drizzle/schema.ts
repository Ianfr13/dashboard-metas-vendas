import { boolean, decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
 * Goals Table
 * Stores custom goals/targets set by admin
 */
export const goals = mysqlTable("goals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  scenario: mysqlEnum("scenario", ["3M", "4M", "5M"]).notNull(),
  period: mysqlEnum("period", ["monthly", "weekly", "daily"]).notNull(),
  
  // Target values
  targetRevenue: text("targetRevenue").notNull(),
  targetSales: int("targetSales").notNull(),
  targetMarketingSales: int("targetMarketingSales").notNull(),
  targetCommercialSales: int("targetCommercialSales").notNull(),
  
  // Sub-goals as JSON array: [{value: 100000, completed: false}, ...]
  subGoals: text("subGoals"),
  
  // Date range
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  
  // Status
  isActive: int("isActive").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = typeof goals.$inferInsert;

/**
 * Sub Goals Table
 * Stores sub-goals (by product, funnel, channel, etc)
 */
export const subGoals = mysqlTable("sub_goals", {
  id: int("id").autoincrement().primaryKey(),
  goalId: int("goalId").notNull(), // FK to goals table
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: mysqlEnum("category", ["product", "funnel", "channel", "team", "other"]).notNull(),
  
  // Target values
  targetRevenue: text("targetRevenue").notNull(),
  targetSales: int("targetSales").notNull(),
  
  // Progress tracking
  currentRevenue: text("currentRevenue"),
  currentSales: int("currentSales"),
  
  // Status
  isActive: int("isActive").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SubGoal = typeof subGoals.$inferSelect;
export type InsertSubGoal = typeof subGoals.$inferInsert;

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

/**
 * Products Table
 * Stores products that can be sold (front, upsell, high-ticket)
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  type: mysqlEnum("type", ["front", "upsell", "high-ticket"]).notNull(),
  channel: mysqlEnum("channel", ["marketing", "comercial", "both"]).notNull().default("both"),
  url: text("url"), // URL da página de checkout/venda para rastreamento
  active: int("active").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * GTM Events Table
 * Stores events received from Google Tag Manager
 */
export const gtmEvents = mysqlTable("gtm_events", {
  id: int("id").autoincrement().primaryKey(),
  eventName: varchar("event_name", { length: 100 }).notNull(),
  eventData: text("event_data"),
  userId: varchar("user_id", { length: 255 }),
  sessionId: varchar("session_id", { length: 255 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  pageUrl: text("page_url"),
  referrer: text("referrer"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GtmEvent = typeof gtmEvents.$inferSelect;
export type InsertGtmEvent = typeof gtmEvents.$inferInsert;
/**
 * Funis Table
 * Stores sales funnels with their configuration
 */
export const funis = mysqlTable("funis", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  url: text("url"), // URL base do funil para rastreamento (ex: /checkout/creatina)
  ticketMedio: decimal("ticket_medio", { precision: 10, scale: 2 }),
  active: int("active").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Funil = typeof funis.$inferSelect;
export type InsertFunil = typeof funis.$inferInsert;

/**
 * Funil Produtos Table
 * Relationship table between funis and products
 */
export const funilProdutos = mysqlTable("funil_produtos", {
  id: int("id").autoincrement().primaryKey(),
  funilId: int("funil_id").notNull(),
  produtoId: int("produto_id").notNull(),
  tipo: mysqlEnum("tipo", ["frontend", "backend", "downsell"]).notNull(),
  taxaTake: decimal("taxa_take", { precision: 5, scale: 2 }), // Taxa de conversão esperada (%)
  ordem: int("ordem").notNull().default(0), // Ordem no funil
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FunilProduto = typeof funilProdutos.$inferSelect;
export type InsertFunilProduto = typeof funilProdutos.$inferInsert;

/**
 * Metas Principais Table
 * Stores main revenue goals for the dashboard
 */
export const metasPrincipais = mysqlTable("metas_principais", {
  id: int("id").autoincrement().primaryKey(),
  mes: int("mes").notNull(), // 1-12
  ano: int("ano").notNull(),
  valorMeta: decimal("valor_meta", { precision: 12, scale: 2 }).notNull(),
  valorAtual: decimal("valor_atual", { precision: 12, scale: 2 }).default("0"),
  active: int("active").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MetaPrincipal = typeof metasPrincipais.$inferSelect;
export type InsertMetaPrincipal = typeof metasPrincipais.$inferInsert;

/**
 * Sub Metas Table
 * Stores milestone sub-goals
 */
export const subMetas = mysqlTable("sub_metas", {
  id: int("id").autoincrement().primaryKey(),
  metaPrincipalId: int("meta_principal_id").notNull(),
  valor: decimal("valor", { precision: 12, scale: 2 }).notNull(),
  atingida: int("atingida").notNull().default(0),
  dataAtingida: timestamp("data_atingida"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SubMeta = typeof subMetas.$inferSelect;
export type InsertSubMeta = typeof subMetas.$inferInsert;

/**
 * Custos Table
 * Stores cost tracking for different channels
 */
export const custos = mysqlTable("custos", {
  id: int("id").autoincrement().primaryKey(),
  canal: mysqlEnum("canal", ["marketing", "comercial"]).notNull(),
  tipo: varchar("tipo", { length: 100 }).notNull(), // Ex: "Tráfego Pago", "SDR", "Closer"
  valorMensal: decimal("valor_mensal", { precision: 10, scale: 2 }).notNull(),
  mes: int("mes").notNull(),
  ano: int("ano").notNull(),
  active: int("active").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Custo = typeof custos.$inferSelect;
export type InsertCusto = typeof custos.$inferInsert;

/**
 * Distribuição Canal Table
 * Stores revenue distribution targets between marketing and commercial channels
 */
export const distribuicaoCanal = mysqlTable("distribuicao_canal", {
  id: int("id").autoincrement().primaryKey(),
  mes: int("mes").notNull(),
  ano: int("ano").notNull(),
  percentualMarketing: decimal("percentual_marketing", { precision: 5, scale: 2 }).notNull(),
  percentualComercial: decimal("percentual_comercial", { precision: 5, scale: 2 }).notNull(),
  active: int("active").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DistribuicaoCanal = typeof distribuicaoCanal.$inferSelect;
export type InsertDistribuicaoCanal = typeof distribuicaoCanal.$inferInsert;
