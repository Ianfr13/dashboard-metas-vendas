interface GoalGaugeProps {
  percentage: number;
  current: number;
  target: number;
  subGoals: { value: number; achieved: boolean }[];
}

export default function GoalGauge({
  percentage,
  current,
  target,
  subGoals,
}: GoalGaugeProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatShortCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    return `R$ ${(value / 1000).toFixed(0)}k`;
  };

  // SVG parameters for larger gauge
  const size = 400;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius;
  const progress = (percentage / 100) * circumference;

  return (
    <div className="w-full flex flex-col items-center gap-8 py-8">
      {/* Gauge */}
      <div className="relative">
        <svg
          width={size}
          height={size / 2 + 40}
          viewBox={`0 0 ${size} ${size / 2 + 40}`}
          className="overflow-visible"
        >
          {/* Background arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="text-muted/20"
          />
          {/* Progress arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${progress} ${circumference}`}
            className="transition-all duration-1000 ease-out"
          />
          {/* Gradient definition */}
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00a67d" />
              <stop offset="50%" stopColor="#418ecb" />
              <stop offset="100%" stopColor="#5a4b99" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-12">
          <div className="text-center">
            <div className="text-6xl font-bold bg-gradient-to-r from-[#00a67d] via-[#418ecb] to-[#5a4b99] bg-clip-text text-transparent">
              {percentage.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              da meta atingida
            </div>
            <div className="mt-4 space-y-1">
              <div className="text-2xl font-semibold text-foreground">
                {formatCurrency(current)}
              </div>
              <div className="text-sm text-muted-foreground">
                de {formatCurrency(target)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-metas */}
      <div className="w-full max-w-4xl">
        <h3 className="text-lg font-semibold text-center mb-4 text-muted-foreground uppercase tracking-wide">
          Sub-metas
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {subGoals.map((subGoal, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 rounded-lg border p-3 transition-all ${
                subGoal.achieved
                  ? "border-green-500/50 bg-green-500/10"
                  : "border-border bg-card"
              }`}
            >
              <div
                className={`h-3 w-3 rounded-full ${
                  subGoal.achieved
                    ? "bg-green-500 animate-pulse"
                    : "bg-cyan-500"
                }`}
              />
              <span
                className={`font-semibold text-sm ${
                  subGoal.achieved
                    ? "line-through text-muted-foreground"
                    : "text-foreground"
                }`}
              >
                {formatShortCurrency(subGoal.value)}
              </span>
            </div>
          ))}
        </div>
        {subGoals.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma sub-meta configurada.{" "}
            <a href="/admin" className="text-primary hover:underline">
              Configure agora
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
