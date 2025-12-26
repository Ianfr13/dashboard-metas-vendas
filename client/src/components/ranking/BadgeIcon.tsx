/**
 * Componente: BadgeIcon
 * 
 * Renderiza ícone de badge com cor e tooltip
 */

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Award, Crown, TrendingUp, Zap } from "lucide-react"

interface BadgeIconProps {
  type: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const BADGE_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  ouro: { icon: Crown, color: 'text-yellow-500', label: 'Ouro - 1º Lugar' },
  prata: { icon: Award, color: 'text-gray-400', label: 'Prata - 2º Lugar' },
  bronze: { icon: Award, color: 'text-amber-600', label: 'Bronze - 3º Lugar' },
  campeao_mes: { icon: Crown, color: 'text-purple-500', label: 'Campeão do Mês' },
  campeao_ano: { icon: Crown, color: 'text-blue-500', label: 'Campeão do Ano' },
  streak_3_meses: { icon: Zap, color: 'text-orange-500', label: 'Streak Master' },
  maior_evolucao: { icon: TrendingUp, color: 'text-green-500', label: 'Maior Evolução' }
}

const SIZE_CLASSES = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8'
}

export default function BadgeIcon({ type, size = 'md', showLabel = false }: BadgeIconProps) {
  const config = BADGE_CONFIG[type]
  
  if (!config) {
    return null
  }

  const Icon = config.icon
  const sizeClass = SIZE_CLASSES[size]

  const badge = (
    <div className="flex items-center gap-2">
      <Icon className={`${sizeClass} ${config.color}`} />
      {showLabel && (
        <span className={`text-sm font-medium ${config.color}`}>
          {config.label}
        </span>
      )}
    </div>
  )

  if (showLabel) {
    return badge
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {badge}
      </TooltipTrigger>
      <TooltipContent>
        <p>{config.label}</p>
      </TooltipContent>
    </Tooltip>
  )
}
