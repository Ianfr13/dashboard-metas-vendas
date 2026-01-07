import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Play, Eye, CheckCircle, Video, Settings2, Users, TrendingUp, Target } from "lucide-react";

interface VslData {
    id: string;
    name: string;
    started: number;
    finished: number;
    viewed: number;
    unique_views?: number;
    unique_plays?: number;
    duration?: number;
}

interface VslRankingTableProps {
    data: VslData[];
}

type MetricKey = 'views' | 'plays' | 'playRate' | 'finishes' | 'completionRate' | 'uniqueViews' | 'uniquePlays' | 'engagementRate';

interface MetricConfig {
    key: MetricKey;
    label: string;
    icon: React.ReactNode;
    defaultVisible: boolean;
}

const AVAILABLE_METRICS: MetricConfig[] = [
    { key: 'views', label: 'Visualizações', icon: <Eye className="h-3 w-3" />, defaultVisible: true },
    { key: 'plays', label: 'Plays', icon: <Play className="h-3 w-3" />, defaultVisible: true },
    { key: 'playRate', label: 'Taxa de Play', icon: <TrendingUp className="h-3 w-3" />, defaultVisible: true },
    { key: 'finishes', label: 'Finalizações', icon: <CheckCircle className="h-3 w-3" />, defaultVisible: true },
    { key: 'completionRate', label: 'Taxa Conclusão', icon: <Target className="h-3 w-3" />, defaultVisible: true },
    { key: 'uniqueViews', label: 'Views Únicos', icon: <Users className="h-3 w-3" />, defaultVisible: false },
    { key: 'uniquePlays', label: 'Plays Únicos', icon: <Users className="h-3 w-3" />, defaultVisible: false },
    { key: 'engagementRate', label: 'Engajamento', icon: <TrendingUp className="h-3 w-3" />, defaultVisible: false },
];

export default function VslRankingTable({ data }: VslRankingTableProps) {
    const [visibleMetrics, setVisibleMetrics] = useState<Set<MetricKey>>(
        new Set(AVAILABLE_METRICS.filter(m => m.defaultVisible).map(m => m.key))
    );

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat("pt-BR").format(value || 0);
    };

    const formatPercent = (value: number) => {
        return `${(value || 0).toFixed(1)}%`;
    };

    const toggleMetric = (key: MetricKey) => {
        const newSet = new Set(visibleMetrics);
        if (newSet.has(key)) {
            newSet.delete(key);
        } else {
            newSet.add(key);
        }
        setVisibleMetrics(newSet);
    };

    const getMetricValue = (item: VslData, key: MetricKey) => {
        const playRate = item.viewed > 0 ? (item.started / item.viewed) * 100 : 0;
        const completionRate = item.started > 0 ? (item.finished / item.started) * 100 : 0;
        const engagementRate = item.viewed > 0 ? (item.finished / item.viewed) * 100 : 0;

        switch (key) {
            case 'views': return { type: 'number', value: item.viewed };
            case 'plays': return { type: 'number', value: item.started };
            case 'playRate': return { type: 'percent', value: playRate, badge: playRate > 50 };
            case 'finishes': return { type: 'number', value: item.finished };
            case 'completionRate': return { type: 'percent', value: completionRate, badge: completionRate > 30 };
            case 'uniqueViews': return { type: 'number', value: item.unique_views || 0 };
            case 'uniquePlays': return { type: 'number', value: item.unique_plays || 0 };
            case 'engagementRate': return { type: 'percent', value: engagementRate, badge: engagementRate > 5 };
            default: return { type: 'number', value: 0 };
        }
    };

    const visibleMetricsList = AVAILABLE_METRICS.filter(m => visibleMetrics.has(m.key));

    return (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Video className="h-5 w-5 text-purple-500" />
                            Ranking de VSLs (Vturb)
                        </CardTitle>
                        <CardDescription>Performance das suas Video Sales Letters</CardDescription>
                    </div>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Settings2 className="h-4 w-4" />
                                Métricas
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56" align="end">
                            <div className="space-y-2">
                                <p className="text-sm font-medium mb-3">Selecionar Métricas</p>
                                {AVAILABLE_METRICS.map((metric) => (
                                    <div key={metric.key} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={metric.key}
                                            checked={visibleMetrics.has(metric.key)}
                                            onCheckedChange={() => toggleMetric(metric.key)}
                                        />
                                        <label
                                            htmlFor={metric.key}
                                            className="text-sm cursor-pointer flex items-center gap-2"
                                        >
                                            {metric.icon}
                                            {metric.label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>VSL</TableHead>
                                {visibleMetricsList.map(m => (
                                    <TableHead key={m.key} className="text-right">{m.label}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item, index) => (
                                <TableRow key={item.id || index} className="hover:bg-muted/50 transition-colors">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-muted rounded-full text-purple-500">
                                                <Play className="h-4 w-4" />
                                            </div>
                                            <span className="font-medium truncate max-w-[200px]" title={item.name}>
                                                {item.name || item.id}
                                            </span>
                                        </div>
                                    </TableCell>
                                    {visibleMetricsList.map(m => {
                                        const { type, value, badge } = getMetricValue(item, m.key);
                                        return (
                                            <TableCell key={m.key} className="text-right">
                                                {type === 'percent' ? (
                                                    <Badge variant={badge ? "default" : "secondary"}
                                                        className={badge && m.key === 'completionRate' ? "bg-green-600" : ""}>
                                                        {formatPercent(value)}
                                                    </Badge>
                                                ) : (
                                                    <span className="font-mono text-sm">{formatNumber(value)}</span>
                                                )}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))}

                            {data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={visibleMetricsList.length + 1} className="text-center py-8 text-muted-foreground">
                                        Nenhum dado de VSL encontrado no período.
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
