
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Filter, Download, ArrowRight, Users, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { gtmAnalyticsAPI, FunnelPerformanceMetrics } from "@/lib/edge-functions";
import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface FunnelPerformanceProps {
    startDate: Date;
    endDate: Date;
}

interface StageMetrics {
    stage: string;
    sessions: number;
    pageViews: number;
    addToCart: number;
    checkouts: number;
    leads: number;
    sales: number;
    revenue: number;
    conversionRate: number;
    takeRate: number;
}

export default function FunnelPerformance({ startDate, endDate }: FunnelPerformanceProps) {
    const { user, loading: authLoading } = useAuth();
    const [data, setData] = useState<FunnelPerformanceMetrics[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFunnelId, setSelectedFunnelId] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            if (authLoading || !user) return;

            try {
                setLoading(true);
                setError(null);
                const formattedStart = format(startDate, 'yyyy-MM-dd');
                const formattedEnd = format(endDate, 'yyyy-MM-dd');
                const result = await gtmAnalyticsAPI.getFunnelPerformance(formattedStart, formattedEnd);
                setData(result);

                // Auto-select first funnel if available
                const funnelIds = Array.from(new Set(result.map(r => r.funnelId).filter(f => f && f !== '(not set)')));
                if (funnelIds.length > 0 && !selectedFunnelId) {
                    setSelectedFunnelId(funnelIds[0]);
                }
            } catch (err) {
                console.error('Erro ao carregar performance do funil:', err);
                setError(err instanceof Error ? err.message : 'Erro desconhecido');
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [startDate, endDate, user, authLoading]);

    // Get unique funnel IDs for selector
    const funnelIds = useMemo(() => {
        return Array.from(new Set(data.map(r => r.funnelId).filter(f => f && f !== '(not set)')));
    }, [data]);

    // Filter data by selected funnel and aggregate by stage
    const stageData = useMemo((): StageMetrics[] => {
        if (!selectedFunnelId) return [];

        const funnelData = data.filter(d => d.funnelId === selectedFunnelId);

        // Group by funnel stage
        const stageMap = new Map<string, { sessions: number; pageViews: number; addToCart: number; checkouts: number; leads: number; sales: number; revenue: number }>();

        // Define stage order
        const stageOrder = ['frontend', 'upsell-1', 'downsell-1', 'upsell-2', 'downsell-2', 'upsell-3', 'downsell-3'];

        funnelData.forEach(item => {
            const stage = item.funnelStage || '(not set)';
            if (!stageMap.has(stage)) {
                stageMap.set(stage, { sessions: 0, pageViews: 0, addToCart: 0, checkouts: 0, leads: 0, sales: 0, revenue: 0 });
            }
            const current = stageMap.get(stage)!;
            current.sessions += item.sessions;
            current.pageViews += item.pageViews || 0;
            current.addToCart += item.addToCart || 0;
            current.checkouts += item.checkouts || 0;
            current.leads += item.leads;
            current.sales += item.sales;
            current.revenue += item.revenue;
        });

        // Convert to array and calculate rates
        const stages: StageMetrics[] = [];
        let previousSales = 0;

        // Sort stages by predefined order
        const sortedStages = Array.from(stageMap.entries()).sort((a, b) => {
            const orderA = stageOrder.indexOf(a[0]);
            const orderB = stageOrder.indexOf(b[0]);
            if (orderA === -1 && orderB === -1) return a[0].localeCompare(b[0]);
            if (orderA === -1) return 1;
            if (orderB === -1) return -1;
            return orderA - orderB;
        });

        sortedStages.forEach(([stage, metrics], index) => {
            const conversionRate = metrics.sessions > 0 ? (metrics.sales / metrics.sessions) * 100 : 0;
            const takeRate = index === 0
                ? conversionRate
                : (previousSales > 0 ? (metrics.sales / previousSales) * 100 : 0);

            stages.push({
                stage,
                sessions: metrics.sessions,
                pageViews: metrics.pageViews,
                addToCart: metrics.addToCart,
                checkouts: metrics.checkouts,
                leads: metrics.leads,
                sales: metrics.sales,
                revenue: metrics.revenue,
                conversionRate,
                takeRate
            });

            // For frontend, use sales as base for next stage
            if (stage === 'frontend') {
                previousSales = metrics.sales;
            }
        });

        return stages;
    }, [data, selectedFunnelId]);

    // Get funnel metadata from selected funnel
    const funnelMetadata = useMemo(() => {
        if (!selectedFunnelId) return null;
        const item = data.find(d => d.funnelId === selectedFunnelId);
        return item ? {
            funnelId: item.funnelId,
            funnelVersion: item.funnelVersion,
            pageVersion: item.pageVersion
        } : null;
    }, [data, selectedFunnelId]);

    // Calculate totals
    const totals = useMemo(() => {
        return stageData.reduce((acc, stage) => ({
            sessions: acc.sessions + stage.sessions,
            leads: acc.leads + stage.leads,
            sales: acc.sales + stage.sales,
            revenue: acc.revenue + stage.revenue
        }), { sessions: 0, leads: 0, sales: 0, revenue: 0 });
    }, [stageData]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <Card className="border-destructive">
                <CardContent className="pt-6">
                    <p className="text-destructive">Erro: {error}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Funnel Selector */}
            <Card>
                <CardHeader>
                    <CardTitle>Performance por Funil (URL Tracking)</CardTitle>
                    <CardDescription>
                        Selecione um funil para visualizar as métricas detalhadas por etapa
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                        <div className="w-full md:w-[300px]">
                            <Select
                                value={selectedFunnelId || ''}
                                onValueChange={(value) => setSelectedFunnelId(value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um Funnel ID" />
                                </SelectTrigger>
                                <SelectContent>
                                    {funnelIds.map((fid) => (
                                        <SelectItem key={fid} value={fid}>
                                            {fid}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {funnelMetadata && (
                            <div className="flex gap-2 flex-wrap">
                                <Badge variant="outline">Version: {funnelMetadata.funnelVersion}</Badge>
                                <Badge variant="outline">Page: {funnelMetadata.pageVersion}</Badge>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {selectedFunnelId && stageData.length > 0 && (
                <>
                    {/* Totals Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Sessões Totais
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-blue-500" />
                                    <span className="text-3xl font-bold">{totals.sessions}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Vendas Totais
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <ShoppingCart className="h-5 w-5 text-green-500" />
                                    <span className="text-3xl font-bold">{totals.sales}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Receita Total
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-emerald-500" />
                                    <span className="text-3xl font-bold">
                                        R$ {totals.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Ticket Médio
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-purple-500" />
                                    <span className="text-3xl font-bold">
                                        R$ {(totals.sales > 0 ? totals.revenue / totals.sales : 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Visual Funnel Flow */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Fluxo do Funil</CardTitle>
                            <CardDescription>Visualização das etapas e taxas de conversão</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col md:flex-row items-center justify-center gap-4 py-6 flex-wrap">
                                {stageData.map((stage, index) => (
                                    <div key={stage.stage} className="flex items-center gap-4">
                                        {index > 0 && (
                                            <ArrowRight className="h-6 w-6 text-muted-foreground hidden md:block" />
                                        )}
                                        <div className="text-center">
                                            <div className={`rounded-lg p-4 mb-2 min-w-[120px] ${stage.stage === 'frontend' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                stage.stage.startsWith('upsell') ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                                    stage.stage.startsWith('downsell') ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                                        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                                }`}>
                                                <ShoppingCart className="h-6 w-6 mx-auto mb-2" />
                                                <p className="text-2xl font-bold">{stage.sales}</p>
                                                <p className="text-sm font-medium capitalize">{stage.stage}</p>
                                                <p className="text-xs mt-1">
                                                    R$ {stage.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                            <Badge variant={stage.takeRate > 30 ? "default" : "secondary"} className="text-xs">
                                                {stage.stage === 'frontend' ? 'CR' : 'Take'}: {stage.takeRate.toFixed(1)}%
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Detailed Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalhamento por Etapa</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Etapa</TableHead>
                                            <TableHead className="text-right">PageViews</TableHead>
                                            <TableHead className="text-right">Add Cart</TableHead>
                                            <TableHead className="text-right">Checkout</TableHead>
                                            <TableHead className="text-right">Leads</TableHead>
                                            <TableHead className="text-right">Vendas</TableHead>
                                            <TableHead className="text-right">Receita</TableHead>
                                            <TableHead className="text-right">Conv. %</TableHead>
                                            <TableHead className="text-right">Take Rate</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {stageData.map((stage) => (
                                            <TableRow key={stage.stage}>
                                                <TableCell>
                                                    <Badge variant={
                                                        stage.stage === 'frontend' ? 'default' :
                                                            stage.stage.startsWith('upsell') ? 'secondary' :
                                                                'outline'
                                                    } className="capitalize">
                                                        {stage.stage}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">{stage.pageViews}</TableCell>
                                                <TableCell className="text-right">{stage.addToCart}</TableCell>
                                                <TableCell className="text-right">{stage.checkouts}</TableCell>
                                                <TableCell className="text-right">{stage.leads}</TableCell>
                                                <TableCell className="text-right font-medium">{stage.sales}</TableCell>
                                                <TableCell className="text-right">
                                                    R$ {stage.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell className="text-right">{stage.conversionRate.toFixed(2)}%</TableCell>
                                                <TableCell className="text-right">
                                                    <span className={stage.takeRate > 30 ? "text-green-600 font-bold" : ""}>
                                                        {stage.takeRate.toFixed(2)}%
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {selectedFunnelId && stageData.length === 0 && (
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        Nenhum dado encontrado para este funil no período selecionado.
                    </CardContent>
                </Card>
            )}

            {!selectedFunnelId && funnelIds.length === 0 && (
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        Nenhum funil rastreado encontrado. Certifique-se de que suas URLs contenham o parâmetro <code className="bg-muted px-1 rounded">fid=</code>.
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
