import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, RefreshCw } from "lucide-react";
import { facebookAdsAPI, FacebookMetricsResponse } from "@/lib/edge-functions";
import MetricSelector from "./MetricSelector";
import FacebookAdsTable from "./FacebookAdsTable";
import { DEFAULT_METRICS } from "@/lib/facebook-metrics";

interface FacebookAdsDashboardProps {
    startDate: Date;
    endDate: Date;
}

const STORAGE_KEY = 'fb-metrics-preferences';

export default function FacebookAdsDashboard({ startDate, endDate }: FacebookAdsDashboardProps) {
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [metrics, setMetrics] = useState<FacebookMetricsResponse | null>(null);
    const [selectedAccount, setSelectedAccount] = useState<string>("all");
    const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
    const [selectedMetrics, setSelectedMetrics] = useState<string[]>(DEFAULT_METRICS);
    const [activeTab, setActiveTab] = useState<'campaigns' | 'adsets' | 'ads'>('campaigns');

    // Load metric preferences from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const { selectedMetrics: savedMetrics } = JSON.parse(saved);
                if (Array.isArray(savedMetrics) && savedMetrics.length > 0) {
                    setSelectedMetrics(savedMetrics);
                }
            } catch (e) {
                console.error('Failed to load metric preferences:', e);
            }
        }
    }, []);

    // Save metric preferences to localStorage
    useEffect(() => {
        if (selectedMetrics.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                selectedMetrics,
                lastUpdated: new Date().toISOString()
            }));
        }
    }, [selectedMetrics]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            const startStr = startDate.toISOString().split('T')[0];
            const endStr = endDate.toISOString().split('T')[0];

            const data = await facebookAdsAPI.getMetrics(
                startStr,
                endStr,
                selectedAccount !== "all" ? selectedAccount : undefined
            );
            setMetrics(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar métricas';
            console.error('Erro ao carregar métricas do Facebook:', errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const loadAccounts = async () => {
        try {
            const accs = await facebookAdsAPI.listAccounts();
            if (accs && accs.length > 0) {
                setAccounts(accs.map(a => ({ id: a.id, name: a.name })));
            }
        } catch (err) {
            console.error('Erro ao carregar contas:', err);
        }
    };

    useEffect(() => {
        loadAccounts();
    }, []);

    const handleSync = async () => {
        try {
            setSyncing(true);
            const startStr = startDate.toISOString().split('T')[0];
            const endStr = endDate.toISOString().split('T')[0];

            await facebookAdsAPI.syncData(startStr, endStr);
            await loadData();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao sincronizar';
            console.error('Erro ao sincronizar Facebook:', errorMessage);
            setError(errorMessage);
        } finally {
            setSyncing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [startDate, endDate, selectedAccount]);

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-destructive font-semibold mb-2">Erro ao carregar métricas do Facebook</p>
                    <p className="text-sm text-muted-foreground mb-4">{error}</p>
                    <Button onClick={handleSync} disabled={syncing}>
                        {syncing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                        Sincronizar Dados
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Performance Detalhada</CardTitle>
                        <CardDescription>Métricas por campanha, conjunto de anúncios e anúncios</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Todas as contas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as contas</SelectItem>
                                {accounts.map(acc => (
                                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
                            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        </Button>
                        <MetricSelector selectedMetrics={selectedMetrics} onChange={setSelectedMetrics} />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="campaigns">
                            Campanhas ({metrics?.byCampaign?.length || 0})
                        </TabsTrigger>
                        <TabsTrigger value="adsets">
                            Conjuntos ({metrics?.byAdSet?.length || 0})
                        </TabsTrigger>
                        <TabsTrigger value="ads">
                            Anúncios ({metrics?.byAd?.length || 0})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="campaigns" className="mt-0">
                        <FacebookAdsTable
                            data={metrics?.byCampaign || []}
                            selectedMetrics={selectedMetrics}
                            level="campaign"
                        />
                    </TabsContent>

                    <TabsContent value="adsets" className="mt-0">
                        <FacebookAdsTable
                            data={metrics?.byAdSet || []}
                            selectedMetrics={selectedMetrics}
                            level="adset"
                        />
                    </TabsContent>

                    <TabsContent value="ads" className="mt-0">
                        <FacebookAdsTable
                            data={metrics?.byAd || []}
                            selectedMetrics={selectedMetrics}
                            level="ad"
                        />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
