import { supabase } from './supabase';

/**
 * Helper para interagir com Supabase
 * 
 * Arquitetura Simplificada:
 * - Edge Function (gtm-event): Apenas salva eventos do GTM
 * - Frontend: Busca direto nas tabelas do Supabase
 * - Segurança: RLS (Row Level Security) garante acesso apenas aos dados do usuário
 */

const FUNCTIONS_URL = 'https://auvvrewlbpyymekonilv.supabase.co/functions/v1';

/**
 * Helper para obter headers com autenticação
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  
  return {
    'Content-Type': 'application/json',
    ...(session ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
  };
}

// ============================================
// API de Eventos GTM (Pública)
// ============================================

export const gtmAPI = {
  /**
   * Envia um evento do GTM
   * 
   * A Edge Function APENAS salva o evento na tabela gtm_events.
   * Não faz processamento complexo.
   */
  sendEvent: async (data: {
    event_name: string;
    event_data?: any;
    user_id?: string;
    session_id?: string;
    page_url?: string;
    referrer?: string;
  }) => {
    const response = await fetch(`${FUNCTIONS_URL}/gtm-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send event');
    }

    return response.json();
  },
};

// ============================================
// API do Dashboard (Busca Direto nas Tabelas)
// ============================================

export const dashboardAPI = {
  /**
   * Obtém dados completos do dashboard via edge function
   * Inclui: meta principal, sub-metas, métricas avançadas, vendas
   */
  getMetaPrincipal: async (month?: number, year?: number) => {
    // Get current session token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());

    const url = `${FUNCTIONS_URL}/get-dashboard-data${params.toString() ? '?' + params.toString() : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch dashboard data');
    }

    return response.json();
  },

  /**
   * Obtém todas as sub-metas de uma meta principal
   */
  getSubMetas: async (metaPrincipalId: number) => {
    const { data, error } = await supabase
      .from('sub_metas')
      .select('*')
      .eq('meta_principal_id', metaPrincipalId)
      .order('valor', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Obtém eventos do GTM (com filtros opcionais)
   */
  getGtmEvents: async (filters?: {
    event_name?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) => {
    let query = supabase
      .from('gtm_events')
      .select('*')
      .order('timestamp', { ascending: false });

    if (filters?.event_name) {
      query = query.eq('event_name', filters.event_name);
    }

    if (filters?.startDate) {
      query = query.gte('timestamp', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('timestamp', filters.endDate);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  /**
   * Calcula totais de vendas do mês a partir dos eventos GTM
   */
  calculateSalesTotals: async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    // Buscar todos os eventos de purchase do mês
    const { data: purchases, error } = await supabase
      .from('gtm_events')
      .select('*')
      .eq('event_name', 'purchase')
      .gte('timestamp', startOfMonth)
      .lte('timestamp', endOfMonth);

    if (error) throw error;

    // Calcular totais
    const totals = (purchases || []).reduce(
      (acc, event) => {
        const eventData = typeof event.event_data === 'string' 
          ? JSON.parse(event.event_data) 
          : event.event_data;

        const value = parseFloat(eventData?.value || 0);
        const productType = eventData?.product_type;

        acc.totalSales += 1;
        acc.totalRevenue += value;

        // Classificar por tipo
        if (productType === 'high-ticket' || value >= 5000) {
          acc.commercialSales += 1;
          acc.commercialRevenue += value;
        } else {
          acc.marketingSales += 1;
          acc.marketingRevenue += value;
        }

        return acc;
      },
      {
        totalSales: 0,
        totalRevenue: 0,
        marketingSales: 0,
        commercialSales: 0,
        marketingRevenue: 0,
        commercialRevenue: 0,
      }
    );

    return totals;
  },

  /**
   * Obtém vendas agrupadas por dia
   */
  getSalesByDay: async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const { data: purchases, error } = await supabase
      .from('gtm_events')
      .select('*')
      .eq('event_name', 'purchase')
      .gte('timestamp', startOfMonth)
      .lte('timestamp', endOfMonth)
      .order('timestamp', { ascending: true });

    if (error) throw error;

    // Agrupar por dia
    const salesByDay: Record<string, any> = {};

    (purchases || []).forEach((event) => {
      const date = new Date(event.timestamp).toISOString().split('T')[0];
      const eventData = typeof event.event_data === 'string' 
        ? JSON.parse(event.event_data) 
        : event.event_data;

      const value = parseFloat(eventData?.value || 0);
      const productType = eventData?.product_type;

      if (!salesByDay[date]) {
        salesByDay[date] = {
          date,
          totalSales: 0,
          totalRevenue: 0,
          marketingSales: 0,
          commercialSales: 0,
          marketingRevenue: 0,
          commercialRevenue: 0,
        };
      }

      salesByDay[date].totalSales += 1;
      salesByDay[date].totalRevenue += value;

      if (productType === 'high-ticket' || value >= 5000) {
        salesByDay[date].commercialSales += 1;
        salesByDay[date].commercialRevenue += value;
      } else {
        salesByDay[date].marketingSales += 1;
        salesByDay[date].marketingRevenue += value;
      }
    });

    return Object.values(salesByDay);
  },

  /**
   * Obtém todos os produtos ativos
   */
  getProducts: async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', 1)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Obtém todas as simulações ativas do usuário
   */
  getSimulations: async () => {
    const { data, error } = await supabase
      .from('simulation_params')
      .select('*')
      .eq('is_active', 1)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};

// ============================================
// API de Analytics do GTM (Edge Functions)
// ============================================

export interface FunnelMetrics {
  etapas: {
    pageViews: number;
    leads: number;
    checkouts: number;
    purchases: number;
  };
  conversao: {
    viewsParaLeads: number;
    leadsParaCheckout: number;
    checkoutParaVenda: number;
    endToEnd: number;
  };
  financeiro: {
    receitaTotal: number;
    ticketMedio: number;
  };
}

export interface EvolutionData {
  date: string;
  count: number;
}

export interface ProductMetricsGTM {
  produto: string;
  vendas: number;
  receita: number;
  ticketMedio: number;
}

export const gtmAnalyticsAPI = {
  /**
   * Obtém métricas do funil de conversão
   */
  getFunnelMetrics: async (startDate: string, endDate: string): Promise<FunnelMetrics> => {
    const response = await fetch(
      `${FUNCTIONS_URL}/gtm-analytics?action=funnel&start_date=${startDate}&end_date=${endDate}`,
      { method: 'GET', headers: await getAuthHeaders() }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch funnel metrics');
    }

    return response.json();
  },

  /**
   * Obtém dados de evolução temporal
   */
  getEvolutionChart: async (
    startDate: string,
    endDate: string,
    eventName: string,
    groupBy: 'hour' | 'day' | 'week'
  ): Promise<EvolutionData[]> => {
    const response = await fetch(
      `${FUNCTIONS_URL}/gtm-analytics?action=evolution&start_date=${startDate}&end_date=${endDate}&event_name=${eventName}&group_by=${groupBy}`,
      { method: 'GET', headers: await getAuthHeaders() }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch evolution data');
    }

    return response.json();
  },

  /**
   * Obtém métricas por produto
   */
  getProductMetrics: async (startDate: string, endDate: string): Promise<ProductMetricsGTM[]> => {
    const response = await fetch(
      `${FUNCTIONS_URL}/gtm-analytics?action=products&start_date=${startDate}&end_date=${endDate}`,
      { method: 'GET', headers: await getAuthHeaders() }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch product metrics');
    }

    return response.json();
  },
};

// ============================================
// API de Ranking do Time (Edge Function)
// ============================================

export interface TeamMember {
  id: string;
  name: string;
  email: string | null;
  role: string | null;
  sales_count: number;
  sales_value: number;
  gtm_sales_count: number;
  gtm_sales_value: number;
  crm_sales_count: number;
  crm_sales_value: number;
  discrepancy: number;
  meetings_count: number;
  appointments_count: number;
  conversion_rate: number;
}

export interface RankingResponse {
  best_closer: TeamMember | null;
  best_sdr: TeamMember | null;
  closers: TeamMember[];
  sdrs: TeamMember[];
  period: {
    start_date: string;
    end_date: string;
  };
  summary: {
    total_gtm_sales: number;
    total_crm_sales: number;
    total_discrepancy: number;
    match_percentage: number;
  };
}

export const teamRankingAPI = {
  /**
   * Obtém ranking do time (híbrido GTM + CRM)
   */
  getRanking: async (startDate: string, endDate: string): Promise<RankingResponse> => {
    const response = await fetch(`${FUNCTIONS_URL}/team-ranking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start_date: startDate, end_date: endDate }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch team ranking');
    }

    return response.json();
  },
};

// ============================================
// Exemplo de Uso no Frontend
// ============================================

/*
import { dashboardAPI } from '@/lib/edge-functions';

// 1. Carregar meta principal
const meta = await dashboardAPI.getMetaPrincipal();
console.log('Meta:', meta);

// 2. Carregar sub-metas
if (meta) {
  const subMetas = await dashboardAPI.getSubMetas(meta.id);
  console.log('Sub-metas:', subMetas);
}

// 3. Calcular totais de vendas
const totals = await dashboardAPI.calculateSalesTotals();
console.log('Vendas:', totals.totalSales);
console.log('Receita:', totals.totalRevenue);

// 4. Obter vendas por dia
const salesByDay = await dashboardAPI.getSalesByDay();
console.log('Vendas por dia:', salesByDay);

// 5. Obter produtos
const products = await dashboardAPI.getProducts();
console.log('Produtos:', products);

// 6. Obter eventos GTM (últimos 100)
const events = await dashboardAPI.getGtmEvents({ limit: 100 });
console.log('Eventos:', events);
*/
