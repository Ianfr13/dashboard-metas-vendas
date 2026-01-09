import { useQuery } from '@tanstack/react-query';
import { gtmAnalyticsAPI, vturbAnalyticsAPI } from '@/lib/edge-functions';
import { startOfDay, endOfDay } from 'date-fns';

export interface UseMetricsParams {
    startDate: Date;
    endDate: Date;
    selectedEvent?: string;
    groupBy?: 'day' | 'week' | 'hour';
    enabled?: boolean;
}

// Helper to format dates consistently
const getIsoDates = (start: Date, end: Date) => ({
    startIso: startOfDay(start).toISOString(),
    endIso: endOfDay(end).toISOString(),
});

export function useFunnelMetrics({ startDate, endDate, enabled = true }: UseMetricsParams) {
    const { startIso, endIso } = getIsoDates(startDate, endDate);
    return useQuery({
        queryKey: ['metrics', 'funnel', startIso, endIso],
        queryFn: () => gtmAnalyticsAPI.getFunnelMetrics(startIso, endIso),
        enabled,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

export function useEvolutionMetrics({ startDate, endDate, selectedEvent = 'purchase', groupBy = 'day', enabled = true }: UseMetricsParams) {
    const { startIso, endIso } = getIsoDates(startDate, endDate);
    return useQuery({
        queryKey: ['metrics', 'evolution', startIso, endIso, selectedEvent, groupBy],
        queryFn: () => gtmAnalyticsAPI.getEvolutionChart(startIso, endIso, selectedEvent, groupBy),
        enabled,
        staleTime: 5 * 60 * 1000,
    });
}

export function useProductMetrics({ startDate, endDate, enabled = true }: UseMetricsParams) {
    const { startIso, endIso } = getIsoDates(startDate, endDate);
    return useQuery({
        queryKey: ['metrics', 'products', startIso, endIso],
        queryFn: () => gtmAnalyticsAPI.getProductMetrics(startIso, endIso),
        enabled,
        staleTime: 5 * 60 * 1000,
    });
}

export function useTrafficMetrics({ startDate, endDate, enabled = true }: UseMetricsParams) {
    const { startIso, endIso } = getIsoDates(startDate, endDate);
    return useQuery({
        queryKey: ['metrics', 'traffic', startIso, endIso],
        queryFn: () => gtmAnalyticsAPI.getTrafficSources(startIso, endIso),
        enabled,
        staleTime: 5 * 60 * 1000,
    });
}

export function useCreativeMetrics({ startDate, endDate, enabled = true }: UseMetricsParams) {
    const { startIso, endIso } = getIsoDates(startDate, endDate);
    return useQuery({
        queryKey: ['metrics', 'creatives', startIso, endIso],
        queryFn: () => gtmAnalyticsAPI.getCreativeRanking(startIso, endIso),
        enabled,
        staleTime: 5 * 60 * 1000,
    });
}

export function usePlacementMetrics({ startDate, endDate, enabled = true }: UseMetricsParams) {
    const { startIso, endIso } = getIsoDates(startDate, endDate);
    return useQuery({
        queryKey: ['metrics', 'placements', startIso, endIso],
        queryFn: () => gtmAnalyticsAPI.getPlacementRanking(startIso, endIso),
        enabled,
        staleTime: 5 * 60 * 1000,
    });
}

export function useVturbMetrics({ startDate, endDate, enabled = true }: UseMetricsParams) {
    const { startIso, endIso } = getIsoDates(startDate, endDate);
    return useQuery({
        queryKey: ['metrics', 'vturb', startIso, endIso],
        queryFn: async () => {
            try {
                const stats = await vturbAnalyticsAPI.getPlayerStats(startIso, endIso);

                if (Array.isArray(stats)) {
                    // Filter out inactive players
                    const validStats = stats.filter((item: any) => {
                        const v = item.views || item.viewed || 0;
                        return v > 0;
                    });

                    return validStats.map((item: any) => ({
                        id: item.id || item.player_id || '',
                        name: item.name || item.player_name || 'VSL',
                        started: item.plays || item.started || 0,
                        finished: item.finishes || item.finished || 0,
                        viewed: item.views || item.viewed || 0,
                        unique_views: item.unique_views || 0,
                        unique_plays: item.unique_plays || 0,
                        duration: item.duration || 0,
                        pitch_time: item.pitch_time || 0,
                        lead_time: item.lead_time || 0
                    }));
                }
                return [];
            } catch (error) {
                console.warn('Vturb fetch failed', error);
                return []; // Non-critical fallback
            }
        },
        enabled,
        staleTime: 5 * 60 * 1000,
    });
}

// Hook for individual VSL engagement/retention data with caching
export interface UseVturbEngagementParams {
    playerId: string;
    startDate: Date;
    endDate: Date;
    duration: number;
    enabled?: boolean;
}

export function useVturbEngagement({ playerId, startDate, endDate, duration, enabled = true }: UseVturbEngagementParams) {
    const { startIso, endIso } = getIsoDates(startDate, endDate);
    const startStr = startIso.split('T')[0];
    const endStr = endIso.split('T')[0];

    return useQuery({
        queryKey: ['vturb', 'engagement', playerId, startStr, endStr, duration],
        queryFn: () => vturbAnalyticsAPI.getEngagement(playerId, startStr, endStr, duration),
        enabled: enabled && !!playerId,
        staleTime: 10 * 60 * 1000, // 10 minutes - retention data changes slowly
        gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
        refetchOnWindowFocus: false, // Don't refetch on tab focus
        placeholderData: (previousData) => previousData, // Keep showing previous data while loading new
    });
}

export function useFacebookMetrics({ startDate, endDate, enabled = true }: UseMetricsParams) {
    const { startIso, endIso } = getIsoDates(startDate, endDate);
    return useQuery({
        queryKey: ['metrics', 'facebook', startIso, endIso],
        queryFn: async () => {
            // Check if Facebook data exists first before trying full load?
            // Actually gtmAnalyticsAPI.getFacebookMetrics is what we need
            // But looking at Metricas.tsx, it wasn't fetching this?
            // Ah, user mentioned "Facebook Ads tab".
            // Let's assume we implement it if needed, but for now stick to what Metricas.tsx had
            return null;
        },
        enabled: false, // Disabled for now as it wasn't in the main fetch
    });
}

/**
 * Hook para buscar múltiplas métricas em uma única requisição
 * Otimização: Reduz de 7 requests para 1 (economia de Edge Function invocations)
 */
export interface UseBatchMetricsParams {
    startDate: Date;
    endDate: Date;
    actions?: string[];
    enabled?: boolean;
}

export function useBatchMetrics({
    startDate,
    endDate,
    actions = ['funnel', 'products', 'traffic_sources', 'creatives', 'placements', 'funnel_performance'],
    enabled = true
}: UseBatchMetricsParams) {
    const { startIso, endIso } = getIsoDates(startDate, endDate);
    return useQuery({
        queryKey: ['metrics', 'batch', startIso, endIso, actions.join(',')],
        queryFn: () => gtmAnalyticsAPI.getBatchMetrics(startIso, endIso, actions),
        enabled,
        staleTime: 15 * 60 * 1000, // 15 minutes - longer cache to reduce requests
        gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
        refetchOnWindowFocus: false, // Don't refetch on tab focus
    });
}

