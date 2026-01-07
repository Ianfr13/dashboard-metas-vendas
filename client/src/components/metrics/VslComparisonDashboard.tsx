import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingDown, Play, Target } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { vturbAnalyticsAPI } from "@/lib/edge-functions";
import { format } from "date-fns";

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

interface RetentionData {
    minute: number;
    [key: string]: number; // Dynamic keys for each VSL
}

interface VslComparisonDashboardProps {
    vsls: VslData[];
    startDate: Date;
    endDate: Date;
}

const CHART_COLORS = [
    '#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ef4444',
    '#06b6d4', '#eab308', '#ec4899', '#14b8a6', '#8b5cf6'
];

export default function VslComparisonDashboard({ vsls, startDate, endDate }: VslComparisonDashboardProps) {
    const [selectedVsls, setSelectedVsls] = useState<Set<string>>(new Set());
    const [retentionData, setRetentionData] = useState<RetentionData[]>([]);
    const [pitchRetentions, setPitchRetentions] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);

    const toggleVsl = (id: string) => {
        const newSet = new Set(selectedVsls);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            if (newSet.size < 5) { // Limit to 5 VSLs for comparison
                newSet.add(id);
            }
        }
        setSelectedVsls(newSet);
    };

    const selectAll = () => {
        if (selectedVsls.size === vsls.length || selectedVsls.size >= 5) {
            setSelectedVsls(new Set());
        } else {
            setSelectedVsls(new Set(vsls.slice(0, 5).map(v => v.id)));
        }
    };

    useEffect(() => {
        if (selectedVsls.size === 0) {
            setRetentionData([]);
            setPitchRetentions({});
            return;
        }

        let isMounted = true;
        let intervalId: NodeJS.Timeout | null = null;

        const fetchRetentions = async (showLoading = true) => {
            // Only show loading spinner on first fetch (when no data exists)
            if (showLoading && retentionData.length === 0) {
                setLoading(true);
            }

            try {
                const start = format(startDate, 'yyyy-MM-dd');
                const end = format(endDate, 'yyyy-MM-dd');

                // Fetch retention for each selected VSL
                const promises = Array.from(selectedVsls).map(async (vslId) => {
                    const vsl = vsls.find(v => v.id === vslId);
                    const duration = vsl?.duration || 1800;
                    const data = await vturbAnalyticsAPI.getEngagement(vslId, start, end, duration);
                    return { vslId, data, duration };
                });

                const results = await Promise.all(promises);

                if (!isMounted) return;

                // Combine into single dataset with columns for each VSL
                const maxMinutes = Math.max(...results.map(r => r.data.length), 30);
                const combined: RetentionData[] = [];
                const pitchRets: Record<string, number> = {};

                for (let min = 0; min < maxMinutes; min++) {
                    const row: RetentionData = { minute: min };
                    results.forEach(({ vslId, data, duration }) => {
                        const point = data.find(d => d.minute === min);
                        row[vslId] = point?.retention || 0;

                        // Calculate pitch retention (at 70% of video)
                        const pitchMin = Math.floor((duration / 60) * 0.7);
                        if (min === pitchMin) {
                            pitchRets[vslId] = point?.retention || 0;
                        }
                    });
                    combined.push(row);
                }

                setRetentionData(combined);
                setPitchRetentions(pitchRets);
            } catch (err) {
                console.error('Error fetching retentions:', err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        // Initial fetch with loading
        fetchRetentions(true);

        // Silent refresh every 30 seconds
        intervalId = setInterval(() => {
            fetchRetentions(false); // Silent refresh - no loading spinner
        }, 30000);

        return () => {
            isMounted = false;
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [selectedVsls, startDate, endDate, vsls]);

    const formatPercent = (value: number) => `${(value || 0).toFixed(1)}%`;
    const formatNumber = (value: number) => new Intl.NumberFormat("pt-BR").format(value || 0);

    const getVslShortName = (name: string) => {
        // Extract key identifier like "LEAD 1", "LEAD 2" etc.
        const match = name.match(/\[LEAD \d+\]/i) || name.match(/\[V\d+\]/i);
        return match ? match[0].replace(/[\[\]]/g, '') : name.slice(0, 15);
    };

    return (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-orange-500" />
                    Comparação de VSLs
                </CardTitle>
                <CardDescription>
                    Selecione até 5 VSLs para comparar a retenção (selecione na tabela abaixo)
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Retention Chart */}
                <div className="h-[350px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : selectedVsls.size === 0 ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground border-2 border-dashed rounded-lg">
                            <p>Selecione VSLs na tabela abaixo para comparar retenção</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={retentionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis
                                    dataKey="minute"
                                    tickFormatter={(v) => `${v}:00`}
                                    className="text-xs"
                                />
                                <YAxis
                                    domain={[0, 100]}
                                    tickFormatter={(v) => `${v}%`}
                                    className="text-xs"
                                />
                                <Tooltip
                                    formatter={(value: number, name: string) => {
                                        const vsl = vsls.find(v => v.id === name);
                                        return [`${value.toFixed(1)}%`, getVslShortName(vsl?.name || name)];
                                    }}
                                    labelFormatter={(label) => `${label}:00`}
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--background))',
                                        borderColor: 'hsl(var(--border))'
                                    }}
                                />
                                <Legend
                                    formatter={(value) => {
                                        const vsl = vsls.find(v => v.id === value);
                                        return getVslShortName(vsl?.name || value);
                                    }}
                                />
                                {Array.from(selectedVsls).map((vslId, index) => (
                                    <Area
                                        key={vslId}
                                        type="monotone"
                                        dataKey={vslId}
                                        stroke={CHART_COLORS[index % CHART_COLORS.length]}
                                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                                        fillOpacity={0.1}
                                        strokeWidth={2}
                                    />
                                ))}
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Comparison Table */}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">
                                    <Checkbox
                                        checked={selectedVsls.size > 0 && selectedVsls.size >= Math.min(vsls.length, 5)}
                                        onCheckedChange={selectAll}
                                    />
                                </TableHead>
                                <TableHead>Nome</TableHead>
                                <TableHead className="text-right">Visualizações</TableHead>
                                <TableHead className="text-right">Vis. Únicas</TableHead>
                                <TableHead className="text-right">Plays</TableHead>
                                <TableHead className="text-right">Plays Únicos</TableHead>
                                <TableHead className="text-right">Play Rate</TableHead>
                                <TableHead className="text-right">Retenção no Pitch</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {vsls.map((vsl, index) => {
                                const isSelected = selectedVsls.has(vsl.id);
                                const playRate = vsl.viewed > 0 ? (vsl.started / vsl.viewed) * 100 : 0;
                                const pitchRet = pitchRetentions[vsl.id];
                                const colorIndex = Array.from(selectedVsls).indexOf(vsl.id);

                                return (
                                    <TableRow
                                        key={vsl.id}
                                        className={`hover:bg-muted/50 transition-colors ${isSelected ? 'bg-muted/30' : ''}`}
                                    >
                                        <TableCell>
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => toggleVsl(vsl.id)}
                                                disabled={!isSelected && selectedVsls.size >= 5}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                {isSelected && (
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: CHART_COLORS[colorIndex] }}
                                                    />
                                                )}
                                                <Play className="h-4 w-4 text-purple-500" />
                                                <span className="truncate max-w-[200px]" title={vsl.name}>
                                                    {vsl.name}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">
                                            {formatNumber(vsl.viewed)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">
                                            {formatNumber(vsl.unique_views || 0)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">
                                            {formatNumber(vsl.started)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">
                                            {formatNumber(vsl.unique_plays || 0)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant={playRate > 70 ? "default" : "secondary"}>
                                                {formatPercent(playRate)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {isSelected && pitchRet !== undefined ? (
                                                <Badge
                                                    variant={pitchRet > 20 ? "default" : "outline"}
                                                    className={pitchRet > 20 ? "bg-green-600" : ""}
                                                >
                                                    <Target className="h-3 w-3 mr-1" />
                                                    {formatPercent(pitchRet)}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">-</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}

                            {vsls.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                        Nenhuma VSL encontrada no período.
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
