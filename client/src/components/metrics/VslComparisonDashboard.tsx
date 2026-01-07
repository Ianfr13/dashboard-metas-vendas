import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingDown, Play, Target, Clock, Users } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
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
    [key: string]: number;
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

// Extract LEAD identifier from name like "PVA [VSL] [LEAD 1] [FILHOS] [V1]"
const extractLeadId = (name: string): string | null => {
    const match = name.match(/\[LEAD\s*(\d+)\]/i);
    return match ? `LEAD ${match[1]}` : null;
};

// Extract base name (everything except LEAD part)
const extractBaseName = (name: string): string => {
    return name.replace(/\[LEAD\s*\d+\]/i, '').replace(/\s+/g, ' ').trim();
};

// Group VSLs by their base name (same VSL with different LEADs)
const groupVslsByBaseName = (vsls: VslData[]): Record<string, VslData[]> => {
    const groups: Record<string, VslData[]> = {};

    vsls.forEach(vsl => {
        const baseName = extractBaseName(vsl.name);
        if (!groups[baseName]) {
            groups[baseName] = [];
        }
        groups[baseName].push(vsl);
    });

    // Sort each group by LEAD number
    Object.keys(groups).forEach(key => {
        groups[key].sort((a, b) => {
            const leadA = extractLeadId(a.name);
            const leadB = extractLeadId(b.name);
            if (!leadA || !leadB) return 0;
            return parseInt(leadA.replace(/\D/g, '')) - parseInt(leadB.replace(/\D/g, ''));
        });
    });

    return groups;
};

