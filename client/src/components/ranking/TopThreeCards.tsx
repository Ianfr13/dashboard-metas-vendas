/**
 * Componente: TopThreeCards
 * 
 * Cards destacados para o top 3 do ranking
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import BadgeIcon from "./BadgeIcon"
import { Trophy } from "lucide-react"

interface TopThreeCardsProps {
  rankings: any[]
}

export default function TopThreeCards({ rankings }: TopThreeCardsProps) {
  const top3 = rankings.slice(0, 3)

  if (top3.length === 0) {
    return null
  }

  const getCardColor = (position: number) => {
    if (position === 1) return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'
    if (position === 2) return 'border-gray-400 bg-gray-50 dark:bg-gray-900'
    if (position === 3) return 'border-amber-600 bg-amber-50 dark:bg-amber-950'
    return ''
  }

  const getBadgeType = (position: number) => {
    if (position === 1) return 'ouro'
    if (position === 2) return 'prata'
    if (position === 3) return 'bronze'
    return ''
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {top3.map((ranking) => (
        <Card key={ranking.user.id} className={`${getCardColor(ranking.position)} border-2`}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="text-lg">{ranking.position}º Lugar</span>
              <BadgeIcon type={getBadgeType(ranking.position)} size="lg" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center text-center gap-3">
              <Avatar className="h-20 w-20 border-4 border-white dark:border-gray-800">
                <AvatarImage src={ranking.user.avatar} />
                <AvatarFallback className="text-2xl">
                  {(ranking?.user?.name ?? '')
                    .split(' ')
                    .filter(n => n.length > 0)
                    .map(n => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h3 className="font-bold text-lg">{ranking.user.name}</h3>
                <p className="text-sm text-muted-foreground">{ranking.user.email}</p>
              </div>

              <div className="flex items-center gap-2 text-2xl font-bold">
                <Trophy className="h-6 w-6" />
                {ranking?.score != null ? Number(ranking.score).toFixed(2) : '0.00'} pts
              </div>

              {ranking.badges && ranking.badges.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {ranking.badges.map((badge: any, idx: number) => (
                    <BadgeIcon key={idx} type={badge.type} size="md" />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
