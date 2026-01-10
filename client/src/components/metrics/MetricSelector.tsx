import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Settings2, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { FACEBOOK_METRICS, CALCULATED_METRICS, DEFAULT_METRICS, METRIC_GROUPS, MetricConfig, CalculatedMetric } from "@/lib/facebook-metrics";
import CustomMetricCreator, { loadUserMetrics, UserMetric } from "./CustomMetricCreator";

interface MetricSelectorProps {
    selectedMetrics: string[];
    onChange: (metrics: string[]) => void;
}

export default function MetricSelector({ selectedMetrics, onChange }: MetricSelectorProps) {
    const [open, setOpen] = useState(false);
    const [userMetrics, setUserMetrics] = useState<UserMetric[]>(loadUserMetrics);
    const [refreshKey, setRefreshKey] = useState(0);

    const toggleMetric = (key: string) => {
        if (selectedMetrics.includes(key)) {
            onChange(selectedMetrics.filter(m => m !== key));
        } else {
            onChange([...selectedMetrics, key]);
        }
    };

    const resetToDefault = () => {
        onChange(DEFAULT_METRICS);
        setOpen(false);
    };

    const handleUserMetricsChange = useCallback(() => {
        setUserMetrics(loadUserMetrics());
        setRefreshKey(k => k + 1);
    }, []);

    // Combine all metrics including user-created ones
    const allMetrics: (MetricConfig | CalculatedMetric | UserMetric)[] = [
        ...FACEBOOK_METRICS,
        ...CALCULATED_METRICS,
        ...userMetrics
    ];

    // Group all metrics
    const groupedMetrics = allMetrics.reduce((acc, metric) => {
        if (!acc[metric.group]) acc[metric.group] = [];
        acc[metric.group].push(metric);
        return acc;
    }, {} as Record<string, (MetricConfig | CalculatedMetric | UserMetric)[]>);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Settings2 className="h-4 w-4" />
                    Métricas ({selectedMetrics.length})
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[480px] p-5" align="end">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-base">Selecionar Métricas</h4>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetToDefault}
                            className="h-8 text-xs"
                        >
                            Resetar Padrão
                        </Button>
                    </div>

                    <div className="flex flex-wrap gap-1">
                        {selectedMetrics.map(key => {
                            const metric = allMetrics.find(m => m.key === key);
                            return (
                                <Badge
                                    key={key}
                                    variant="secondary"
                                    className="gap-1 pr-1 cursor-pointer hover:bg-secondary/80"
                                    onClick={() => toggleMetric(key)}
                                >
                                    {metric?.label || key}
                                    <X className="h-3 w-3" />
                                </Badge>
                            );
                        })}
                    </div>

                    <div className="max-h-[500px] overflow-y-auto space-y-5">
                        {/* Built-in metrics */}
                        {Object.entries(groupedMetrics)
                            .filter(([group]) => group !== 'calculated')
                            .map(([group, metrics]) => (
                                <div key={group} className="space-y-2">
                                    <h5 className="text-xs font-medium text-muted-foreground uppercase">
                                        {METRIC_GROUPS[group as keyof typeof METRIC_GROUPS]}
                                    </h5>
                                    <div className="space-y-2">
                                        {metrics.map(metric => (
                                            <div key={metric.key} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={metric.key}
                                                    checked={selectedMetrics.includes(metric.key)}
                                                    onCheckedChange={() => toggleMetric(metric.key)}
                                                />
                                                <label
                                                    htmlFor={metric.key}
                                                    className="text-sm cursor-pointer flex-1"
                                                >
                                                    {metric.label}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                        {/* Calculated metrics (built-in + user) */}
                        {groupedMetrics['calculated'] && groupedMetrics['calculated'].length > 0 && (
                            <div className="space-y-2">
                                <h5 className="text-xs font-medium text-muted-foreground uppercase">
                                    {METRIC_GROUPS.calculated}
                                </h5>
                                <div className="space-y-2">
                                    {groupedMetrics['calculated'].map(metric => (
                                        <div key={metric.key} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={metric.key}
                                                checked={selectedMetrics.includes(metric.key)}
                                                onCheckedChange={() => toggleMetric(metric.key)}
                                            />
                                            <label
                                                htmlFor={metric.key}
                                                className="text-sm cursor-pointer flex-1"
                                            >
                                                {metric.label}
                                                {'formula' in metric && (
                                                    <span className="text-xs text-muted-foreground ml-1 font-mono">
                                                        ({metric.formula})
                                                    </span>
                                                )}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Custom Metric Creator */}
                        <div className="pt-2 border-t">
                            <CustomMetricCreator onMetricsChange={handleUserMetricsChange} />
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

