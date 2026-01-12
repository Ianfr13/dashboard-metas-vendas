import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, Users, Clock, ArrowDown, Smartphone, Monitor, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageAnalytics {
    slug: string;
    views: number;
    unique_visitors: number;
    scroll_50: number;
    scroll_100: number;
    avg_time: number;
    mobile: number;
    desktop: number;
}

interface AnalyticsResponse {
    date: string;
    pages: PageAnalytics[];
}

const WORKER_URL = "https://ab.douravita.com.br";

export default function PageAnalyticsTab() {
    const { data, isLoading, error, refetch, dataUpdatedAt } = useQuery<AnalyticsResponse>({
        queryKey: ["page-analytics"],
        queryFn: async () => {
            const res = await fetch(`${WORKER_URL}/admin/analytics`);
            if (!res.ok) throw new Error("Falha ao carregar analytics");
            return res.json();
        },
        refetchInterval: 30000, // Refresh every 30s
    });

    // Format seconds to mm:ss
    const formatTime = (seconds: number) => {
        if (!seconds) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    // Calculate scroll rate
    const scrollRate = (count: number, views: number) => {
        if (!views) return 0;
        return Math.round((count / views) * 100);
    };

    // Totals
    const totals = data?.pages?.reduce(
        (acc, p) => ({
            views: acc.views + p.views,
            unique_visitors: acc.unique_visitors + p.unique_visitors,
            mobile: acc.mobile + p.mobile,
            desktop: acc.desktop + p.desktop,
        }),
        { views: 0, unique_visitors: 0, mobile: 0, desktop: 0 }
    ) || { views: 0, unique_visitors: 0, mobile: 0, desktop: 0 };

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
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Analytics das Páginas</h2>
                    <p className="text-muted-foreground text-sm">
                        Dados em tempo real do dia {data?.date}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-green-600 border-green-600 animate-pulse">
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Ao Vivo
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Atualizar
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
                        <div className="text-3xl font-bold">{totals.views.toLocaleString('pt-BR')}</div>
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
                        <div className="text-3xl font-bold">{totals.unique_visitors.toLocaleString('pt-BR')}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Smartphone className="h-4 w-4" />
                            Mobile
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {totals.views > 0 ? Math.round((totals.mobile / totals.views) * 100) : 0}%
                        </div>
                        <p className="text-xs text-muted-foreground">{totals.mobile} acessos</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Monitor className="h-4 w-4" />
                            Desktop
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {totals.views > 0 ? Math.round((totals.desktop / totals.views) * 100) : 0}%
                        </div>
                        <p className="text-xs text-muted-foreground">{totals.desktop} acessos</p>
                    </CardContent>
                </Card>
            </div>

            {/* Pages Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Páginas</CardTitle>
                    <CardDescription>
                        Métricas detalhadas por página ({data?.pages?.length || 0} páginas ativas)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {data?.pages && data.pages.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="py-3 px-2 font-medium">Página</th>
                                        <th className="py-3 px-2 font-medium text-right">Views</th>
                                        <th className="py-3 px-2 font-medium text-right">Únicos</th>
                                        <th className="py-3 px-2 font-medium text-right">
                                            <span className="flex items-center justify-end gap-1">
                                                <ArrowDown className="h-3 w-3" /> 50%
                                            </span>
                                        </th>
                                        <th className="py-3 px-2 font-medium text-right">
                                            <span className="flex items-center justify-end gap-1">
                                                <ArrowDown className="h-3 w-3" /> 100%
                                            </span>
                                        </th>
                                        <th className="py-3 px-2 font-medium text-right">
                                            <span className="flex items-center justify-end gap-1">
                                                <Clock className="h-3 w-3" /> Tempo
                                            </span>
                                        </th>
                                        <th className="py-3 px-2 font-medium text-right">Dispositivo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.pages.map((page) => (
                                        <tr key={page.slug} className="border-b hover:bg-muted/50">
                                            <td className="py-3 px-2">
                                                <code className="text-sm bg-muted px-2 py-1 rounded">
                                                    /{page.slug}
                                                </code>
                                            </td>
                                            <td className="py-3 px-2 text-right font-mono">
                                                {page.views.toLocaleString('pt-BR')}
                                            </td>
                                            <td className="py-3 px-2 text-right font-mono">
                                                {page.unique_visitors.toLocaleString('pt-BR')}
                                            </td>
                                            <td className="py-3 px-2 text-right">
                                                <Badge variant={scrollRate(page.scroll_50, page.views) > 50 ? "default" : "secondary"}>
                                                    {scrollRate(page.scroll_50, page.views)}%
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-2 text-right">
                                                <Badge variant={scrollRate(page.scroll_100, page.views) > 30 ? "default" : "secondary"}>
                                                    {scrollRate(page.scroll_100, page.views)}%
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-2 text-right font-mono">
                                                {formatTime(page.avg_time)}
                                            </td>
                                            <td className="py-3 px-2 text-right">
                                                <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Smartphone className="h-3 w-3" />
                                                        {page.mobile}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Monitor className="h-3 w-3" />
                                                        {page.desktop}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <Eye className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>Nenhum dado de analytics ainda</p>
                            <p className="text-sm mt-1">Os dados aparecerão quando usuários visitarem suas páginas</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
