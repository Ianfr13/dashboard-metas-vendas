import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface HealthMetric {
  name: string;
  value: number;
  target: number;
  weight: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

interface HealthScoreProps {
  metrics: HealthMetric[];
}

export default function HealthScore({ metrics }: HealthScoreProps) {
  // Calcular score geral ponderado
  const totalScore = metrics.reduce((sum, metric) => {
    const percentage = (metric.value / metric.target) * 100;
    const score = Math.min(percentage, 100);
    return sum + (score * metric.weight);
  }, 0) / metrics.reduce((sum, m) => sum + m.weight, 0);

  const getScoreColor = (score: number) => {
    if (score >= 90) return { color: 'text-green-500', bg: 'bg-green-500', label: 'Excelente', icon: CheckCircle };
    if (score >= 70) return { color: 'text-blue-500', bg: 'bg-blue-500', label: 'Bom', icon: TrendingUp };
    if (score >= 50) return { color: 'text-yellow-500', bg: 'bg-yellow-500', label: 'Atenção', icon: AlertTriangle };
    return { color: 'text-red-500', bg: 'bg-red-500', label: 'Crítico', icon: AlertCircle };
  };

  const getMetricStatus = (status: string) => {
    switch (status) {
      case 'excellent':
        return { color: 'text-green-500', icon: CheckCircle, badge: 'default' as const };
      case 'good':
        return { color: 'text-blue-500', icon: TrendingUp, badge: 'secondary' as const };
      case 'warning':
        return { color: 'text-yellow-500', icon: AlertTriangle, badge: 'outline' as const };
      case 'critical':
        return { color: 'text-red-500', icon: AlertCircle, badge: 'destructive' as const };
      default:
        return { color: 'text-gray-500', icon: AlertCircle, badge: 'secondary' as const };
    }
  };

  const scoreInfo = getScoreColor(totalScore);
  const ScoreIcon = scoreInfo.icon;

  return (
    <div className="space-y-4">
      {/* Score Geral */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Score de Saúde do Negócio</span>
            <Badge variant={totalScore >= 70 ? "default" : "destructive"}>
              {scoreInfo.label}
            </Badge>
          </CardTitle>
          <CardDescription>Indicador geral de performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - totalScore / 100)}`}
                  className={scoreInfo.color}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <ScoreIcon className={`h-8 w-8 ${scoreInfo.color}`} />
                <p className={`text-3xl font-bold ${scoreInfo.color}`}>
                  {totalScore.toFixed(0)}
                </p>
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <p className="text-sm text-muted-foreground">
                Score calculado com base em {metrics.length} métricas principais ponderadas por importância.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>90-100: Excelente</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>70-89: Bom</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span>50-69: Atenção</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>0-49: Crítico</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detalhamento das Métricas */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento das Métricas</CardTitle>
          <CardDescription>Status individual de cada indicador</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {metrics.map((metric, index) => {
            const percentage = (metric.value / metric.target) * 100;
            const status = getMetricStatus(metric.status);
            const StatusIcon = status.icon;

            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`h-4 w-4 ${status.color}`} />
                    <span className="font-medium text-sm">{metric.name}</span>
                    <Badge variant={status.badge} className="text-xs">
                      Peso: {(metric.weight * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {metric.value.toFixed(0)} / {metric.target.toFixed(0)}
                  </span>
                </div>
                <Progress value={Math.min(percentage, 100)} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {percentage.toFixed(1)}% da meta atingida
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Alertas e Recomendações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Alertas e Recomendações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {metrics
            .filter(m => m.status === 'warning' || m.status === 'critical')
            .map((metric, index) => {
              const status = getMetricStatus(metric.status);
              const StatusIcon = status.icon;
              
              return (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <StatusIcon className={`h-5 w-5 ${status.color} mt-0.5`} />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{metric.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {metric.status === 'critical' 
                        ? `Atenção! Métrica abaixo de 50% da meta. Ação imediata necessária.`
                        : `Métrica abaixo do esperado. Considere revisar estratégias.`}
                    </p>
                  </div>
                </div>
              );
            })}
          {metrics.filter(m => m.status === 'warning' || m.status === 'critical').length === 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <p className="text-sm text-green-600 dark:text-green-400">
                Todas as métricas estão dentro do esperado. Continue assim!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
