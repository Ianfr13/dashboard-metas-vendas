// Tipos para simulação de métricas do dashboard

export interface SimulationParams {
  // Taxas de Conversão
  vslConversionRate: number; // % (ex: 1.5)
  tslConversionRate: number; // % (ex: 1.5)
  checkoutConversionRate: number; // % (ex: 80)
  upsellConversionRate: number; // % (ex: 25)
  sdrConversionRate: number; // % (ex: 20)
  
  // Custos e Métricas de Tráfego
  targetCPA: number; // R$
  targetCPL: number; // R$
  avgCTR: number; // % (ex: 3)
  
  // Tickets
  frontTicket: number; // R$ (ex: 797)
  upsellTicket: number; // R$ (ex: 247)
  avgTicket: number; // R$ (ex: 1000)
  
  // Time Comercial
  sdrDailyMeetings: number; // quantidade
  sdrCount: number; // quantidade de SDRs
  closerCount: number; // quantidade de Closers
}

export interface CalculatedMetrics {
  // Tráfego
  requiredViews: number;
  requiredLeads: number;
  requiredClicks: number;
  
  // Investimento
  trafficInvestment: number;
  totalInvestment: number;
  
  // Performance
  expectedRevenue: number;
  actualCPA: number;
  actualCPL: number;
  roi: number; // %
  roas: number; // multiplicador
  
  // Breakdown de Vendas
  frontSales: number;
  upsellSales: number;
  totalSales: number;
  
  // Receita Breakdown
  frontRevenue: number;
  upsellRevenue: number;
  totalRevenue: number;
}

export interface DailyMetrics extends CalculatedMetrics {
  day: number;
  date: string;
}

export interface WeeklyMetrics extends CalculatedMetrics {
  week: number;
  period: string;
  dailyMetrics: DailyMetrics[];
}

export interface ScenarioMetrics {
  scenario: string;
  totalRevenue: number;
  weeklyMetrics: WeeklyMetrics[];
  monthlyMetrics: CalculatedMetrics;
}

// Valores padrão para simulação
export const DEFAULT_SIMULATION_PARAMS: SimulationParams = {
  vslConversionRate: 1.5,
  tslConversionRate: 1.5,
  checkoutConversionRate: 80,
  upsellConversionRate: 25,
  sdrConversionRate: 20,
  
  targetCPA: 450,
  targetCPL: 30,
  avgCTR: 3,
  
  frontTicket: 797,
  upsellTicket: 247,
  avgTicket: 1000,
  
  sdrDailyMeetings: 4,
  sdrCount: 1,
  closerCount: 2,
};
