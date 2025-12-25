import { supabase } from './supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://auvvrewlbpyymekonilv.supabase.co';

export interface DashboardData {
  meta: {
    id: number;
    mes: number;
    ano: number;
    valor_meta: number;
    valor_atual: number;
    active: boolean;
  } | null;
  subMetas: Array<{
    id: number;
    meta_id: number;
    nome: string;
    valor_meta: number;
    ordem: number;
    atingida: boolean;
  }>;
  totals: {
    sales: number;
    revenue: number;
    progress: number;
  };
  salesByDay: Record<string, { sales: number; revenue: number }>;
  products: Array<{
    id: number;
    name: string;
    price: number;
    active: boolean;
  }>;
  period: {
    month: number;
    year: number;
    startDate: string;
    endDate: string;
  };
}

export const dashboardAPI = {
  /**
   * Get aggregated dashboard data for a specific month/year
   */
  async getData(month?: number, year?: number): Promise<DashboardData> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('User not authenticated');
    }

    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());

    const url = `${SUPABASE_URL}/functions/v1/get-dashboard-data?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch dashboard data');
    }

    return await response.json();
  },
};
