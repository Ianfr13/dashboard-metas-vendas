import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string | null;
  role: string | null;
  sales_count: number;
  sales_value: number;
  meetings_count: number;
  appointments_count: number;
  conversion_rate: number;
}

interface RankingTableProps {
  title: string;
  members: TeamMember[];
  type: "closer" | "sdr";
}

export function RankingTable({ title, members, type }: RankingTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-muted-foreground">#{index + 1}</span>;
    }
  };

  if (members.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Rank</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Cargo</TableHead>
              {type === "closer" ? (
                <>
                  <TableHead className="text-right">Vendas</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead className="text-right">Conversão</TableHead>
                </>
              ) : (
                <>
                  <TableHead className="text-right">Agendamentos</TableHead>
                  <TableHead className="text-right">Reuniões</TableHead>
                  <TableHead className="text-right">Vendas</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member, index) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center justify-center">
                    {getRankIcon(index)}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    {member.email && (
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {member.role && (
                    <Badge variant="outline">{member.role}</Badge>
                  )}
                </TableCell>
                {type === "closer" ? (
                  <>
                    <TableCell className="text-right font-medium">
                      {member.sales_count}
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {formatCurrency(member.sales_value)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={member.conversion_rate >= 20 ? "default" : "secondary"}>
                        {member.conversion_rate}%
                      </Badge>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell className="text-right font-medium">
                      {member.appointments_count}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {member.meetings_count}
                    </TableCell>
                    <TableCell className="text-right">
                      {member.sales_count > 0 ? (
                        <Badge variant="default">{member.sales_count}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
