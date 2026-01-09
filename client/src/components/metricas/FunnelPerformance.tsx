
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, Users, DollarSign, Filter, Download } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { gtmAnalyticsAPI, FunnelPerformanceMetrics } from "@/lib/edge-functions";
import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface FunnelPerformanceProps {
    startDate: Date;
    endDate: Date;
}

export default function FunnelPerformance({ startDate, endDate }: FunnelPerformanceProps) {
    const { user, loading: authLoading } = useAuth();
    const [data, setData] = useState<FunnelPerformanceMetrics[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState("");

    useEffect(() => {
        async function loadData() {
            if (authLoading || !user) return;

            try {
                setLoading(true);
                const formattedStart = format(startDate, 'yyyy-MM-dd');
                const formattedEnd = format(endDate, 'yyyy-MM-dd');
                const result = await gtmAnalyticsAPI.getFunnelPerformance(formattedStart, formattedEnd);
                setData(result);
            } catch (err) {
                console.error('Erro ao carregar performance do funil:', err);
                setError(err instanceof Error ? err.message : 'Erro desconhecido');
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [startDate, endDate, user, authLoading]);

    // Filter logic
    const filteredData = data.filter(item =>
        item.funnelId.toLowerCase().includes(filter.toLowerCase()) ||
        item.funnelVersion.toLowerCase().includes(filter.toLowerCase()) ||
        item.pageVersion.toLowerCase().includes(filter.toLowerCase()) ||
        item.offerId.toLowerCase().includes(filter.toLowerCase()) ||
        (item.funnelStage && item.funnelStage.toLowerCase().includes(filter.toLowerCase()))
    );

    const exportCSV = () => {
        const headers = ["Funnel ID", "Version", "Page Ver", "Offer ID", "Stage", "Sessions", "Leads", "Sales", "Revenue", "CR%"];
        const csvContent = [
            headers.join(","),
            ...filteredData.map(row => [
                row.funnelId,
                row.funnelVersion,
                row.pageVersion,
                row.offerId,
                row.funnelStage || '',
                row.sessions,
                row.leads,
                row.sales,
                row.revenue.toFixed(2),
                row.conversionRate.toFixed(2)
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `funnel_performance_${startDate.toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle>Performance por URL (Tracking)</CardTitle>
                        <CardDescription>
                            Métricas agrupadas por parâmetros de rastreamento (fid, fver, pver, oid, fstg)
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <div className="relative">
                            <Filter className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Filtrar..."
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="pl-8 w-[200px]"
                            />
                        </div>
                        <Button variant="outline" size="icon" onClick={exportCSV} title="Exportar CSV">
                            <Download className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {filteredData.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        Nenhum dado encontrado para o período.
                    </div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Funnel ID</TableHead>
                                    <TableHead>Version</TableHead>
                                    <TableHead>Page Ver</TableHead>
                                    <TableHead>Offer ID</TableHead>
                                    <TableHead>Stage (fstg)</TableHead>
                                    <TableHead className="text-right">Sessões</TableHead>
                                    <TableHead className="text-right">Leads</TableHead>
                                    <TableHead className="text-right">Vendas</TableHead>
                                    <TableHead className="text-right">Receita</TableHead>
                                    <TableHead className="text-right">Conv. %</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData.map((row, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="font-medium text-xs font-mono">{row.funnelId}</TableCell>
                                        <TableCell className="text-xs font-mono">{row.funnelVersion}</TableCell>
                                        <TableCell className="text-xs font-mono">{row.pageVersion}</TableCell>
                                        <TableCell className="text-xs font-mono">{row.offerId}</TableCell>
                                        <TableCell>
                                            {row.funnelStage && row.funnelStage !== '(not set)' ? (
                                                <Badge variant="secondary" className="text-xs">{row.funnelStage}</Badge>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">{row.sessions}</TableCell>
                                        <TableCell className="text-right">{row.leads}</TableCell>
                                        <TableCell className="text-right">{row.sales}</TableCell>
                                        <TableCell className="text-right">R$ {row.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                                        <TableCell className="text-right">
                                            <span className={row.conversionRate > 1.5 ? "text-green-600 font-bold" : ""}>
                                                {row.conversionRate.toFixed(2)}%
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
