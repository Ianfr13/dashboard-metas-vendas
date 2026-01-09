
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Filter, Download, ArrowRight, Users, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface ProductVariant {
    name: string;
    sales: number;
    revenue: number;
    sharePercent: number;
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
    products: ProductVariant[];
}

export default function FunnelPerformance({ startDate, endDate }: FunnelPerformanceProps) {
    const { user, loading: authLoading } = useAuth();
    const [data, setData] = useState<FunnelPerformanceMetrics[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFunnelId, setSelectedFunnelId] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<'compra' | 'leads'>('compra');

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

    // Get unique funnel IDs for selector based on selected Type
    const funnelIds = useMemo(() => {
        return Array.from(new Set(
            data
                .filter(r => (r.funnelType || 'compra') === selectedType)
                .map(r => r.funnelId)
                .filter(f => f && f !== '(not set)')
        ));
    }, [data, selectedType]);

    // Reset selected funnel when type changes if current selection invalid
    useEffect(() => {
        if (selectedFunnelId && !funnelIds.includes(selectedFunnelId)) {
            setSelectedFunnelId(funnelIds[0] || null);
        }
    }, [selectedType, funnelIds, selectedFunnelId]);

    // Filter data by selected funnel and aggregate by stage
    const stageData = useMemo((): StageMetrics[] => {
        if (!selectedFunnelId) return [];

        const funnelData = data.filter(d =>
            d.funnelId === selectedFunnelId &&
            (d.funnelType || 'compra') === selectedType
        );

        // Group by funnel stage with product breakdown
        const stageMap = new Map<string, {
            sessions: number,
            pageViews: number,
            addToCart: number,
            checkouts: number,
            leads: number,
            sales: number,
            revenue: number,
            productMap: Map<string, { sales: number, revenue: number }>
        }>();

        funnelData.forEach(item => {
            const stage = item.funnelStage || '(not set)'; // Ensure stage is not null/undefined
            if (!stageMap.has(stage)) {
                stageMap.set(stage, {
                    sessions: 0,
                    pageViews: 0,
                    addToCart: 0,
                    checkouts: 0,
                    leads: 0,
                    sales: 0,
                    revenue: 0,
                    productMap: new Map()
                });
            }
            const current = stageMap.get(stage)!;
            current.sessions += item.sessions;
            current.pageViews += item.pageViews || 0;
            current.addToCart += item.addToCart || 0;
            current.checkouts += item.checkouts || 0;
            current.leads += item.leads;
            current.sales += item.sales;
            current.revenue += item.revenue;

            // Aggregate products
            const productName = item.productName || '(not set)';
            if (productName !== '(not set)' && item.sales > 0) {
                if (!current.productMap.has(productName)) {
                    current.productMap.set(productName, { sales: 0, revenue: 0 });
                }
                const product = current.productMap.get(productName)!;
                product.sales += item.sales;
                product.revenue += item.revenue;
            }
        });

        // Define stage order
        const stageOrder = ['frontend', 'upsell-1', 'downsell-1', 'upsell-2', 'downsell-2', 'upsell-3', 'downsell-3'];

        // Convert to array and calculate rates
        const stages: StageMetrics[] = [];
        let previousSales = 0; // This variable is not used in the new takeRate logic, but kept for context if needed later.

        // Sort stages by predefined order
        const sortedStages = Array.from(stageMap.entries()).sort((a, b) => {
            const orderA = stageOrder.indexOf(a[0]);
            const orderB = stageOrder.indexOf(b[0]);
            if (orderA === -1 && orderB === -1) return a[0].localeCompare(b[0]);
            if (orderA === -1) return 1;
            if (orderB === -1) return -1;
            return orderA - orderB;
        });

        sortedStages.forEach(([stage, metrics]) => {
            const conversionRate = selectedType === 'leads'
                ? metrics.sessions > 0 ? (metrics.leads / metrics.sessions) * 100 : 0
                : metrics.sessions > 0 ? (metrics.sales / metrics.sessions) * 100 : 0;

            // For upsells/downsells, it's relative to previous stage typically,
            // but for simplicity here we keep logical flow or use absolute take rate of session
            // Logic: Upsell Take Rate = Sales / Main Frontend Sales ( APPROXIMATION )
            // Better: Sales / Unique Sessions of THIS stage
            const takeRate = selectedType === 'leads'
                ? conversionRate // Capture rate
                : metrics.sessions > 0 ? (metrics.sales / metrics.sessions) * 100 : 0;

            const products: ProductVariant[] = Array.from(metrics.productMap.entries())
                .map(([name, p]) => ({
                    name,
                    sales: p.sales,
                    revenue: p.revenue,
                    sharePercent: metrics.sales > 0 ? (p.sales / metrics.sales) * 100 : 0
                }))
                .sort((a, b) => b.sales - a.sales);

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
                takeRate,
                products
            });
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
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Performance por Funil (URL Tracking)</CardTitle>
                            <CardDescription>
                                Seletor de funis baseados nos parâmetros de URL
                            </CardDescription>
                        </div>
                        <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as 'compra' | 'leads')} className="w-[300px]">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="compra">Compra</TabsTrigger>
                                <TabsTrigger value="leads">Leads</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <label className="text-sm font-medium mb-2 block">
                                Selecionar Funil ({selectedType === 'compra' ? 'Vendas' : 'Captura'})
                            </label>
                            <Select
                                value={selectedFunnelId || ''}
                                onValueChange={setSelectedFunnelId}
                                disabled={funnelIds.length === 0}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={funnelIds.length === 0 ? "Nenhum funil encontrado" : "Selecione um funil"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {funnelIds.map(fid => (
                                        <SelectItem key={fid} value={fid}>{fid}</SelectItem>
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
                                    {selectedType === 'leads' ? 'Leads Totais' : 'Vendas Totais'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    {selectedType === 'leads' ? <Users className="h-5 w-5 text-green-500" /> : <ShoppingCart className="h-5 w-5 text-green-500" />}
                                    <span className="text-3xl font-bold">{selectedType === 'leads' ? totals.leads : totals.sales}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {selectedType === 'leads' ? 'Taxa de Conversão' : 'Receita Total'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    {selectedType === 'leads' ? <TrendingUp className="h-5 w-5 text-emerald-500" /> : <DollarSign className="h-5 w-5 text-emerald-500" />}
                                    <span className="text-3xl font-bold">
                                        {selectedType === 'leads'
                                            ? `${(totals.sessions > 0 ? (totals.leads / totals.sessions) * 100 : 0).toFixed(2)}%`
                                            : `R$ ${totals.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                        }
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {selectedType === 'compra' && (
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
                        )}
                    </div>

                    {/* Visual Funnel Flow - Branched Layout */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Fluxo do Funil</CardTitle>
                            <CardDescription>
                                Upsells na linha principal • Downsells ramificados abaixo
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {(() => {
                                // Separate upsells and downsells
                                const mainFlow = stageData.filter(s => s.stage === 'frontend' || s.stage.startsWith('upsell'));
                                const downsells = stageData.filter(s => s.stage.startsWith('downsell'));

                                return (
                                    <div className="space-y-8">
                                        {/* Main Flow Row (Frontend + Upsells) */}
                                        <div className="flex flex-wrap items-start justify-center gap-4">
                                            {mainFlow.map((stage, index) => {
                                                // Find corresponding downsell for this upsell
                                                const upsellNum = stage.stage.match(/upsell-(\d+)/)?.[1];
                                                const correspondingDownsell = upsellNum
                                                    ? downsells.find(d => d.stage === `downsell-${upsellNum}`)
                                                    : null;

                                                const displayValue = selectedType === 'leads' ? stage.leads : stage.sales;
                                                const displayLabel = selectedType === 'leads' ? 'Leads' : 'Vendas';

                                                return (
                                                    <div key={stage.stage} className="flex items-start gap-4">
                                                        {index > 0 && (
                                                            <ArrowRight className="h-6 w-6 text-muted-foreground mt-8 hidden md:block" />
                                                        )}
                                                        <div className="flex flex-col items-center">
                                                            {/* Main Stage Box */}
                                                            <div className="text-center">
                                                                <div className={`rounded-lg p-4 mb-2 min-w-[130px] ${stage.stage === 'frontend'
                                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                                    : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                                    }`}>
                                                                    <div className="flex justify-center mb-1">
                                                                        {selectedType === 'leads' ? <Users className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
                                                                    </div>
                                                                    <p className="text-xl font-bold">{displayValue}</p>
                                                                    <p className="text-xs font-medium capitalize">{stage.stage}</p>
                                                                    <p className="text-xs mt-1">
                                                                        {selectedType !== 'leads' && `R$ ${stage.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
                                                                    </p>
                                                                </div>
                                                                <Badge variant={stage.takeRate > 30 ? "default" : "secondary"} className="text-xs">
                                                                    {stage.stage === 'frontend' ? (selectedType === 'leads' ? 'Conv.' : 'CR') : 'Take'}: {stage.takeRate.toFixed(1)}%
                                                                </Badge>

                                                                {/* Product Variants Breakdown */}
                                                                {stage.products.length > 0 && selectedType !== 'leads' && (
                                                                    <div className="mt-3 w-full border-t pt-2 text-left">
                                                                        <p className="text-[10px] text-muted-foreground mb-1">Produtos:</p>
                                                                        {stage.products.map((product) => (
                                                                            <div key={product.name} className="flex justify-between text-[10px] py-0.5">
                                                                                <span className="truncate max-w-[80px]" title={product.name}>{product.name}</span>
                                                                                <span className="font-medium ml-2">{product.sales} ({product.sharePercent.toFixed(0)}%)</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Downsell Branch (below upsell) */}
                                                            {correspondingDownsell && selectedType !== 'leads' && (
                                                                <div className="mt-4 flex flex-col items-center">
                                                                    <div className="h-6 w-px bg-orange-300 dark:bg-orange-600" />
                                                                    <span className="text-xs text-muted-foreground mb-1">Não comprou</span>
                                                                    <div className="text-center">
                                                                        <div className="rounded-lg p-3 mb-2 min-w-[110px] bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                                                                            <p className="text-lg font-bold">{correspondingDownsell.sales}</p>
                                                                            <p className="text-xs font-medium capitalize">{correspondingDownsell.stage}</p>
                                                                            <p className="text-xs">
                                                                                R$ {correspondingDownsell.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                                                                            </p>
                                                                        </div>
                                                                        <Badge variant="outline" className="text-xs">
                                                                            Take: {correspondingDownsell.takeRate.toFixed(1)}%
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })()}
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
                                            {selectedType !== 'leads' && <TableHead className="text-right">Add Cart</TableHead>}
                                            {selectedType !== 'leads' && <TableHead className="text-right">Checkout</TableHead>}
                                            <TableHead className="text-right">{selectedType === 'leads' ? 'Leads' : 'Leads'}</TableHead>
                                            {selectedType !== 'leads' && <TableHead className="text-right">Vendas</TableHead>}
                                            {selectedType !== 'leads' && <TableHead className="text-right">Receita</TableHead>}
                                            <TableHead className="text-right">{selectedType === 'leads' ? 'Lead Rate' : 'Conv. %'}</TableHead>
                                            {selectedType !== 'leads' && <TableHead className="text-right">Take Rate</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {stageData.map((stage) => (
                                            <>
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
                                                    {selectedType !== 'leads' && <TableCell className="text-right">{stage.addToCart}</TableCell>}
                                                    {selectedType !== 'leads' && <TableCell className="text-right">{stage.checkouts}</TableCell>}
                                                    <TableCell className="text-right">{stage.leads}</TableCell>
                                                    {selectedType !== 'leads' && <TableCell className="text-right font-medium">{stage.sales}</TableCell>}
                                                    {selectedType !== 'leads' && (
                                                        <TableCell className="text-right">
                                                            R$ {stage.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </TableCell>
                                                    )}
                                                    <TableCell className="text-right">{stage.conversionRate.toFixed(2)}%</TableCell>
                                                    {selectedType !== 'leads' && (
                                                        <TableCell className="text-right">
                                                            <span className={stage.takeRate > 30 ? "text-green-600 font-bold" : ""}>
                                                                {stage.takeRate.toFixed(2)}%
                                                            </span>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                                {/* Product breakdown rows */}
                                                {stage.products.map((product) => (
                                                    <TableRow key={`${stage.stage}-${product.name}`} className="bg-muted/30">
                                                        <TableCell className="pl-8">
                                                            <span className="text-xs text-muted-foreground">↳ {product.name}</span>
                                                        </TableCell>
                                                        <TableCell className="text-right text-muted-foreground">-</TableCell>
                                                        {selectedType !== 'leads' && <TableCell className="text-right text-muted-foreground">-</TableCell>}
                                                        {selectedType !== 'leads' && <TableCell className="text-right text-muted-foreground">-</TableCell>}
                                                        <TableCell className="text-right text-muted-foreground">-</TableCell>
                                                        {selectedType !== 'leads' && <TableCell className="text-right text-xs">{product.sales}</TableCell>}
                                                        {selectedType !== 'leads' && (
                                                            <TableCell className="text-right text-xs">
                                                                R$ {product.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                            </TableCell>
                                                        )}
                                                        <TableCell className="text-right text-xs text-muted-foreground">-</TableCell>
                                                        {selectedType !== 'leads' && (
                                                            <TableCell className="text-right">
                                                                <Badge variant="outline" className="text-xs">
                                                                    {product.sharePercent.toFixed(1)}%
                                                                </Badge>
                                                            </TableCell>
                                                        )}
                                                    </TableRow>
                                                ))}
                                            </>
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
