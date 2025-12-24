// Neo-Glassmorphism Dashboard - Dados de Metas de Vendas
// Estrutura de dados para os 3 cenários de faturamento

export type Scenario = '3M' | '4M' | '5M';

export interface WeeklyGoal {
  week: number;
  period: string;
  marketingDirectSales: number;
  marketingDirectRevenue: number;
  commercialSales: number;
  commercialRevenue: number;
  dailyTarget: number;
  dailyVisitors: number;
  sdrMeetings: number;
  closerSales: number;
}

export interface ScenarioData {
  id: Scenario;
  totalRevenue: number;
  marketingDirectTotal: number;
  commercialTotal: number;
  marketingDirectPercentage: number;
  commercialPercentage: number;
  weeks: WeeklyGoal[];
}

export const scenariosData: Record<Scenario, ScenarioData> = {
  '3M': {
    id: '3M',
    totalRevenue: 3000000,
    marketingDirectTotal: 2550000,
    commercialTotal: 450000,
    marketingDirectPercentage: 85,
    commercialPercentage: 15,
    weeks: [
      {
        week: 1,
        period: '01-07/01',
        marketingDirectSales: 160,
        marketingDirectRevenue: 160000,
        commercialSales: 1,
        commercialRevenue: 20000,
        dailyTarget: 23,
        dailyVisitors: 1530,
        sdrMeetings: 5,
        closerSales: 1,
      },
      {
        week: 2,
        period: '08-14/01',
        marketingDirectSales: 382,
        marketingDirectRevenue: 382000,
        commercialSales: 4,
        commercialRevenue: 80000,
        dailyTarget: 55,
        dailyVisitors: 3670,
        sdrMeetings: 20,
        closerSales: 4,
      },
      {
        week: 3,
        period: '15-21/01',
        marketingDirectSales: 1004,
        marketingDirectRevenue: 1004000,
        commercialSales: 9,
        commercialRevenue: 175000,
        dailyTarget: 143,
        dailyVisitors: 7870,
        sdrMeetings: 30,
        closerSales: 9,
      },
      {
        week: 4,
        period: '22-31/01',
        marketingDirectSales: 1004,
        marketingDirectRevenue: 1004000,
        commercialSales: 9,
        commercialRevenue: 175000,
        dailyTarget: 143,
        dailyVisitors: 7870,
        sdrMeetings: 30,
        closerSales: 9,
      },
    ],
  },
  '4M': {
    id: '4M',
    totalRevenue: 4000000,
    marketingDirectTotal: 3400000,
    commercialTotal: 600000,
    marketingDirectPercentage: 85,
    commercialPercentage: 15,
    weeks: [
      {
        week: 1,
        period: '01-07/01',
        marketingDirectSales: 212,
        marketingDirectRevenue: 212000,
        commercialSales: 2,
        commercialRevenue: 40000,
        dailyTarget: 30,
        dailyVisitors: 2000,
        sdrMeetings: 10,
        closerSales: 2,
      },
      {
        week: 2,
        period: '08-14/01',
        marketingDirectSales: 510,
        marketingDirectRevenue: 510000,
        commercialSales: 5,
        commercialRevenue: 100000,
        dailyTarget: 73,
        dailyVisitors: 4870,
        sdrMeetings: 25,
        closerSales: 5,
      },
      {
        week: 3,
        period: '15-21/01',
        marketingDirectSales: 1339,
        marketingDirectRevenue: 1339000,
        commercialSales: 12,
        commercialRevenue: 230000,
        dailyTarget: 191,
        dailyVisitors: 10500,
        sdrMeetings: 40,
        closerSales: 12,
      },
      {
        week: 4,
        period: '22-31/01',
        marketingDirectSales: 1339,
        marketingDirectRevenue: 1339000,
        commercialSales: 11,
        commercialRevenue: 230000,
        dailyTarget: 191,
        dailyVisitors: 10500,
        sdrMeetings: 40,
        closerSales: 11,
      },
    ],
  },
  '5M': {
    id: '5M',
    totalRevenue: 5000000,
    marketingDirectTotal: 4250000,
    commercialTotal: 750000,
    marketingDirectPercentage: 85,
    commercialPercentage: 15,
    weeks: [
      {
        week: 1,
        period: '01-07/01',
        marketingDirectSales: 265,
        marketingDirectRevenue: 265000,
        commercialSales: 3,
        commercialRevenue: 60000,
        dailyTarget: 38,
        dailyVisitors: 2530,
        sdrMeetings: 15,
        closerSales: 3,
      },
      {
        week: 2,
        period: '08-14/01',
        marketingDirectSales: 638,
        marketingDirectRevenue: 638000,
        commercialSales: 6,
        commercialRevenue: 120000,
        dailyTarget: 91,
        dailyVisitors: 6070,
        sdrMeetings: 30,
        closerSales: 6,
      },
      {
        week: 3,
        period: '15-21/01',
        marketingDirectSales: 1673,
        marketingDirectRevenue: 1673000,
        commercialSales: 15,
        commercialRevenue: 285000,
        dailyTarget: 239,
        dailyVisitors: 13130,
        sdrMeetings: 50,
        closerSales: 15,
      },
      {
        week: 4,
        period: '22-31/01',
        marketingDirectSales: 1674,
        marketingDirectRevenue: 1674000,
        commercialSales: 14,
        commercialRevenue: 285000,
        dailyTarget: 239,
        dailyVisitors: 13130,
        sdrMeetings: 50,
        closerSales: 14,
      },
    ],
  },
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('pt-BR').format(value);
};

export const calculateProgress = (current: number, target: number): number => {
  if (target === 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
};
