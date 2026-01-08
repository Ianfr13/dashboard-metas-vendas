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

  // DEBUG: Log session status
  console.log('[edge-functions] Session status:', {
    hasSession: !!session,
    hasToken: !!session?.access_token,
    tokenPreview: session?.access_token ? `${session.access_token.substring(0, 20)}...` : 'NO TOKEN',
    user: session?.user?.email
  });

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
    viewItem: number;
    addToWishlist: number;
    addToCart: number;
    viewCart: number;
    beginCheckout: number;
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
  dropOff: {
    pageViewToViewItem: number;
    viewItemToAddToCart: number;
    addToCartToCheckout: number;
    checkoutToPurchase: number;
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

export interface TrafficSourceMetrics {
  source: string;
  medium: string;
  sessions: number;
  leads: number;
  sales: number;
  revenue: number;
  conversionRate: number;
}

export interface CreativeMetrics {
  creativeId: string;
  adName: string;
  source: string;
  medium: string;
  pageViews: number;
  leads: number;
  addToWishlist: number;
  addToCart: number;
  checkouts: number;
  sales: number;
  revenue: number;
  conversionRate: number;
  bestPlacement: string;
}

export interface PlacementMetrics {
  placement: string;
  source: string;
  pageViews: number;
  sales: number;
  revenue: number;
  conversionRate: number;
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

  /**
   * Obtém métricas por fonte de tráfego
   */
  getTrafficSources: async (startDate: string, endDate: string): Promise<TrafficSourceMetrics[]> => {
    const response = await fetch(
      `${FUNCTIONS_URL}/gtm-analytics?action=traffic_sources&start_date=${startDate}&end_date=${endDate}`,
      { method: 'GET', headers: await getAuthHeaders() }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch traffic sources');
    }

    return response.json();
  },

  /**
   * Obtém ranking de criativos
   */
  getCreativeRanking: async (startDate: string, endDate: string): Promise<CreativeMetrics[]> => {
    const response = await fetch(
      `${FUNCTIONS_URL}/gtm-analytics?action=creatives&start_date=${startDate}&end_date=${endDate}`,
      { method: 'GET', headers: await getAuthHeaders() }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch creative ranking');
    }

    return response.json();
  },

  /**
   * Obtém ranking de posicionamentos
   */
  getPlacementRanking: async (startDate: string, endDate: string): Promise<PlacementMetrics[]> => {
    const response = await fetch(
      `${FUNCTIONS_URL}/gtm-analytics?action=placements&start_date=${startDate}&end_date=${endDate}`,
      { method: 'GET', headers: await getAuthHeaders() }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch placement ranking');
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

// ============================================
// API de Vturb Analytics (Edge Function)
// ============================================

export interface VturbPlayer {
  id: string;
  name: string;
  started: number;
  finished: number;
  viewed: number;
  playRate: number;
  completionRate: number;
}

export interface VturbPlayerStats {
  player_id: string;
  player_name: string;
  started: number;
  finished: number;
  viewed: number;
  pitch_time?: number;
  lead_time?: number;
}

export const vturbAnalyticsAPI = {
  /**
   * Lista todos os players (VSLs) da conta
   */
  listPlayers: async (startDate: string, endDate: string): Promise<any[]> => {
    const response = await fetch(
      `${FUNCTIONS_URL}/vturb-analytics?action=list-players&start_date=${startDate}&end_date=${endDate}`,
      { method: 'GET', headers: await getAuthHeaders() }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch Vturb players');
    }

    return response.json();
  },

  /**
   * Obtém estatísticas de eventos por player
   */
  getPlayerStats: async (startDate: string, endDate: string): Promise<VturbPlayerStats[]> => {
    const response = await fetch(
      `${FUNCTIONS_URL}/vturb-analytics?action=player-stats&start_date=${startDate}&end_date=${endDate}`,
      { method: 'GET', headers: await getAuthHeaders() }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch Vturb player stats');
    }

    return response.json();
  },

  /**
   * Obtém estatísticas de sessão de um player específico
   */
  getSessionStats: async (playerId: string, startDate: string, endDate: string): Promise<any> => {
    const response = await fetch(
      `${FUNCTIONS_URL}/vturb-analytics?action=session-stats&player_id=${playerId}&start_date=${startDate}&end_date=${endDate}`,
      { method: 'GET', headers: await getAuthHeaders() }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch Vturb session stats');
    }

    return response.json();
  },

  /**
   * Obtém dados de retenção/engajamento por minuto de um player
   */
  getEngagement: async (playerId: string, startDate: string, endDate: string, duration?: number): Promise<{ minute: number; retention: number; viewers: number }[]> => {
    const durationParam = duration || 1800; // Default 30 min
    const response = await fetch(
      `${FUNCTIONS_URL}/vturb-analytics?action=engagement&player_id=${playerId}&start_date=${startDate}&end_date=${endDate}&duration=${durationParam}`,
      { method: 'GET', headers: await getAuthHeaders() }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch Vturb engagement data');
    }

    return response.json();
  },

  /**
   * Atualiza configurações de um player (pitch e lead time)
   */
  updatePlayerSettings: async (id: string, settings: { pitch_time: number; lead_time: number }): Promise<void> => {
    const response = await fetch(`${FUNCTIONS_URL}/vturb-analytics?action=update-settings`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ id, ...settings }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update player settings');
    }
  },
};

// ============================================
// API de Facebook Ads (Edge Functions)
// ============================================

export interface FacebookAccountMetrics {
  id: string;
  name: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  purchases: number;
  purchaseValue: number;
  cpc: number;
  cpm: number;
  ctr: number;
  costPerLead: number;
  costPerPurchase: number;
  roas: number;
}

export interface FacebookCampaignMetrics {
  id: string;
  accountId: string;
  name: string;
  status: string;
  objective: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  purchases: number;
  purchaseValue: number;
  cpc: number;
  cpm: number;
  ctr: number;
  costPerLead: number;
  costPerPurchase: number;
  roas: number;
}

export interface FacebookAdSetMetrics {
  id: string;
  campaignId: string;
  name: string;
  status: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  purchases: number;
  cpc: number;
  ctr: number;
  costPerLead: number;
}

export interface FacebookAdMetrics {
  id: string;
  adsetId: string;
  campaignId: string;
  name: string;
  status: string;
  creativeThumbnail: string | null;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  purchases: number;
  cpc: number;
  ctr: number;
  costPerLead: number;
}

export interface FacebookDailyMetrics {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  purchases: number;
  purchaseValue: number;
}

export interface FacebookMetricsResponse {
  summary: {
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    totalReach: number;
    totalLeads: number;
    totalPurchases: number;
    totalPurchaseValue: number;
    avgCpc: number;
    avgCpm: number;
    avgCtr: number;
    avgCostPerLead: number;
    avgCostPerPurchase: number;
    roas: number;
  };
  byAccount: FacebookAccountMetrics[];
  byCampaign: FacebookCampaignMetrics[];
  byAdSet: FacebookAdSetMetrics[];
  byAd: FacebookAdMetrics[];
  evolution: FacebookDailyMetrics[];
}

export interface FacebookSyncResult {
  success: boolean;
  synced: {
    accounts: number;
    campaigns: number;
    adsets: number;
    ads: number;
    insights: number;
  };
  period: {
    start_date: string;
    end_date: string;
  };
}

export const facebookAdsAPI = {
  /**
   * Obtém métricas agregadas do Facebook Ads
   */
  getMetrics: async (
    startDate: string,
    endDate: string,
    accountId?: string,
    campaignId?: string
  ): Promise<FacebookMetricsResponse> => {
    let url = `${FUNCTIONS_URL}/gtm-analytics?action=facebook&start_date=${startDate}&end_date=${endDate}`;
    if (accountId) url += `&account_id=${accountId}`;
    if (campaignId) url += `&campaign_id=${campaignId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch Facebook metrics');
    }

    return response.json();
  },

  /**
   * Sincroniza dados do Facebook Ads API para o banco de dados
   */
  syncData: async (
    startDate: string,
    endDate: string,
    accountId?: string
  ): Promise<FacebookSyncResult> => {
    let url = `${FUNCTIONS_URL}/facebook-sync?action=sync&start_date=${startDate}&end_date=${endDate}`;
    if (accountId) url += `&account_id=${accountId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to sync Facebook data');
    }

    return response.json();
  },

  /**
   */
  listAccounts: async (): Promise<{ id: string; name: string; currency: string; active: boolean }[]> => {
    // Agora busca do banco de dados via gtm-analytics para performance e consistência
    const response = await fetch(`${FUNCTIONS_URL}/gtm-analytics?action=fb-accounts&t=${Date.now()}`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch Facebook accounts');
    }

    return response.json();
  },

  /**
   * Lista todas as campanhas de uma conta
   */
  listCampaigns: async (accountId: string): Promise<{
    id: string;
    name: string;
    status: string;
    objective: string;
  }[]> => {
    const response = await fetch(
      `${FUNCTIONS_URL}/facebook-sync?action=campaigns&account_id=${accountId}`,
      { method: 'GET', headers: await getAuthHeaders() }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch Facebook campaigns');
    }

    return response.json();
  },

  /**
   * Lista todos os conjuntos de anúncios de uma conta
   */
  listAdSets: async (accountId: string): Promise<{
    id: string;
    campaign_id: string;
    name: string;
    status: string;
  }[]> => {
    const response = await fetch(
      `${FUNCTIONS_URL}/facebook-sync?action=adsets&account_id=${accountId}`,
      { method: 'GET', headers: await getAuthHeaders() }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch Facebook ad sets');
    }

    return response.json();
  },

  /**
   * Lista todos os anúncios de uma conta
   */
  listAds: async (accountId: string): Promise<{
    id: string;
    adset_id: string;
    campaign_id: string;
    name: string;
    status: string;
  }[]> => {
    const response = await fetch(
      `${FUNCTIONS_URL}/facebook-sync?action=ads&account_id=${accountId}`,
      { method: 'GET', headers: await getAuthHeaders() }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch Facebook ads');
    }

    return response.json();
  },
};
