import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Image, ArrowUpDown, ArrowUp, ArrowDown, Smartphone, Laptop, LayoutGrid, Search } from "lucide-react";
import { CreativeMetrics } from "@/lib/edge-functions";

interface CreativeRankingTableProps {
    data: CreativeMetrics[];
}

type SortKey = keyof CreativeMetrics;

export default function CreativeRankingTable({ data }: CreativeRankingTableProps) {
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>({ key: 'sales', direction: 'desc' });
    const [selectedType, setSelectedType] = useState<'compra' | 'leads'>('compra');

    const filteredData = data.filter(item => (item.funnelType || 'compra') === selectedType);

    const sortedData = [...filteredData].sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;
        if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
        if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    const requestSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'desc';
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

    const getPlacementIcon = (placement: string) => {
        const p = (placement || '').toLowerCase();
        if (p.includes('mobile') || p.includes('story') || p.includes('reels') || p.includes('app')) return <Smartphone className="h-4 w-4" />;
        if (p.includes('desktop') || p.includes('web')) return <Laptop className="h-4 w-4" />;
        return <LayoutGrid className="h-4 w-4" />;
    };

    return (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Ranking de Criativos</CardTitle>
                        <CardDescription>Performance detalhada por criativo (utm_content)</CardDescription>
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
                <div className="overflow-x-auto">
                    <table className="w-full caption-bottom text-sm">
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead onClick={() => requestSort('creativeId')} className="cursor-pointer hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center">Criativo (ID) {getSortIcon('creativeId')}</div>
                                </TableHead>
                                <TableHead>Melhor Formato</TableHead>
                                <TableHead onClick={() => requestSort('pageViews')} className="cursor-pointer text-right hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center justify-end">Visitas {getSortIcon('pageViews')}</div>
                                </TableHead>
                                <TableHead onClick={() => requestSort('addToCart')} className="cursor-pointer text-right hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center justify-end">Add to Cart {getSortIcon('addToCart')}</div>
                                </TableHead>
                                <TableHead onClick={() => requestSort('addToWishlist')} className="cursor-pointer text-right hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center justify-end">Wishlist {getSortIcon('addToWishlist')}</div>
                                </TableHead>
                                <TableHead onClick={() => requestSort('checkouts')} className="cursor-pointer text-right hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center justify-end">Checkout (IC) {getSortIcon('checkouts')}</div>
                                </TableHead>
                                <TableHead onClick={() => requestSort('sales')} className="cursor-pointer text-right hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center justify-end">Vendas {getSortIcon('sales')}</div>
                                </TableHead>
                                <TableHead onClick={() => requestSort('revenue')} className="cursor-pointer text-right hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center justify-end">Receita {getSortIcon('revenue')}</div>
                                </TableHead>
                                <TableHead onClick={() => requestSort('conversionRate')} className="cursor-pointer text-right hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center justify-end">Conv. Venda {getSortIcon('conversionRate')}</div>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedData.map((item, index) => (
                                <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2 group/link">
                                            <div className="p-2 bg-muted rounded-full text-indigo-500">
                                                <Image className="h-4 w-4" />
                                            </div>
                                            <span className="font-mono text-xs truncate max-w-[150px]" title={item.creativeId}>
                                                {item.creativeId}
                                            </span>
                                            {item.creativeId && /^\d+$/.test(item.creativeId) && (
                                                <a
                                                    href={`https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=BR&q=${item.creativeId}&search_type=keyword_unordered&media_type=all`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="opacity-0 group-hover/link:opacity-100 transition-opacity p-1 hover:bg-indigo-50 rounded text-indigo-600 ml-auto"
                                                    title="Ver na Biblioteca de Anúncios"
                                                >
                                                    <Search className="w-3 h-3" />
                                                </a>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="p-1 bg-muted rounded-full text-indigo-500">
                                                {getPlacementIcon(item.bestPlacement)}
                                            </div>
                                            <span className="text-sm font-medium">{item.bestPlacement || '-'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm">
                                        {formatNumber(item.pageViews)}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm">
                                        {formatNumber(item.addToCart)}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm">
                                        {formatNumber(item.addToWishlist)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="font-mono text-sm">{formatNumber(item.checkouts)}</span>
                                            {item.pageViews > 0 && (
                                                <span className="text-[10px] text-muted-foreground">
                                                    {(((item.checkouts || 0) / (item.pageViews || 1)) * 100).toFixed(1)}%
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
                            ))}

                            {sortedData.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                        Nenhum dado de criativo registrado no período.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
