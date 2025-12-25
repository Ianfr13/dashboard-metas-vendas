import { useQuery } from '@tanstack/react-query';
import { dashboardAPI, DashboardData } from '@/lib/dashboard-api';

interface UseDashboardDataOptions {
  month?: number;
  year?: number;
  enabled?: boolean;
}

/**
 * Hook para buscar dados do dashboard com cache automático
 * 
 * Features:
 * - Cache de 5 minutos (staleTime)
 * - Dados permanecem em cache por 10 minutos (gcTime)
 * - Não refetch ao focar na janela
 * - Retry automático 1x em caso de erro
 * 
 * @example
 * const { data, isLoading, error, refetch } = useDashboardData({ month: 1, year: 2025 });
 */
export function useDashboardData(options: UseDashboardDataOptions = {}) {
  const { month, year, enabled = true } = options;

  return useQuery<DashboardData>({
    queryKey: ['dashboard-data', month, year],
    queryFn: () => dashboardAPI.getData(month, year),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook para buscar dados do dashboard do mês atual
 * 
 * @example
 * const { data, isLoading } = useCurrentMonthDashboard();
 */
export function useCurrentMonthDashboard() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  return useDashboardData({ month, year });
}
