import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Youtube, Facebook, Instagram, Linkedin, Globe, MousePointer2, Search, Share2, Twitter, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { TrafficSourceMetrics } from "@/lib/edge-functions";

interface TrafficSourcesTableProps {
    data: TrafficSourceMetrics[];
}

type SortKey = keyof TrafficSourceMetrics;

export default function TrafficSourcesTable({ data }: TrafficSourcesTableProps) {
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>({ key: 'sales', direction: 'desc' });
    const [filterType, setFilterType] = useState<'all' | 'paid' | 'organic' | 'direct'>('all'); // State for filter
    const [selectedFunnelType, setSelectedFunnelType] = useState<'compra' | 'leads'>('compra');

    const filteredData = data.filter(item => {
        // First filter by funnel type
        if ((item.funnelType || 'compra') !== selectedFunnelType) return false;

        if (filterType === 'all') return true;

        const m = (item.medium || '').toLowerCase();
        const s = (item.source || '').toLowerCase();

        if (filterType === 'paid') {
            return m.includes('cpc') || m.includes('paid') || m.includes('ppc') || m.includes('ad') || s.includes('meta_ads') || s.includes('meta ads');
        }
        if (filterType === 'organic') {
            return m.includes('organic') || m.includes('referral') || m.includes('email') || m.includes('social');
        }
        if (filterType === 'direct') {
            return s.includes('direct') || m.includes('none') || m === '';
        }
        return true;
    });

    const sortedData = [...filteredData].sort((a, b) => {
        if (!sortConfig) return 0;

        const { key, direction } = sortConfig;

        if (a[key] < b[key]) {
            return direction === 'asc' ? -1 : 1;
        }
        if (a[key] > b[key]) {
            return direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const requestSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'desc'; // Default to desc for metrics usually
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: SortKey) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground opacity-50" />;
        }
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="ml-2 h-4 w-4 text-primary" />
            : <ArrowDown className="ml-2 h-4 w-4 text-primary" />;
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
            minimumFractionDigits: 0,
        }).format(value);
    };

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat("pt-BR").format(value);
    };

    const getSourceIcon = (source: string) => {
        const s = source.toLowerCase();
        if (s.includes('youtube')) return <Youtube className="h-4 w-4 text-red-600" />;
        if (s.includes('facebook')) return <Facebook className="h-4 w-4 text-blue-600" />;
        if (s.includes('instagram')) return <Instagram className="h-4 w-4 text-pink-600" />;
        if (s.includes('linkedin')) return <Linkedin className="h-4 w-4 text-blue-700" />;
        if (s.includes('twitter') || s.includes('t.co')) return <Twitter className="h-4 w-4 text-sky-500" />;
        if (s.includes('google') || s.includes('bing') || s.includes('yahoo')) return <Search className="h-4 w-4 text-green-600" />;
        if (s.includes('direct') || s === '(none)') return <MousePointer2 className="h-4 w-4 text-gray-500" />;
        return <Globe className="h-4 w-4 text-indigo-500" />;
    };

    const getSourceLabel = (source: string) => {
        if (source === 'direct' || source === '(none)') return 'Tráfego Direto';
        return source.charAt(0).toUpperCase() + source.slice(1);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Fontes de Tráfego</CardTitle>
                            <CardDescription>Origem dos seus visitantes e conversões</CardDescription>
                        </div>
                        <Tabs value={selectedFunnelType} onValueChange={(v) => setSelectedFunnelType(v as 'compra' | 'leads')} className="w-[300px]">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="compra">Compra</TabsTrigger>
                                <TabsTrigger value="leads">Leads</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                    <div className="w-[180px]">
                        <select
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as any)}
                        >
                            <option value="all">Todos os Canais</option>
                            <option value="paid">Tráfego Pago</option>
                            <option value="organic">Orgânico / Referral</option>
                            <option value="direct">Direto</option>
                        </select>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-auto max-h-[400px]">
                    <div className="relative w-full">
                        <table className="w-full caption-bottom text-sm">
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead onClick={() => requestSort('source')} className="sticky top-0 z-20 bg-card cursor-pointer hover:bg-muted/50 transition-colors shadow-sm">
                                        <div className="flex items-center">Canal {getSortIcon('source')}</div>
                                    </TableHead>
                                    <TableHead onClick={() => requestSort('sessions')} className="sticky top-0 z-20 bg-card cursor-pointer text-right hover:bg-muted/50 transition-colors shadow-sm">
                                        <div className="flex items-center justify-end">Sessões {getSortIcon('sessions')}</div>
                                    </TableHead>
                                    <TableHead onClick={() => requestSort('leads')} className="sticky top-0 z-20 bg-card cursor-pointer text-right hover:bg-muted/50 transition-colors shadow-sm">
                                        <div className="flex items-center justify-end">Leads {getSortIcon('leads')}</div>
                                    </TableHead>
                                    <TableHead onClick={() => requestSort('sales')} className="sticky top-0 z-20 bg-card cursor-pointer text-right hover:bg-muted/50 transition-colors shadow-sm">
                                        <div className="flex items-center justify-end">Vendas {getSortIcon('sales')}</div>
                                    </TableHead>
                                    <TableHead onClick={() => requestSort('revenue')} className="sticky top-0 z-20 bg-card cursor-pointer text-right hover:bg-muted/50 transition-colors shadow-sm">
                                        <div className="flex items-center justify-end">Receita {getSortIcon('revenue')}</div>
                                    </TableHead>
                                    <TableHead onClick={() => requestSort('conversionRate')} className="sticky top-0 z-20 bg-card cursor-pointer text-right hover:bg-muted/50 transition-colors shadow-sm">
                                        <div className="flex items-center justify-end">Conv. Venda {getSortIcon('conversionRate')}</div>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedData.map((item, index) => {
                                    const isMetaAds = item.source.toLowerCase().includes('meta_ads') || item.source.toLowerCase().includes('meta ads');
                                    const displaySource = isMetaAds ? item.medium : item.source; // Se for meta ads, mostra o medium (posicionamento) como título
                                    const displayMedium = isMetaAds ? "Ads" : item.medium; // Se for meta ads, mostra "Ads" como subtítulo

                                    return (
                                        <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="p-2 bg-muted rounded-full">
                                                        {getSourceIcon(displaySource)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-sm">{getSourceLabel(displaySource)}</span>
                                                        <span className="text-xs text-muted-foreground">{displayMedium}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-sm">
                                                {formatNumber(item.sessions)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="font-mono text-sm">{formatNumber(item.leads)}</span>
                                                    {item.sessions > 0 && (
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {(((item.leads || 0) / (item.sessions || 1)) * 100).toFixed(1)}%
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-sm">
                                                {formatNumber(item.sales)}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-green-600">
                                                {formatCurrency(item.revenue)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant={(item.conversionRate || 0) > 1 ? "default" : "secondary"}>
                                                    {(item.conversionRate || 0).toFixed(2)}%
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}

                                {sortedData.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            Nenhum dado encontrado para o filtro selecionado.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </table>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
