interface GoalGaugeProps {
  percentage: number;
  current: number;
  target: number;
  subGoals: { value: number; achieved: boolean }[];
}

import { safeToFixed } from "@/lib/formatters";

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
      return `R$ ${safeToFixed(value / 1000000, 1)}M`;
    }
    return `R$ ${safeToFixed(value / 1000, 0)}k`;
  };

  // SVG parameters - responsive sizing
  const size = 400;
  const strokeWidth = 28; // Increased for better visibility
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius;
  // Limitar progresso visual a 100% mas mostrar valor real no texto
  const displayPercentage = Math.min(percentage, 100);
  const progress = (displayPercentage / 100) * circumference;
  const isOverGoal = percentage > 100;
  const excessAmount = current - target;

  return (
    <div className="w-full flex flex-col items-center gap-8 py-8">
      {/* Gauge */}
      <div className="relative w-full max-w-md md:max-w-lg">
        <svg
          width={size}
          height={size / 2 + 40}
          viewBox={`0 0 ${size} ${size / 2 + 40}`}
          className="overflow-visible w-full h-auto"
        >
          {/* Background arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="text-muted-foreground opacity-30 dark:opacity-40"
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
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-8 md:pt-12">
          <div className="text-center px-4">
            <div className={`text-4xl md:text-6xl font-bold ${
              isOverGoal 
                ? "bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 bg-clip-text text-transparent"
                : "bg-gradient-to-r from-[#00a67d] via-[#418ecb] to-[#5a4b99] bg-clip-text text-transparent"
            }`}>
              {safeToFixed(percentage, 1)}%
            </div>
            <div className="text-xs md:text-sm text-muted-foreground mt-1 md:mt-2">
              {isOverGoal ? "META SUPERADA!" : "da meta atingida"}
            </div>
            <div className="mt-3 md:mt-4 space-y-1">
              <div className="text-xl md:text-2xl font-semibold text-foreground">
                {formatCurrency(current)}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">
                de {formatCurrency(target)}
              </div>
              {isOverGoal && (
                <div className="text-sm font-semibold text-green-500 mt-2">
                  +{formatCurrency(excessAmount)} acima da meta
                </div>
              )}
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
