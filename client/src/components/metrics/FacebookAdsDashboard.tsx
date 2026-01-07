import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, RefreshCw, TrendingUp, TrendingDown, DollarSign, Eye, MousePointer, Users, ShoppingCart } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { facebookAdsAPI, FacebookMetricsResponse, FacebookCampaignMetrics } from "@/lib/edge-functions";

interface FacebookAdsDashboardProps {
    startDate: Date;
    endDate: Date;
}

export default function FacebookAdsDashboard({ startDate, endDate }: FacebookAdsDashboardProps) {
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [metrics, setMetrics] = useState<FacebookMetricsResponse | null>(null);
    const [selectedAccount, setSelectedAccount] = useState<string>("all");
    const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            const startStr = startDate.toISOString().split('T')[0];
            const endStr = endDate.toISOString().split('T')[0];

            // Load metrics
            const data = await facebookAdsAPI.getMetrics(
                startStr,
                endStr,
                selectedAccount !== "all" ? selectedAccount : undefined
            );
            setMetrics(data);

            // Extract unique accounts from metrics
            if (data.byAccount && data.byAccount.length > 0) {
                setAccounts(data.byAccount.map(a => ({ id: a.id, name: a.name })));
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar métricas';
            console.error('Erro ao carregar métricas do Facebook:', errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        try {
            setSyncing(true);
            const startStr = startDate.toISOString().split('T')[0];
            const endStr = endDate.toISOString().split('T')[0];

            await facebookAdsAPI.syncData(startStr, endStr);

            // Reload data after sync
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

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat('pt-BR').format(value);
    };

    const formatPercent = (value: number) => {
        return `${(value || 0).toFixed(2)}%`;
    };

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

    const summary = metrics?.summary || {
        totalSpend: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalLeads: 0,
        totalPurchases: 0,
        totalPurchaseValue: 0,
        avgCpc: 0,
        avgCpm: 0,
        avgCtr: 0,
        avgCostPerLead: 0,
        avgCostPerPurchase: 0,
        roas: 0
    };

    const campaigns = metrics?.byCampaign || [];
    const evolution = metrics?.evolution || [];

    // Colors for charts
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    return (
        <div className="space-y-6">
            {/* Header com controles */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                                Facebook Ads
                            </CardTitle>
                            <CardDescription>
                                Métricas de performance das campanhas do Facebook Ads
                            </CardDescription>
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
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Métricas principais */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            Investimento
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(summary.totalSpend)}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            Impressões
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(summary.totalImpressions)}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <MousePointer className="h-4 w-4" />
                            Cliques
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(summary.totalClicks)}</div>
                        <p className="text-xs text-muted-foreground mt-1">CTR: {formatPercent(summary.avgCtr)}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            Leads
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(summary.totalLeads)}</div>
                        <p className="text-xs text-muted-foreground mt-1">CPL: {formatCurrency(summary.avgCostPerLead)}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <ShoppingCart className="h-4 w-4" />
                            Vendas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(summary.totalPurchases)}</div>
                        <p className="text-xs text-muted-foreground mt-1">CPA: {formatCurrency(summary.avgCostPerPurchase)}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            {summary.roas >= 1 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
                            ROAS
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${summary.roas >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                            {(summary.roas || 0).toFixed(2)}x
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Receita: {formatCurrency(summary.totalPurchaseValue)}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Gráfico de evolução */}
            <Card>
                <CardHeader>
                    <CardTitle>Evolução Diária</CardTitle>
                    <CardDescription>Investimento e resultados ao longo do período</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={evolution}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip
                                formatter={(value: number, name: string) => {
                                    if (name === 'spend' || name === 'purchaseValue') return formatCurrency(value);
                                    return formatNumber(value);
                                }}
                                labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                            />
                            <Legend />
                            <Line yAxisId="left" type="monotone" dataKey="spend" stroke="#ef4444" strokeWidth={2} name="Investimento" />
                            <Line yAxisId="left" type="monotone" dataKey="purchaseValue" stroke="#10b981" strokeWidth={2} name="Receita" />
                            <Line yAxisId="right" type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={2} name="Leads" />
                            <Line yAxisId="right" type="monotone" dataKey="purchases" stroke="#8b5cf6" strokeWidth={2} name="Vendas" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Tabela de campanhas */}
            <Card>
                <CardHeader>
                    <CardTitle>Performance por Campanha</CardTitle>
                    <CardDescription>Métricas detalhadas de cada campanha</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-3 font-medium">Campanha</th>
                                    <th className="text-right p-3 font-medium">Status</th>
                                    <th className="text-right p-3 font-medium">Investimento</th>
                                    <th className="text-right p-3 font-medium">Impressões</th>
                                    <th className="text-right p-3 font-medium">Cliques</th>
                                    <th className="text-right p-3 font-medium">CTR</th>
                                    <th className="text-right p-3 font-medium">CPC</th>
                                    <th className="text-right p-3 font-medium">Leads</th>
                                    <th className="text-right p-3 font-medium">CPL</th>
                                    <th className="text-right p-3 font-medium">Vendas</th>
                                    <th className="text-right p-3 font-medium">ROAS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {campaigns.map((campaign, idx) => (
                                    <tr key={campaign.id} className="border-b hover:bg-muted/50">
                                        <td className="p-3">
                                            <div className="font-medium truncate max-w-[200px]">{campaign.name}</div>
                                            <div className="text-xs text-muted-foreground">{campaign.objective}</div>
                                        </td>
                                        <td className="p-3 text-right">
                                            <Badge variant={campaign.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                                {campaign.status}
                                            </Badge>
                                        </td>
                                        <td className="p-3 text-right font-mono">{formatCurrency(campaign.spend)}</td>
                                        <td className="p-3 text-right font-mono">{formatNumber(campaign.impressions)}</td>
                                        <td className="p-3 text-right font-mono">{formatNumber(campaign.clicks)}</td>
                                        <td className="p-3 text-right font-mono">{formatPercent(campaign.ctr)}</td>
                                        <td className="p-3 text-right font-mono">{formatCurrency(campaign.cpc)}</td>
                                        <td className="p-3 text-right font-mono">{campaign.leads}</td>
                                        <td className="p-3 text-right font-mono">{formatCurrency(campaign.costPerLead)}</td>
                                        <td className="p-3 text-right font-mono">{campaign.purchases}</td>
                                        <td className="p-3 text-right">
                                            <span className={`font-mono font-bold ${campaign.roas >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                                                {(campaign.roas || 0).toFixed(2)}x
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {campaigns.length === 0 && (
                                    <tr>
                                        <td colSpan={11} className="p-8 text-center text-muted-foreground">
                                            Nenhuma campanha encontrada. Clique em sincronizar para buscar dados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Métricas de custo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">CPC Médio</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{formatCurrency(summary.avgCpc)}</div>
                        <p className="text-sm text-muted-foreground mt-2">Custo por clique</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">CPM Médio</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{formatCurrency(summary.avgCpm)}</div>
                        <p className="text-sm text-muted-foreground mt-2">Custo por mil impressões</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">CPA Médio</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{formatCurrency(summary.avgCostPerPurchase)}</div>
                        <p className="text-sm text-muted-foreground mt-2">Custo por aquisição</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
