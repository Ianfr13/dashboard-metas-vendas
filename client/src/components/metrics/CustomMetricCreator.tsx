import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Calculator } from "lucide-react";
import { FACEBOOK_METRICS, CalculatedMetric } from "@/lib/facebook-metrics";

const STORAGE_KEY = "custom_calculated_metrics";

export interface UserMetric extends CalculatedMetric {
    id: string;
}

// Load custom metrics from localStorage
export function loadUserMetrics(): UserMetric[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

// Save custom metrics to localStorage
export function saveUserMetrics(metrics: UserMetric[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(metrics));
}

interface CustomMetricCreatorProps {
    onMetricsChange: () => void; // Callback when metrics are added/removed
}

export default function CustomMetricCreator({ onMetricsChange }: CustomMetricCreatorProps) {
    const [open, setOpen] = useState(false);
    const [label, setLabel] = useState("");
    const [formula, setFormula] = useState("");
    const [format, setFormat] = useState<"currency" | "number" | "percent" | "decimal">("decimal");
    const [userMetrics, setUserMetrics] = useState<UserMetric[]>(loadUserMetrics);

    const availableMetrics = FACEBOOK_METRICS.map(m => m.key);

    const handleAddMetric = () => {
        if (!label.trim() || !formula.trim()) return;

        const newMetric: UserMetric = {
            id: `user_${Date.now()}`,
            key: `user_${label.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
            label: label.trim(),
            formula: formula.trim(),
            format,
            group: "calculated" as const,
        };

        const updated = [...userMetrics, newMetric];
        setUserMetrics(updated);
        saveUserMetrics(updated);
        onMetricsChange();

        // Reset form
        setLabel("");
        setFormula("");
        setFormat("decimal");
        setOpen(false);
    };

    const handleDeleteMetric = (id: string) => {
        const updated = userMetrics.filter(m => m.id !== id);
        setUserMetrics(updated);
        saveUserMetrics(updated);
        onMetricsChange();
    };

    const insertMetricKey = (key: string) => {
        setFormula(prev => prev ? `${prev} ${key}` : key);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h5 className="text-sm font-semibold text-muted-foreground uppercase flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Suas Métricas Personalizadas
                </h5>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 gap-2 text-sm">
                            <Plus className="h-4 w-4" />
                            Criar
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Criar Métrica Personalizada</DialogTitle>
                            <DialogDescription>
                                Crie uma métrica usando fórmulas matemáticas com os dados do Facebook.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="label">Nome da Métrica</Label>
                                <Input
                                    id="label"
                                    placeholder="Ex: Custo por Resultado"
                                    value={label}
                                    onChange={e => setLabel(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="formula">Fórmula</Label>
                                <Input
                                    id="formula"
                                    placeholder="Ex: spend / (leads + purchases)"
                                    value={formula}
                                    onChange={e => setFormula(e.target.value)}
                                    className="font-mono text-sm"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Use +, -, *, / e parênteses. Clique nas métricas abaixo para inserir.
                                </p>
                                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                                    {availableMetrics.map(key => (
                                        <Badge
                                            key={key}
                                            variant="outline"
                                            className="cursor-pointer hover:bg-secondary text-xs"
                                            onClick={() => insertMetricKey(key)}
                                        >
                                            {key}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Formato</Label>
                                <Select value={format} onValueChange={(v: any) => setFormat(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="currency">Moeda (R$)</SelectItem>
                                        <SelectItem value="number">Número</SelectItem>
                                        <SelectItem value="percent">Percentual (%)</SelectItem>
                                        <SelectItem value="decimal">Decimal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpen(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleAddMetric} disabled={!label.trim() || !formula.trim()}>
                                Criar Métrica
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {userMetrics.length === 0 ? (
                <p className="text-sm text-muted-foreground italic py-2">
                    Nenhuma métrica personalizada. Clique em "Criar" para adicionar.
                </p>
            ) : (
                <div className="space-y-3">
                    {userMetrics.map(metric => (
                        <div key={metric.id} className="flex items-center justify-between group p-2 rounded-md hover:bg-muted/50">
                            <div className="flex-1 min-w-0">
                                <span className="text-base font-medium block truncate">{metric.label}</span>
                                <span className="text-sm text-muted-foreground font-mono truncate block">
                                    {metric.formula}
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                                onClick={() => handleDeleteMetric(metric.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
