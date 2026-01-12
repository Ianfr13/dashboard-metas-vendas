import React, { useEffect, useState } from 'react';
import { Activity, Clock, Server, Wifi } from 'lucide-react';

interface SpeedData {
    count: number;
    total_latency: number;
    min: number;
    max: number;
    last_latency: number;
    last_updated: number;
}

const SpeedMonitor: React.FC = () => {
    const [stats, setStats] = useState<Record<string, SpeedData>>({});
    const [loading, setLoading] = useState(true);
    const [lastFetch, setLastFetch] = useState<Date | null>(null);

    const fetchStats = async () => {
        try {
            // Usando a URL de produção do Worker
            const response = await fetch('https://ab-redirect.ferramentas-bce.workers.dev/admin/speed-stats');
            if (response.ok) {
                const data = await response.json();
                setStats(data);
                setLastFetch(new Date());
            }
        } catch (error) {
            console.error('Erro ao buscar stats:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 2000); // Polling a cada 2s
        return () => clearInterval(interval);
    }, []);

    const getHealthColor = (latency: number) => {
        if (latency < 200) return 'text-green-500';
        if (latency < 500) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getAvg = (s: SpeedData) => s.count > 0 ? Math.round(s.total_latency / s.count) : 0;

    return (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-400" />
                    <h2 className="text-xl font-bold text-white">Monitor de Velocidade (Real-Time)</h2>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Wifi className="w-3 h-3 animate-pulse text-green-500" />
                    <span>Atualizando via Cloudflare Edge</span>
                </div>
            </div>

            {loading && Object.keys(stats).length === 0 ? (
                <div className="text-center text-gray-400 py-4">Carregando dados do Edge...</div>
            ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(stats).map(([slug, data]) => (
                        <div key={slug} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50 hover:border-purple-500/30 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                                <span className="font-mono text-sm text-purple-300 bg-purple-900/20 px-2 py-1 rounded">
                                    /{slug}
                                </span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded bg-gray-800 ${getHealthColor(data.last_latency)}`}>
                                    {data.last_latency}ms (Live)
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="bg-gray-800 p-2 rounded">
                                    <div className="text-gray-500 text-xs mb-1">Média (Janela)</div>
                                    <div className={`font-bold ${getHealthColor(getAvg(data))}`}>
                                        {getAvg(data)}ms
                                    </div>
                                </div>
                                <div className="bg-gray-800 p-2 rounded">
                                    <div className="text-gray-500 text-xs mb-1">Amostras</div>
                                    <div className="text-white font-mono">{data.count}</div>
                                </div>
                            </div>

                            <div className="mt-2 text-[10px] text-gray-500 flex justify-between">
                                <span>Min: {data.min}ms</span>
                                <span>Max: {data.max}ms</span>
                            </div>
                        </div>
                    ))}

                    {Object.keys(stats).length === 0 && !loading && (
                        <div className="col-span-full text-center text-gray-500 py-8 italic">
                            Nenhum dado de acesso recente. Acesso uma página para iniciar o monitoramento.
                        </div>
                    )}
                </div>
            )}

            {lastFetch && (
                <div className="mt-4 text-right text-[10px] text-gray-600">
                    Última sincronização: {lastFetch.toLocaleTimeString()}
                </div>
            )}
        </div>
    );
};

export default SpeedMonitor;
