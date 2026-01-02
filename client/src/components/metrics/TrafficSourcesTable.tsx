import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Youtube, Facebook, Instagram, Linkedin, Globe, MousePointer2, Search, Share2, Twitter } from "lucide-react";
import { TrafficSourceMetrics } from "@/lib/edge-functions";

interface TrafficSourcesTableProps {
    data: TrafficSourceMetrics[];
}

export default function TrafficSourcesTable({ data }: TrafficSourcesTableProps) {
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
                <CardTitle>Fontes de Tráfego</CardTitle>
                <CardDescription>Origem dos seus visitantes e conversões</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Canal</TableHead>
                                <TableHead className="text-right">Sessões</TableHead>
                                <TableHead className="text-right">Leads</TableHead>
                                <TableHead className="text-right">Vendas</TableHead>
                                <TableHead className="text-right">Receita</TableHead>
                                <TableHead className="text-right">Conv. Venda</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item, index) => (
                                <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-muted rounded-full">
                                                {getSourceIcon(item.source)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{getSourceLabel(item.source)}</span>
                                                <span className="text-xs text-muted-foreground">{item.medium}</span>
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
                            ))}

                            {data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        Nenhum dado de tráfego registrado no período.
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
