import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Zap, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RealtimeData {
  last24h: {
    sales: number;
    revenue: number;
    leads: number;
  };
  today: {
    sales: number;
    revenue: number;
    leads: number;
  };
  yesterday: {
    sales: number;
    revenue: number;
    leads: number;
  };
  dailyGoal: {
    sales: number;
    revenue: number;
  };
  recentSales: Array<{
    time: string;
    product: string;
    value: number;
  }>;
}

interface RealtimeMetricsProps {
  data: RealtimeData;
}

export default function RealtimeMetrics({ data }: RealtimeMetricsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("pt-BR").format(value);
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const todayVsYesterday = {
    sales: calculateChange(data.today.sales, data.yesterday.sales),
    revenue: calculateChange(data.today.revenue, data.yesterday.revenue),
    leads: calculateChange(data.today.leads, data.yesterday.leads),
  };

  const dailyProgress = {
    sales: (data.today.sales / data.dailyGoal.sales) * 100,
    revenue: (data.today.revenue / data.dailyGoal.revenue) * 100,
  };

  return (
    <div className="space-y-4">
      {/* Últimas 24h */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-500" />
            Últimas 24 Horas
          </CardTitle>
          <CardDescription>Performance em tempo real</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Vendas</p>
              <p className="text-2xl font-bold">{formatNumber(data.last24h.sales)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Receita</p>
              <p className="text-2xl font-bold">{formatCurrency(data.last24h.revenue)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Leads</p>
              <p className="text-2xl font-bold">{formatNumber(data.last24h.leads)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hoje vs Ontem */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Hoje vs Ontem
          </CardTitle>
          <CardDescription>Comparação do dia atual</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vendas</p>
                <p className="text-xl font-bold">{formatNumber(data.today.sales)}</p>
              </div>
              <div className="text-right">
                <Badge variant={todayVsYesterday.sales >= 0 ? "default" : "destructive"} className="gap-1">
                  {todayVsYesterday.sales >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(todayVsYesterday.sales).toFixed(1)}%
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita</p>
                <p className="text-xl font-bold">{formatCurrency(data.today.revenue)}</p>
              </div>
              <div className="text-right">
                <Badge variant={todayVsYesterday.revenue >= 0 ? "default" : "destructive"} className="gap-1">
                  {todayVsYesterday.revenue >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(todayVsYesterday.revenue).toFixed(1)}%
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Leads</p>
                <p className="text-xl font-bold">{formatNumber(data.today.leads)}</p>
              </div>
              <div className="text-right">
                <Badge variant={todayVsYesterday.leads >= 0 ? "default" : "destructive"} className="gap-1">
                  {todayVsYesterday.leads >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(todayVsYesterday.leads).toFixed(1)}%
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meta do Dia */}
      <Card>
        <CardHeader>
          <CardTitle>Progresso da Meta Diária</CardTitle>
          <CardDescription>Quanto falta para atingir a meta de hoje</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Vendas</span>
              <span className="text-sm text-muted-foreground">
                {formatNumber(data.today.sales)} / {formatNumber(data.dailyGoal.sales)}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all"
                style={{ width: `${Math.min(dailyProgress.sales, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dailyProgress.sales.toFixed(1)}% da meta
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Receita</span>
              <span className="text-sm text-muted-foreground">
                {formatCurrency(data.today.revenue)} / {formatCurrency(data.dailyGoal.revenue)}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all"
                style={{ width: `${Math.min(dailyProgress.revenue, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dailyProgress.revenue.toFixed(1)}% da meta
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Feed de Vendas Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Vendas</CardTitle>
          <CardDescription>Feed em tempo real</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.recentSales.map((sale, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div>
                  <p className="font-medium text-sm">{sale.product}</p>
                  <p className="text-xs text-muted-foreground">{sale.time}</p>
                </div>
                <p className="font-bold text-green-500">{formatCurrency(sale.value)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
