import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Image, Video, MonitorPlay, ExternalLink, MonitorSmartphone, LayoutGrid, Smartphone, Laptop } from "lucide-react";
import { CreativeMetrics } from "@/lib/edge-functions";

interface CreativeRankingTableProps {
    data: CreativeMetrics[];
}

export default function CreativeRankingTable({ data }: CreativeRankingTableProps) {
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
                <CardTitle>Ranking de Criativos</CardTitle>
                <CardDescription>Performance detalhada por criativo (utm_content)</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Criativo (ID)</TableHead>
                                <TableHead>Melhor Formato</TableHead>
                                <TableHead className="text-right">Visitas</TableHead>
                                <TableHead className="text-right">Add to Cart</TableHead>
                                <TableHead className="text-right">Wishlist</TableHead>
                                <TableHead className="text-right">Checkout (IC)</TableHead>
                                <TableHead className="text-right">Vendas</TableHead>
                                <TableHead className="text-right">Receita</TableHead>
                                <TableHead className="text-right">Conv. Venda</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item, index) => (
                                <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-muted rounded-full text-indigo-500">
                                                <Image className="h-4 w-4" />
                                            </div>
                                            <span className="font-mono text-xs truncate max-w-[150px]" title={item.creativeId}>
                                                {item.creativeId}
                                            </span>
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

                            {data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                        Nenhum dado de criativo registrado no período.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
