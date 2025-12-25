interface GoalGaugeProps {
  percentage: number;
  current: number;
  target: number;
  subGoals: { 
    id: number;
    value: number; 
    achieved: boolean;
    premio?: string;
    status?: string;
    icon?: string;
    color?: string;
  }[];
  selectedSubMetaId?: number | null;
  onSubMetaClick?: (id: number) => void;
  grandPrize?: {
    text: string;
    status: string;
    icon: string;
    color: string;
  };
}

import { safeToFixed } from "@/lib/formatters";

export default function GoalGauge({
  percentage,
  current,
  target,
  subGoals,
  selectedSubMetaId,
  onSubMetaClick,
  grandPrize,
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
    <div className="w-full flex flex-col items-center gap-4 md:gap-8 py-4 md:py-8">
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
              {grandPrize && (
                <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-border">
                  <div className="flex items-center justify-center gap-1.5 md:gap-2">
                    <span className="text-base md:text-lg">{grandPrize.icon}</span>
                    <span className="text-[10px] md:text-xs font-semibold text-muted-foreground">🏆 GRANDE PRÊMIO</span>
                  </div>
                  <div className="text-[10px] md:text-xs text-muted-foreground mt-1 max-w-[180px] md:max-w-[200px] mx-auto truncate">
                    {grandPrize.text}
                  </div>
                  <div className={`text-[10px] md:text-xs font-bold mt-0.5 md:mt-1 ${
                    grandPrize.status === 'desbloqueado' ? 'text-green-600' :
                    grandPrize.status === 'perdido' ? 'text-red-600' :
                    grandPrize.status === 'quase' ? 'text-orange-600' :
                    'text-blue-600'
                  }`}>
                    {grandPrize.status === 'desbloqueado' ? 'Desbloqueado!' :
                     grandPrize.status === 'perdido' ? 'Perdido' :
                     grandPrize.status === 'quase' ? 'Quase lá!' :
                     'Em andamento'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-metas */}
      <div className="w-full max-w-4xl">
        <h3 className="text-sm md:text-lg font-semibold text-center mb-3 md:mb-4 text-muted-foreground uppercase tracking-wide">
          Sub-metas
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
          {subGoals.map((subGoal, index) => {
            const isSelected = selectedSubMetaId === subGoal.id;
            return (
            <div
              key={index}
              onClick={() => onSubMetaClick && onSubMetaClick(subGoal.id)}
              className={`flex flex-col rounded-lg border p-2 md:p-3 transition-all cursor-pointer hover:shadow-lg ${
                isSelected
                  ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500"
                  : subGoal.achieved
                  ? "border-green-500/50 bg-green-500/10"
                  : "border-border bg-card hover:border-blue-300"
              }`}
            >
              {/* Prêmio em cima */}
              {subGoal.premio && (
                <div className="mb-1.5 md:mb-2 pb-1.5 md:pb-2 border-b border-border">
                  <div className="flex items-center gap-1 mb-0.5 md:mb-1">
                    <span className="text-[10px] md:text-xs">{subGoal.icon || '🎁'}</span>
                    <span className="text-[10px] md:text-xs font-medium text-muted-foreground truncate">
                      {subGoal.premio}
                    </span>
                  </div>
                  {subGoal.status && (
                    <div className={`text-[9px] md:text-[10px] font-bold ${
                      subGoal.status === 'desbloqueado' ? 'text-green-600' :
                      subGoal.status === 'perdido' ? 'text-red-600' :
                      subGoal.status === 'quase' ? 'text-orange-600' :
                      'text-blue-600'
                    }`}>
                      {subGoal.status === 'desbloqueado' ? 'Desbloqueado!' :
                       subGoal.status === 'perdido' ? 'Perdido' :
                       subGoal.status === 'quase' ? 'Quase lá!' :
                       'Em andamento'}
                    </div>
                  )}
                </div>
              )}
              {/* Valor da submeta */}
              <div className="flex items-center gap-1.5 md:gap-2">
                <div
                  className={`h-2.5 w-2.5 md:h-3 md:w-3 rounded-full flex-shrink-0 ${
                    subGoal.achieved
                      ? "bg-green-500 animate-pulse"
                      : "bg-cyan-500"
                  }`}
                />
                <span
                  className={`font-semibold text-xs md:text-sm ${
                    subGoal.achieved
                      ? "line-through text-muted-foreground"
                      : "text-foreground"
                  }`}
                >
                  {formatShortCurrency(subGoal.value)}
                </span>
              </div>
            </div>
            );
          })}
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
