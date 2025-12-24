import { SimulationParams, CalculatedMetrics } from './types';

/**
 * Calculadora de Métricas para Dashboard de Vendas
 * Calcula todas as métricas primárias baseadas em vendas alvo e parâmetros de simulação
 */

export class MetricsCalculator {
  private params: SimulationParams;

  constructor(params: SimulationParams) {
    this.params = params;
  }

  /**
   * Calcula métricas para Marketing Direto (VSL/TSL)
   */
  calculateMarketingMetrics(targetSales: number): CalculatedMetrics {
    // Conversão efetiva = VSL Conv × Checkout Conv
    const effectiveConversionRate = (this.params.vslConversionRate / 100) * (this.params.checkoutConversionRate / 100);
    
    // Views necessárias na VSL
    const requiredViews = Math.ceil(targetSales / effectiveConversionRate);
    
    // Leads = Views × CTR
    const requiredLeads = Math.ceil(requiredViews * (this.params.avgCTR / 100));
    
    // Clicks necessários (assumindo que leads = clicks em landing page)
    const requiredClicks = requiredLeads;
    
    // Investimento em tráfego
    const trafficInvestment = targetSales * this.params.targetCPA;
    
    // CPL e CPA reais
    const actualCPL = requiredLeads > 0 ? trafficInvestment / requiredLeads : 0;
    const actualCPA = targetSales > 0 ? trafficInvestment / targetSales : 0;
    
    // Breakdown de vendas (front + upsell)
    const frontSales = targetSales;
    const upsellSales = Math.ceil(targetSales * (this.params.upsellConversionRate / 100));
    const totalSales = frontSales + upsellSales;
    
    // Receita breakdown
    const frontRevenue = frontSales * this.params.frontTicket;
    const upsellRevenue = upsellSales * this.params.upsellTicket;
    const totalRevenue = frontRevenue + upsellRevenue;
    
    // Receita esperada com ticket médio
    const expectedRevenue = targetSales * this.params.avgTicket;
    
    // ROI e ROAS
    const roi = trafficInvestment > 0 ? ((expectedRevenue - trafficInvestment) / trafficInvestment) * 100 : 0;
    const roas = trafficInvestment > 0 ? expectedRevenue / trafficInvestment : 0;
    
    return {
      requiredViews,
      requiredLeads,
      requiredClicks,
      trafficInvestment,
      totalInvestment: trafficInvestment,
      expectedRevenue,
      actualCPA,
      actualCPL,
      roi,
      roas,
      frontSales,
      upsellSales,
      totalSales,
      frontRevenue,
      upsellRevenue,
      totalRevenue,
    };
  }

  /**
   * Calcula métricas para Time Comercial
   */
  calculateCommercialMetrics(targetSales: number, workingDays: number): CalculatedMetrics {
    // Agendamentos necessários
    const requiredMeetings = Math.ceil(targetSales / (this.params.sdrConversionRate / 100));
    
    // Capacidade do time
    const teamCapacity = this.params.sdrCount * this.params.sdrDailyMeetings * workingDays;
    
    // Investimento (assumindo custo de operação do time)
    // Simplificado: sem custo de tráfego para comercial (leads vêm de outras fontes)
    const trafficInvestment = 0;
    
    // Receita esperada (mix de produtos)
    // Distribuição: 60% em 25k, 20% em 15k, 15% em 5k, 5% em 60k
    const expectedRevenue = targetSales * 20000; // Ticket médio aproximado
    
    return {
      requiredViews: 0,
      requiredLeads: requiredMeetings,
      requiredClicks: 0,
      trafficInvestment,
      totalInvestment: trafficInvestment,
      expectedRevenue,
      actualCPA: 0,
      actualCPL: 0,
      roi: 0,
      roas: 0,
      frontSales: targetSales,
      upsellSales: 0,
      totalSales: targetSales,
      frontRevenue: expectedRevenue,
      upsellRevenue: 0,
      totalRevenue: expectedRevenue,
    };
  }

  /**
   * Calcula métricas diárias
   */
  calculateDailyMetrics(dailySales: number): CalculatedMetrics {
    return this.calculateMarketingMetrics(dailySales);
  }

  /**
   * Calcula métricas semanais
   */
  calculateWeeklyMetrics(weeklySales: number): CalculatedMetrics {
    return this.calculateMarketingMetrics(weeklySales);
  }

  /**
   * Calcula métricas mensais
   */
  calculateMonthlyMetrics(monthlySales: number): CalculatedMetrics {
    return this.calculateMarketingMetrics(monthlySales);
  }

  /**
   * Atualiza parâmetros de simulação
   */
  updateParams(newParams: Partial<SimulationParams>): void {
    this.params = { ...this.params, ...newParams };
  }

  /**
   * Retorna parâmetros atuais
   */
  getParams(): SimulationParams {
    return { ...this.params };
  }
}

/**
 * Formata número como moeda brasileira
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Formata número com separadores
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

/**
 * Formata percentual
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Formata multiplicador (ROAS)
 */
export function formatMultiplier(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}x`;
}
