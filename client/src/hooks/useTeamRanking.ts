import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface TeamMember {
  id: string;
  name: string;
  email: string | null;
  role: string | null;
  sales_count: number;
  sales_value: number;
  meetings_count: number;
  appointments_count: number;
  conversion_rate: number;
}

interface RankingData {
  best_closer: TeamMember | null;
  best_sdr: TeamMember | null;
  closers: TeamMember[];
  sdrs: TeamMember[];
  period: {
    start_date: string;
    end_date: string;
  };
}

interface UseTeamRankingOptions {
  start_date?: string;
  end_date?: string;
  enabled?: boolean;
}

/**
 * Hook para buscar ranking do time comercial
 * 
 * Features:
 * - Cache de 5 minutos (staleTime)
 * - Dados permanecem em cache por 10 minutos (gcTime)
 * - Não refetch ao focar na janela
 * - Retry automático 1x em caso de erro
 * 
 * @example
 * const { data, isLoading, error, refetch } = useTeamRanking({ 
 *   start_date: '2024-01-01',
 *   end_date: '2024-01-31'
 * });
 */
export function useTeamRanking(options: UseTeamRankingOptions = {}) {
  const { start_date, end_date, enabled = true } = options;

  return useQuery<RankingData>({
    queryKey: ['team-ranking', start_date, end_date],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('team-ranking', {
        body: { start_date, end_date }
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook para buscar ranking dos últimos 30 dias
 * 
 * @example
 * const { data, isLoading } = useLast30DaysRanking();
 */
export function useLast30DaysRanking() {
  const end_date = new Date().toISOString();
  const start_date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  return useTeamRanking({ start_date, end_date });
}

/**
 * Hook para buscar ranking do mês atual
 * 
 * @example
 * const { data, isLoading } = useCurrentMonthRanking();
 */
export function useCurrentMonthRanking() {
  const now = new Date();
  const start_date = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const end_date = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  return useTeamRanking({ start_date, end_date });
}
