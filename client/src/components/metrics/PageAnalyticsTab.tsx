import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, Users, Clock, ArrowDown, Smartphone, Monitor, RefreshCw, ChevronDown, ChevronRight, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface PageData {
    slug: string;
    fstg: string;
    views: number;
    unique_visitors: number;
    scroll_50: number;
    scroll_100: number;
    avg_time: number;
    mobile: number;
    desktop: number;
}

interface FunnelData {
    fid: string;
    ftype: string;
    fver: string;
    pver: string;
    pages: PageData[];
    totals: {
        views: number;
        unique_visitors: number;
        mobile: number;
        desktop: number;
    };
}

interface AnalyticsResponse {
    date: string;
    funnels: FunnelData[];
}

const WORKER_URL = "https://ab.douravita.com.br";

export default function PageAnalyticsTab() {
    const [selectedFid, setSelectedFid] = useState<string>("all");
    const [expandedFunnels, setExpandedFunnels] = useState<Set<string>>(new Set());

    const { data, isLoading, error, refetch } = useQuery<AnalyticsResponse>({
        queryKey: ["page-analytics"],
        queryFn: async () => {
            const res = await fetch(`${WORKER_URL}/admin/analytics`);
            if (!res.ok) throw new Error("Falha ao carregar analytics");
            return res.json();
        },
        refetchInterval: 30000,
    });

    const formatTime = (seconds: number) => {
        if (!seconds) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const scrollRate = (count: number, views: number) => {
        if (!views) return 0;
        return Math.round((count / views) * 100);
    };

    const toggleFunnel = (fid: string) => {
        const newSet = new Set(expandedFunnels);
        if (newSet.has(fid)) {
            newSet.delete(fid);
        } else {
            newSet.add(fid);
        }
        setExpandedFunnels(newSet);
    };

    // Get unique fids for filter
    const funnelIds = data?.funnels?.map(f => f.fid) || [];

    // Filter funnels
    const filteredFunnels = selectedFid === "all"
        ? data?.funnels || []
        : data?.funnels?.filter(f => f.fid === selectedFid) || [];

    // Calculate global totals
    const globalTotals = filteredFunnels.reduce(
        (acc, f) => ({
            views: acc.views + f.totals.views,
            unique_visitors: acc.unique_visitors + f.totals.unique_visitors,
            mobile: acc.mobile + f.totals.mobile,
            desktop: acc.desktop + f.totals.desktop,
        }),
        { views: 0, unique_visitors: 0, mobile: 0, desktop: 0 }
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <Card className="border-destructive">
                <CardContent className="py-8 text-center">
                    <p className="text-destructive mb-4">Erro ao carregar analytics</p>
                    <Button onClick={() => refetch()}>Tentar novamente</Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Analytics das Páginas</h2>
                    <p className="text-muted-foreground text-sm">
                        Dados em tempo real do dia {data?.date} • Agrupados por funil
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={selectedFid} onValueChange={setSelectedFid}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filtrar funil" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os funis</SelectItem>
                            {funnelIds.map(fid => (
                                <SelectItem key={fid} value={fid}>{fid}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Badge variant="outline" className="text-green-600 border-green-600 animate-pulse">
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Ao Vivo
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Total de Views
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{globalTotals.views.toLocaleString('pt-BR')}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Visitantes Únicos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{globalTotals.unique_visitors.toLocaleString('pt-BR')}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Layers className="h-4 w-4" />
                            Funis Ativos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{filteredFunnels.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Smartphone className="h-4 w-4" />
                            Mobile vs Desktop
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {globalTotals.views > 0 ? Math.round((globalTotals.mobile / globalTotals.views) * 100) : 0}%
                            <span className="text-muted-foreground text-sm ml-2">mobile</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Funnels List */}
            {filteredFunnels.length > 0 ? (
                <div className="space-y-4">
                    {filteredFunnels.map((funnel) => (
                        <Card key={funnel.fid}>
                            <Collapsible
                                open={expandedFunnels.has(funnel.fid)}
                                onOpenChange={() => toggleFunnel(funnel.fid)}
                            >
                                <CollapsibleTrigger asChild>
                                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {expandedFunnels.has(funnel.fid) ? (
                                                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                                ) : (
                                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                                )}
                                                <div>
                                                    <CardTitle className="flex items-center gap-2">
                                                        <code className="text-lg bg-primary/10 px-2 py-0.5 rounded">{funnel.fid}</code>
                                                        <Badge variant={funnel.ftype === 'leads' ? 'secondary' : 'default'}>
                                                            {funnel.ftype}
                                                        </Badge>
                                                    </CardTitle>
                                                    <CardDescription className="flex gap-4 mt-1">
                                                        {funnel.fver && <span>Versão: {funnel.fver}</span>}
                                                        {funnel.pver && <span>Página: {funnel.pver}</span>}
                                                        <span>{funnel.pages.length} páginas</span>
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6 text-sm">
                                                <div className="text-right">
                                                    <div className="font-bold text-xl">{funnel.totals.views.toLocaleString('pt-BR')}</div>
                                                    <div className="text-muted-foreground">views</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-xl">{funnel.totals.unique_visitors.toLocaleString('pt-BR')}</div>
                                                    <div className="text-muted-foreground">únicos</div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <CardContent>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b text-left text-sm">
                                                        <th className="py-2 px-2 font-medium">Página</th>
                                                        <th className="py-2 px-2 font-medium">Etapa</th>
                                                        <th className="py-2 px-2 font-medium text-right">Views</th>
                                                        <th className="py-2 px-2 font-medium text-right">Únicos</th>
                                                        <th className="py-2 px-2 font-medium text-right">
                                                            <ArrowDown className="h-3 w-3 inline mr-1" />50%
                                                        </th>
                                                        <th className="py-2 px-2 font-medium text-right">
                                                            <ArrowDown className="h-3 w-3 inline mr-1" />100%
                                                        </th>
                                                        <th className="py-2 px-2 font-medium text-right">
                                                            <Clock className="h-3 w-3 inline mr-1" />Tempo
                                                        </th>
                                                        <th className="py-2 px-2 font-medium text-right">Device</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {funnel.pages.map((page) => (
                                                        <tr key={page.slug} className="border-b hover:bg-muted/30">
                                                            <td className="py-2 px-2">
                                                                <code className="text-sm bg-muted px-1.5 py-0.5 rounded">/{page.slug}</code>
                                                            </td>
                                                            <td className="py-2 px-2">
                                                                {page.fstg && page.fstg !== 'none' ? (
                                                                    <Badge variant="outline" className="text-xs">{page.fstg}</Badge>
                                                                ) : '-'}
                                                            </td>
                                                            <td className="py-2 px-2 text-right font-mono">{page.views.toLocaleString('pt-BR')}</td>
                                                            <td className="py-2 px-2 text-right font-mono">{page.unique_visitors.toLocaleString('pt-BR')}</td>
                                                            <td className="py-2 px-2 text-right">
                                                                <Badge variant={scrollRate(page.scroll_50, page.views) > 50 ? "default" : "secondary"} className="text-xs">
                                                                    {scrollRate(page.scroll_50, page.views)}%
                                                                </Badge>
                                                            </td>
                                                            <td className="py-2 px-2 text-right">
                                                                <Badge variant={scrollRate(page.scroll_100, page.views) > 30 ? "default" : "secondary"} className="text-xs">
                                                                    {scrollRate(page.scroll_100, page.views)}%
                                                                </Badge>
                                                            </td>
                                                            <td className="py-2 px-2 text-right font-mono text-sm">{formatTime(page.avg_time)}</td>
                                                            <td className="py-2 px-2 text-right">
                                                                <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                                                                    <span><Smartphone className="h-3 w-3 inline" /> {page.mobile}</span>
                                                                    <span><Monitor className="h-3 w-3 inline" /> {page.desktop}</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </CollapsibleContent>
                            </Collapsible>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <Eye className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>Nenhum dado de analytics ainda</p>
                        <p className="text-sm mt-1">Os dados aparecerão quando usuários visitarem suas páginas</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
