import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, TrendingUp, Calendar, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TopPerformerCardProps {
  title: string;
  performer: {
    name: string;
    email: string | null;
    role: string | null;
    sales_count: number;
    sales_value: number;
    meetings_count: number;
    appointments_count: number;
    conversion_rate: number;
  } | null;
  type: "closer" | "sdr";
}

export function TopPerformerCard({ title, performer, type }: TopPerformerCardProps) {
  if (!performer) {
    return (
      <Card className="border-2 border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-muted-foreground" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-2xl font-bold">{performer.name}</h3>
          {performer.email && (
            <p className="text-sm text-muted-foreground">{performer.email}</p>
          )}
          {performer.role && (
            <Badge variant="secondary" className="mt-2">
              {performer.role}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {type === "closer" ? (
            <>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span>Vendas</span>
                </div>
                <p className="text-2xl font-bold">{performer.sales_count}</p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(performer.sales_value)}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span>Conversão</span>
                </div>
                <p className="text-2xl font-bold">{performer.conversion_rate}%</p>
                <p className="text-sm text-muted-foreground">
                  {performer.appointments_count} agendamentos
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Agendamentos</span>
                </div>
                <p className="text-2xl font-bold">{performer.appointments_count}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span>Reuniões</span>
                </div>
                <p className="text-2xl font-bold">{performer.meetings_count}</p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
