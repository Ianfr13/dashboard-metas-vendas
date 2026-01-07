import { useState, useEffect, useMemo } from "react";
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

interface VslSettings {
    pitchTime: number;
    leadTime: number;
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
    const [loading, setLoading] = useState(false);

    // Individual settings for each VSL
    const [vslSettings, setVslSettings] = useState<Record<string, VslSettings>>({});

    // useRef to track if initial data has loaded (prevents flicker)


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

    const updateVslSetting = (id: string, field: keyof VslSettings, value: number) => {
        setVslSettings(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
    };

    useEffect(() => {
        if (selectedVsls.size === 0) {
            setRetentionData([]);
            return;
        }

        let isMounted = true;
        let intervalId: NodeJS.Timeout | null = null;

        const fetchRetentions = async () => {
            // Only show full loading state if we don't have any data yet
            if (retentionData.length === 0) {
                setLoading(true);
            }

            try {
                const start = format(startDate, 'yyyy-MM-dd');
                const end = format(endDate, 'yyyy-MM-dd');

                const promises = Array.from(selectedVsls).map(async (vslId) => {
                    const vsl = vsls.find(v => v.id === vslId);
                    const duration = vsl?.duration || 1800; // Default to 30 mins if missing
                    const data = await vturbAnalyticsAPI.getEngagement(vslId, start, end, duration);
                    return { vslId, data, duration };
                });

                const results = await Promise.all(promises);

                if (!isMounted) return;

                const maxMinutes = Math.max(...results.map(r => r.data.length), 30);
                const combined: RetentionData[] = [];

                for (let min = 0; min < maxMinutes; min++) {
                    const row: RetentionData = { minute: min };
                    results.forEach(({ vslId, data }) => {
                        const point = data.find(d => d.minute === min);
                        row[vslId] = point?.retention || 0;
                    });
                    combined.push(row);
                }

                setRetentionData(combined);
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
    }, [selectedVsls, startDate, endDate, vsls]);

    // Initialize settings from localStorage or defaults
    useEffect(() => {
        const savedSettings = localStorage.getItem('vsl_dashboard_settings');
        const parsedSettings = savedSettings ? JSON.parse(savedSettings) : {};

        setVslSettings(prev => {
            const next = { ...parsedSettings, ...prev };
            let changed = false;

            selectedVsls.forEach(id => {
                if (!next[id]) {
                    next[id] = { pitchTime: 18, leadTime: 5 }; // Defaults
                    changed = true;
                }
            });

            return changed ? next : prev;
        });
    }, [selectedVsls]);

    // Save settings to localStorage whenever they change
    useEffect(() => {
        if (Object.keys(vslSettings).length > 0) {
            localStorage.setItem('vsl_dashboard_settings', JSON.stringify(vslSettings));
        }
    }, [vslSettings]);

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
            const settings = vslSettings[vsl.id] || { pitchTime: 18, leadTime: 5 };

            // Find retention at specific minutes
            const pitchData = retentionData.find(d => d.minute === settings.pitchTime);
            const leadData = retentionData.find(d => d.minute === settings.leadTime);

            const pitchRetention = pitchData ? (pitchData[vsl.id] || 0) : 0;
            const leadRetention = leadData ? (leadData[vsl.id] || 0) : 0;

            // Placeholder conversion (requires sales data)
            const conversion = 0;

            return {
                ...vsl,
                leadLabel: getLeadLabel(vsl.name),
                pitchRetention,
                leadRetention,
                conversion,
                settings
            };
        });
    }, [filteredVsls, selectedVsls, vslSettings, retentionData]);

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
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Summary Cards for Selected VSLs */}
                {summaryMetrics.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {summaryMetrics.map((vsl, idx) => (
                            <div
                                key={vsl.id}
                                className="p-3 rounded-lg border flex flex-col gap-3"
                                style={{ borderColor: CHART_COLORS[idx], borderWidth: 2 }}
                            >
                                <p className="font-semibold text-sm" style={{ color: CHART_COLORS[idx] }}>
                                    {vsl.leadLabel}
                                </p>

                                <div className="space-y-2">
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs text-muted-foreground">Tempo Pitch (min)</Label>
                                            <Input
                                                type="number"
                                                className="w-12 h-6 text-xs px-1 text-right"
                                                value={vsl.settings.pitchTime}
                                                onChange={(e) => updateVslSetting(vsl.id, 'pitchTime', parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="flex justify-between items-center bg-muted/20 p-1 rounded">
                                            <span className="text-xs">Retenção Pitch</span>
                                            <span className="text-sm font-bold">{formatPercent(vsl.pitchRetention)}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs text-muted-foreground">Tempo Lead (min)</Label>
                                            <Input
                                                type="number"
                                                className="w-12 h-6 text-xs px-1 text-right"
                                                value={vsl.settings.leadTime}
                                                onChange={(e) => updateVslSetting(vsl.id, 'leadTime', parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="flex justify-between items-center bg-muted/20 p-1 rounded">
                                            <span className="text-xs">Retenção Lead</span>
                                            <span className="text-sm font-bold">{formatPercent(vsl.leadRetention)}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-1 border-t">
                                        <span className="text-xs text-muted-foreground">Conversão</span>
                                        <span className="text-sm font-bold">-</span>
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
                                <TableHead className="text-right">Ret. Pitch</TableHead>
                                <TableHead className="text-right">Ret. Lead</TableHead>
                                <TableHead className="text-right">Conversão</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredVsls.map((vsl) => {
                                const isSelected = selectedVsls.has(vsl.id);
                                const playRate = vsl.viewed > 0 ? (vsl.started / vsl.viewed) * 100 : 0;
                                const colorIndex = Array.from(selectedVsls).indexOf(vsl.id);
                                const leadLabel = getLeadLabel(vsl.name);

                                // Get calculated metrics from summaryMetrics if selected, otherwise defaults/0
                                const summary = summaryMetrics.find(s => s.id === vsl.id);
                                const pitchRet = summary?.pitchRetention;
                                const leadRet = summary?.leadRetention;

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
                                        <TableCell className="text-right">
                                            {isSelected && pitchRet !== undefined ? (
                                                <span className="font-mono font-medium">{formatPercent(pitchRet)}</span>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {isSelected && leadRet !== undefined ? (
                                                <span className="font-mono font-medium">{formatPercent(leadRet)}</span>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="text-muted-foreground text-sm">-</span>
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
