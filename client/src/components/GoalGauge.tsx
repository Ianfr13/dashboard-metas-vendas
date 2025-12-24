import { Card } from "@/components/ui/card";

interface GoalGaugeProps {
  current: number;
  target: number;
  completedGoals: string[];
  upcomingGoals: string[];
}

export function GoalGauge({ current, target, completedGoals, upcomingGoals }: GoalGaugeProps) {
  const percentage = Math.min((current / target) * 100, 100);
  const radius = 120;
  const strokeWidth = 20;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * Math.PI; // Semicírculo
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="p-8">
      <div className="flex flex-col items-center gap-6">
        {/* Gauge Semicircular */}
        <div className="relative">
          <svg
            height={radius + strokeWidth}
            width={(radius + strokeWidth) * 2}
            className="transform -rotate-90"
          >
            {/* Background arc */}
            <path
              d={`M ${strokeWidth / 2} ${radius + strokeWidth / 2}
                  A ${normalizedRadius} ${normalizedRadius} 0 0 1 ${radius * 2 + strokeWidth / 2} ${radius + strokeWidth / 2}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-muted/20"
            />
            {/* Progress arc */}
            <path
              d={`M ${strokeWidth / 2} ${radius + strokeWidth / 2}
                  A ${normalizedRadius} ${normalizedRadius} 0 0 1 ${radius * 2 + strokeWidth / 2} ${radius + strokeWidth / 2}`}
              fill="none"
              stroke="url(#gradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
            {/* Gradient definition */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00a67d" />
                <stop offset="50%" stopColor="#418ecb" />
                <stop offset="100%" stopColor="#5a4b99" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
            <div className="text-5xl font-bold text-foreground">
              {percentage.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground mt-1">da meta</div>
          </div>
        </div>

        {/* Current vs Target */}
        <div className="text-center space-y-1">
          <div className="text-2xl font-bold text-foreground">
            {formatCurrency(current)} <span className="text-muted-foreground">de</span> {formatCurrency(target)}
          </div>
          <div className="text-sm text-muted-foreground">
            Faltam {formatCurrency(target - current)} para atingir a meta
          </div>
        </div>

        {/* Goals Lists */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Completed Goals */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Metas Batidas
            </h3>
            <div className="space-y-2">
              {completedGoals.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Nenhuma meta batida ainda</p>
              ) : (
                completedGoals.map((goal, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                    <span className="line-through">{goal}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Goals */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Próximas Metas
            </h3>
            <div className="space-y-2">
              {upcomingGoals.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Todas as metas foram atingidas! 🎉</p>
              ) : (
                upcomingGoals.map((goal, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-foreground"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 animate-pulse" />
                    <span>{goal}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
