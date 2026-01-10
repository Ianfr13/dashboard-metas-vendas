import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Settings2, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { FACEBOOK_METRICS, CALCULATED_METRICS, DEFAULT_METRICS, METRIC_GROUPS, MetricConfig, CalculatedMetric, ALL_METRICS } from "@/lib/facebook-metrics";

interface MetricSelectorProps {
    selectedMetrics: string[];
    onChange: (metrics: string[]) => void;
}

export default function MetricSelector({ selectedMetrics, onChange }: MetricSelectorProps) {
    const [open, setOpen] = useState(false);

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

    // Group all metrics (regular + calculated)
    const groupedMetrics = [...FACEBOOK_METRICS, ...CALCULATED_METRICS].reduce((acc, metric) => {
        if (!acc[metric.group]) acc[metric.group] = [];
        acc[metric.group].push(metric);
        return acc;
    }, {} as Record<string, (MetricConfig | CalculatedMetric)[]>);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Settings2 className="h-4 w-4" />
                    Métricas ({selectedMetrics.length})
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-4" align="end">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">Selecionar Métricas</h4>
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
                            const metric = [...FACEBOOK_METRICS, ...CALCULATED_METRICS].find(m => m.key === key);
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

                    <div className="max-h-96 overflow-y-auto space-y-4">
                        {Object.entries(groupedMetrics).map(([group, metrics]) => (
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
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
