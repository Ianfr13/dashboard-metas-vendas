import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Youtube, Facebook, Instagram, Linkedin, Globe, MousePointer2, Search, Share2, Twitter, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { TrafficSourceMetrics } from "@/lib/edge-functions";

interface TrafficSourcesTableProps {
    data: TrafficSourceMetrics[];
    selectedFunnelType: 'compra' | 'leads';
}

type SortKey = keyof TrafficSourceMetrics;

export default function TrafficSourcesTable({ data, selectedFunnelType }: TrafficSourcesTableProps) {
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>({ key: 'sales', direction: 'desc' });
    const [filterSource, setFilterSource] = useState('todos');

    const filteredData = useMemo(() => {
        return data.filter(item => {
            // First filter by funnel type
            if ((item.funnelType || 'compra') !== selectedFunnelType) return false;

            if (filterSource === 'todos') return true;
            return item.source === filterSource;
        });
    }, [data, filterSource, selectedFunnelType]);

    const sortedData = useMemo(() => {
        if (!sortConfig) return filteredData;

        return [...filteredData].sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortConfig.direction === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }

            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortConfig.direction === 'asc'
                    ? aValue - bValue
                    : bValue - aValue;
            }

            return 0;
        });
    }, [filteredData, sortConfig]);

    const requestSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'desc'; // Default to desc for metrics
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

    // Get unique sources
    const uniqueSources = useMemo(() => {
        return Array.from(new Set(data.map(item => item.source))).sort();
    }, [data]);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Fontes de Tráfego</CardTitle>
                        <CardDescription>
                            Análise de performance ({selectedFunnelType === 'leads' ? 'Leads' : 'Vendas'})
                        </CardDescription>
                    </div>
                    {/* Source Filter */}
                    <div className="w-[200px]">
                        <Select value={filterSource} onValueChange={setFilterSource}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filtrar por source..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todas as fontes</SelectItem>
                                {uniqueSources.map(source => (
                                    <SelectItem key={source} value={source}>{source}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                                        <div className="flex items-center justify-end">Conv. {selectedFunnelType === 'leads' ? 'Lead' : 'Venda'} {getSortIcon('conversionRate')}</div>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedData.map((item, index) => {
                                    const isMetaAds = item.source.toLowerCase().includes('meta_ads') || item.source.toLowerCase().includes('meta ads');
                                    const displaySource = isMetaAds ? item.medium : item.source;
                                    const displayMedium = isMetaAds ? "Ads" : item.medium;

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
                                                    {item.sessions > 0 && selectedFunnelType === 'leads' && (
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