export default function VslComparisonDashboard({ vsls, startDate, endDate }: VslComparisonDashboardProps) {
    const [selectedVsls, setSelectedVsls] = useState<Set<string>>(new Set());
    const [retentionData, setRetentionData] = useState<RetentionData[]>([]);
    const [pitchRetentions, setPitchRetentions] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);

    // useRef to track if initial data has loaded (prevents flicker)
    const hasLoadedRef = useRef(false);

    // New: Customizable pitch time (in minutes)
    const [customPitchMinute, setCustomPitchMinute] = useState<number>(18);

    // New: Group filter
    const [selectedGroup, setSelectedGroup] = useState<string>("all");

    // Group VSLs by base name
    const groupedVsls = useMemo(() => groupVslsByBaseName(vsls), [vsls]);
    const groupNames = useMemo(() => Object.keys(groupedVsls), [groupedVsls]);

    // Filter VSLs based on selected group
    const filteredVsls = useMemo(() => {
        if (selectedGroup === "all") return vsls;
        return groupedVsls[selectedGroup] || vsls;
    }, [vsls, selectedGroup, groupedVsls]);

    const toggleVsl = (id: string) => {
        const newSet = new Set(selectedVsls);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            if (newSet.size < 5) {
                newSet.add(id);
            }
        }
        setSelectedVsls(newSet);
    };

    const selectAll = () => {
        if (selectedVsls.size === filteredVsls.length || selectedVsls.size >= 5) {
            setSelectedVsls(new Set());
        } else {
            setSelectedVsls(new Set(filteredVsls.slice(0, 5).map(v => v.id)));
        }
    };

    useEffect(() => {
        if (selectedVsls.size === 0) {
            setRetentionData([]);
            setPitchRetentions({});
            hasLoadedRef.current = false;
            return;
        }

        let isMounted = true;
        let intervalId: NodeJS.Timeout | null = null;

        const fetchRetentions = async () => {
            // Only show loading on first fetch (hasLoadedRef is false)
            if (!hasLoadedRef.current) {
                setLoading(true);
            }

            try {
                const start = format(startDate, 'yyyy-MM-dd');
                const end = format(endDate, 'yyyy-MM-dd');

                const promises = Array.from(selectedVsls).map(async (vslId) => {
                    const vsl = vsls.find(v => v.id === vslId);
                    const duration = vsl?.duration || 1800;
                    const data = await vturbAnalyticsAPI.getEngagement(vslId, start, end, duration);
                    return { vslId, data, duration };
                });

                const results = await Promise.all(promises);

                if (!isMounted) return;

                const maxMinutes = Math.max(...results.map(r => r.data.length), 30);
                const combined: RetentionData[] = [];
                const pitchRets: Record<string, number> = {};

                for (let min = 0; min < maxMinutes; min++) {
                    const row: RetentionData = { minute: min };
                    results.forEach(({ vslId, data }) => {
                        const point = data.find(d => d.minute === min);
                        row[vslId] = point?.retention || 0;

                        // Use custom pitch minute for retention calculation
                        if (min === customPitchMinute) {
                            pitchRets[vslId] = point?.retention || 0;
                        }
                    });
                    combined.push(row);
                }

                setRetentionData(combined);
                setPitchRetentions(pitchRets);
                hasLoadedRef.current = true; // Mark as loaded to prevent future loading spinners
            } catch (err) {
                console.error('Error fetching retentions:', err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchRetentions();

        intervalId = setInterval(() => {
            fetchRetentions();
        }, 30000);

        return () => {
            isMounted = false;
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [selectedVsls, startDate, endDate, vsls, customPitchMinute]);

    const formatPercent = (value: number) => `${(value || 0).toFixed(1)}%`;
    const formatNumber = (value: number) => new Intl.NumberFormat("pt-BR").format(value || 0);

    const getLeadLabel = (name: string) => {
        const leadId = extractLeadId(name);
        return leadId || name.slice(0, 15);
    };

    // Calculate summary metrics for comparison
    const summaryMetrics = useMemo(() => {
        const selected = filteredVsls.filter(v => selectedVsls.has(v.id));
        return selected.map(vsl => {
            const playRate = vsl.viewed > 0 ? (vsl.started / vsl.viewed) * 100 : 0;
            const completionRate = vsl.started > 0 ? (vsl.finished / vsl.started) * 100 : 0;
            const engagementRate = vsl.viewed > 0 ? (vsl.finished / vsl.viewed) * 100 : 0;

            return {
                ...vsl,
                leadLabel: getLeadLabel(vsl.name),
                playRate,
                completionRate,
                engagementRate,
                pitchRetention: pitchRetentions[vsl.id] || 0
            };
        });
    }, [filteredVsls, selectedVsls, pitchRetentions]);

    return (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingDown className="h-5 w-5 text-orange-500" />
                            Comparação de VSLs por LEAD
                        </CardTitle>
                        <CardDescription>
                            Compare a performance de diferentes LEADs da mesma VSL
                        </CardDescription>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-4 flex-wrap">
                        {/* Group Filter */}
                        <div className="flex items-center gap-2">
                            <Label htmlFor="group-filter" className="text-sm whitespace-nowrap">
                                <Users className="h-4 w-4 inline mr-1" />
                                Grupo:
                            </Label>
                            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Todos os grupos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    {groupNames.map(name => (
                                        <SelectItem key={name} value={name}>
                                            {name.slice(0, 30)}...
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Pitch Time Input */}
                        <div className="flex items-center gap-2">
                            <Label htmlFor="pitch-time" className="text-sm whitespace-nowrap">
                                <Clock className="h-4 w-4 inline mr-1" />
                                Pitch (min):
                            </Label>
                            <Input
                                id="pitch-time"
                                type="number"
                                min={1}
                                max={60}
                                value={customPitchMinute}
                                onChange={(e) => setCustomPitchMinute(parseInt(e.target.value) || 18)}
                                className="w-20"
                            />
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Summary Cards for Selected VSLs */}
                {summaryMetrics.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {summaryMetrics.map((vsl, idx) => (
                            <div
                                key={vsl.id}
                                className="p-3 rounded-lg border"
                                style={{ borderColor: CHART_COLORS[idx], borderWidth: 2 }}
                            >
                                <p className="font-semibold text-sm mb-2" style={{ color: CHART_COLORS[idx] }}>
                                    {vsl.leadLabel}
                                </p>
                                <div className="space-y-1 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Play Rate:</span>
                                        <span className="font-mono">{formatPercent(vsl.playRate)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Conclusão:</span>
                                        <span className="font-mono">{formatPercent(vsl.completionRate)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Ret. Pitch:</span>
                                        <span className="font-mono font-bold">{formatPercent(vsl.pitchRetention)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

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
                                        return [`${value.toFixed(1)}%`, getLeadLabel(vsl?.name || name)];
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
                                        return getLeadLabel(vsl?.name || value);
                                    }}
                                />
                                {/* Pitch Reference Line */}
                                <ReferenceLine
                                    x={customPitchMinute}
                                    stroke="#ef4444"
                                    strokeDasharray="5 5"
                                    label={{ value: 'Pitch', position: 'top', fill: '#ef4444', fontSize: 11 }}
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
                                        checked={selectedVsls.size > 0 && selectedVsls.size >= Math.min(filteredVsls.length, 5)}
                                        onCheckedChange={selectAll}
                                    />
                                </TableHead>
                                <TableHead>LEAD / Nome</TableHead>
                                <TableHead className="text-right">Visualizações</TableHead>
                                <TableHead className="text-right">Plays</TableHead>
                                <TableHead className="text-right">Play Rate</TableHead>
                                <TableHead className="text-right">Finalizações</TableHead>
                                <TableHead className="text-right">Conclusão</TableHead>
                                <TableHead className="text-right">Ret. Pitch ({customPitchMinute}min)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredVsls.map((vsl) => {
                                const isSelected = selectedVsls.has(vsl.id);
                                const playRate = vsl.viewed > 0 ? (vsl.started / vsl.viewed) * 100 : 0;
                                const completionRate = vsl.started > 0 ? (vsl.finished / vsl.started) * 100 : 0;
                                const pitchRet = pitchRetentions[vsl.id];
                                const colorIndex = Array.from(selectedVsls).indexOf(vsl.id);
                                const leadLabel = getLeadLabel(vsl.name);

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
                                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: CHART_COLORS[colorIndex] }}
                                                    />
                                                )}
                                                <Play className="h-4 w-4 text-purple-500 flex-shrink-0" />
                                                <div className="flex flex-col">
                                                    <span className="font-bold">{leadLabel}</span>
                                                    <span className="text-xs text-muted-foreground truncate max-w-[180px]" title={vsl.name}>
                                                        {vsl.name}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">
                                            {formatNumber(vsl.viewed)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">
                                            {formatNumber(vsl.started)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant={playRate > 70 ? "default" : "secondary"}>
                                                {formatPercent(playRate)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">
                                            {formatNumber(vsl.finished)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant={completionRate > 10 ? "default" : "outline"}
                                                className={completionRate > 10 ? "bg-green-600" : ""}>
                                                {formatPercent(completionRate)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {isSelected && pitchRet !== undefined ? (
                                                <Badge
                                                    variant={pitchRet > 20 ? "default" : "outline"}
                                                    className={pitchRet > 20 ? "bg-orange-600" : ""}
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

                            {filteredVsls.length === 0 && (
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
