import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingDown, Clock, Target } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { vturbAnalyticsAPI } from "@/lib/edge-functions";
import { format } from "date-fns";

interface VslData {
    id: string;
    name: string;
    duration?: number;
}

interface RetentionData {
    minute: number;
    retention: number;
    viewers: number;
}

interface VslRetentionChartProps {
    vsls: VslData[];
    startDate: Date;
    endDate: Date;
}

export default function VslRetentionChart({ vsls, startDate, endDate }: VslRetentionChartProps) {
    const [selectedVsl, setSelectedVsl] = useState<string>("");
    const [retentionData, setRetentionData] = useState<RetentionData[]>([]);
    const [loading, setLoading] = useState(false);
    const [pitchMinute, setPitchMinute] = useState<number>(0);

    // Find selected VSL info
    const selectedVslInfo = vsls.find(v => v.id === selectedVsl);

    useEffect(() => {
        if (!selectedVsl) return;

        const fetchRetention = async () => {
            setLoading(true);
            try {
                const start = format(startDate, 'yyyy-MM-dd');
                const end = format(endDate, 'yyyy-MM-dd');
                const duration = selectedVslInfo?.duration || 1800;

                const data = await vturbAnalyticsAPI.getEngagement(selectedVsl, start, end, duration);
                setRetentionData(data);

                // Calculate pitch minute (typically around 70% of video)
                const durationMinutes = Math.ceil(duration / 60);
                setPitchMinute(Math.floor(durationMinutes * 0.7));
            } catch (err) {
                console.error('Error fetching retention:', err);
                setRetentionData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchRetention();
    }, [selectedVsl, startDate, endDate, selectedVslInfo?.duration]);

    // Calculate pitch retention
    const pitchRetention = retentionData.find(d => d.minute === pitchMinute)?.retention || 0;

    return (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingDown className="h-5 w-5 text-orange-500" />
                            Curva de Retenção
                        </CardTitle>
                        <CardDescription>Retenção de audiência por minuto do vídeo</CardDescription>
                    </div>
                    <Select value={selectedVsl} onValueChange={setSelectedVsl}>
                        <SelectTrigger className="w-[280px]">
                            <SelectValue placeholder="Selecione uma VSL..." />
                        </SelectTrigger>
                        <SelectContent>
                            {vsls.map((vsl) => (
                                <SelectItem key={vsl.id} value={vsl.id}>
                                    {vsl.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                {!selectedVsl ? (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        <p>Selecione uma VSL para ver a curva de retenção</p>
                    </div>
                ) : loading ? (
                    <div className="flex items-center justify-center h-[300px]">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : retentionData.length === 0 ? (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        <p>Nenhum dado de retenção disponível</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Pitch Retention Badge */}
                        <div className="flex items-center gap-4">
                            <Badge variant="outline" className="flex items-center gap-2 px-3 py-1">
                                <Target className="h-4 w-4 text-orange-500" />
                                Retenção no Pitch (min {pitchMinute}):
                                <span className={`font-bold ${pitchRetention > 30 ? 'text-green-600' : pitchRetention > 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                                    {pitchRetention.toFixed(1)}%
                                </span>
                            </Badge>
                            {selectedVslInfo?.duration && (
                                <Badge variant="secondary" className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Duração: {Math.floor(selectedVslInfo.duration / 60)}min
                                </Badge>
                            )}
                        </div>

                        {/* Retention Chart */}
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={retentionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="retentionGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis
                                    dataKey="minute"
                                    tickFormatter={(v) => `${v}min`}
                                    className="text-xs"
                                />
                                <YAxis
                                    domain={[0, 100]}
                                    tickFormatter={(v) => `${v}%`}
                                    className="text-xs"
                                />
                                <Tooltip
                                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Retenção']}
                                    labelFormatter={(label) => `Minuto ${label}`}
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--background))',
                                        borderColor: 'hsl(var(--border))'
                                    }}
                                />
                                {/* Reference line for pitch moment */}
                                <ReferenceLine
                                    x={pitchMinute}
                                    stroke="#ef4444"
                                    strokeDasharray="3 3"
                                    label={{ value: 'Pitch', position: 'top', fill: '#ef4444', fontSize: 12 }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="retention"
                                    stroke="#f97316"
                                    fillOpacity={1}
                                    fill="url(#retentionGradient)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
