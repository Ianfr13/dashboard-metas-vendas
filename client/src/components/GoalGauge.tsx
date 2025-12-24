import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GoalGaugeProps {
  current: number;
  target: number;
  completedMilestones: number[];
  upcomingMilestones: number[];
  onPeriodChange?: (period: string) => void;
}

export function GoalGauge({ 
  current, 
  target, 
  completedMilestones, 
  upcomingMilestones,
  onPeriodChange 
}: GoalGaugeProps) {
  const percentage = Math.min((current / target) * 100, 100);
  
  // Configuração do semicírculo
  const size = 200;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * Math.PI; // Semicírculo
  const progress = (percentage / 100) * circumference;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    return `R$ ${(value / 1000).toFixed(0)}k`;
  };

  return (
    <div className="space-y-6">
      {/* Filtro de Período */}
      <div className="flex justify-end">
        <Select defaultValue="mensal" onValueChange={onPeriodChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="diario">Diário</SelectItem>
            <SelectItem value="semanal">Semanal</SelectItem>
            <SelectItem value="mensal">Mensal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="p-8 bg-card">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Gauge Semicircular */}
          <div className="flex-shrink-0">
            <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
              <svg
                width={size}
                height={size / 2 + 20}
                className="overflow-visible"
              >
                {/* Background arc */}
                <path
                  d={`M ${strokeWidth / 2} ${size / 2}
                      A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  className="text-muted/10"
                />
                
                {/* Progress arc */}
                <path
                  d={`M ${strokeWidth / 2} ${size / 2}
                      A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
                  fill="none"
                  stroke="url(#gaugeGradient)"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - progress}
                  className="transition-all duration-1000 ease-out"
                />
                
                {/* Gradient */}
                <defs>
                  <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00a67d" />
                    <stop offset="50%" stopColor="#418ecb" />
                    <stop offset="100%" stopColor="#5a4b99" />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Percentage in center */}
              <div className="absolute inset-0 flex items-end justify-center pb-2">
                <div className="text-center">
                  <div className="text-5xl font-bold text-foreground tabular-nums">
                    {percentage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    da meta atingida
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Milestones */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
            {/* Completed Milestones */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Metas Batidas
              </h3>
              <div className="space-y-3">
                {completedMilestones.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    Nenhuma meta batida ainda
                  </p>
                ) : (
                  completedMilestones.map((value, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 text-foreground"
                    >
                      <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                      <span className="line-through text-muted-foreground font-medium">
                        {formatCurrency(value)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Upcoming Milestones */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Próximas Metas
              </h3>
              <div className="space-y-3">
                {upcomingMilestones.length === 0 ? (
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                    🎉 Todas as metas foram atingidas!
                  </p>
                ) : (
                  upcomingMilestones.map((value, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 text-foreground"
                    >
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 animate-pulse" />
                      <span className="font-medium">
                        {formatCurrency(value)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
