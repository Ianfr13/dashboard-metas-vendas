/**
 * Componente: RankingTable
 * 
 * Tabela de ranking com posição, usuário, métricas e score
 */

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import BadgeIcon from "./BadgeIcon"
import { Medal } from "lucide-react"

interface RankingTableProps {
  rankings: any[]
  role: 'sdr' | 'closer' | 'ciclo_completo'
}

export default function RankingTable({ rankings, role }: RankingTableProps) {
  if (!rankings || rankings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum ranking disponível para este período
      </div>
    )
  }

  const getPositionColor = (position: number) => {
    if (position === 1) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    if (position === 2) return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    if (position === 3) return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
    return ''
  }

  const getMetricColumns = () => {
    if (role === 'sdr') {
      return [
        { key: 'agendamentos', label: 'Agendamentos' },
        { key: 'comparecimentos', label: 'Comparecimentos' },
        { key: 'taxa_comparecimento', label: 'Taxa Comp. (%)', format: (v: number) => v.toFixed(1) },
        { key: 'vendas_geradas', label: 'Vendas Geradas' }
      ]
    } else if (role === 'closer') {
      return [
        { key: 'vendas', label: 'Vendas' },
        { key: 'valor_total_vendido', label: 'Valor Total', format: (v: number) => `R$ ${v.toLocaleString('pt-BR')}` },
        { key: 'ticket_medio', label: 'Ticket Médio', format: (v: number) => `R$ ${v.toLocaleString('pt-BR')}` },
        { key: 'taxa_conversao', label: 'Taxa Conv. (%)', format: (v: number) => v.toFixed(1) }
      ]
    } else {
      return [
        { key: 'vendas_ciclo_completo', label: 'Vendas' },
        { key: 'taxa_conversao_ponta_a_ponta', label: 'Taxa Conv. (%)', format: (v: number) => v.toFixed(1) }
      ]
    }
  }

  const metricColumns = getMetricColumns()

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Pos.</TableHead>
            <TableHead>Usuário</TableHead>
            {metricColumns.map(col => (
              <TableHead key={col.key} className="text-right">{col.label}</TableHead>
            ))}
            <TableHead className="text-right">Score</TableHead>
            <TableHead className="w-20">Badges</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rankings.map((ranking) => (
            <TableRow key={ranking.user.id} className={getPositionColor(ranking.position)}>
              <TableCell className="font-bold">
                <div className="flex items-center gap-2">
                  {ranking.position <= 3 && (
                    <Medal className={`h-5 w-5 ${
                      ranking.position === 1 ? 'text-yellow-500' :
                      ranking.position === 2 ? 'text-gray-400' :
                      'text-amber-600'
                    }`} />
                  )}
                  {ranking.position}º
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={ranking.user.avatar} />
                    <AvatarFallback>
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
                    <div className="font-medium">{ranking.user.name}</div>
                    <div className="text-xs text-muted-foreground">{ranking.user.email}</div>
                  </div>
                </div>
              </TableCell>
              {metricColumns.map(col => (
                <TableCell key={col.key} className="text-right">
                  {col.format 
                    ? col.format(ranking.metrics[col.key] || 0)
                    : (ranking.metrics[col.key] || 0)
                  }
                </TableCell>
              ))}
              <TableCell className="text-right font-bold">
                {ranking?.score != null ? Number(ranking.score).toFixed(2) : '0.00'}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {ranking.badges?.map((badge: any, idx: number) => (
                    <BadgeIcon key={idx} type={badge.type} size="sm" />
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
