import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, DollarSign, Target, Zap } from "lucide-react";

interface ChannelData {
  marketing: {
    sales: number;
    revenue: number;
    leads: number;
    conversionRate: number;
    cpa: number;
    roi: number;
    roas: number;
  };
  comercial: {
    sales: number;
    revenue: number;
    meetings: number;
    conversionRate: number;
    avgTicket: number;
    roi: number;
  };
}

interface ChannelsComparisonProps {
  data: ChannelData;
}

export default function ChannelsComparison({ data }: ChannelsComparisonProps) {
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

  const chartData = [
    {
      name: 'Marketing',
      vendas: data.marketing.sales,
      receita: data.marketing.revenue,
    },
    {
      name: 'Comercial',
      vendas: data.comercial.sales,
      receita: data.comercial.revenue,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Gráfico de Comparação */}
      <Card>
        <CardHeader>
          <CardTitle>Comparação de Canais</CardTitle>
          <CardDescription>Marketing vs Comercial</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                yAxisId="left"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={formatNumber}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'Vendas') return [formatNumber(value), name];
                  return [formatCurrency(value), name];
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="vendas" fill="#00a67d" name="Vendas" radius={[8, 8, 0, 0]} />
              <Bar yAxisId="right" dataKey="receita" fill="#418ecb" name="Receita" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cards de Detalhes */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Marketing */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Marketing Direto
            </CardTitle>
            <CardDescription>Performance de vendas online</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Vendas
                </p>
                <p className="text-2xl font-bold">{formatNumber(data.marketing.sales)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Receita
                </p>
                <p className="text-2xl font-bold">{formatCurrency(data.marketing.revenue)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Leads
                </p>
                <p className="text-xl font-bold">{formatNumber(data.marketing.leads)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  Conversão
                </p>
                <p className="text-xl font-bold text-green-500">{data.marketing.conversionRate}%</p>
              </div>
            </div>
            <div className="pt-4 border-t border-border space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">CPA</span>
                <span className="font-semibold">{formatCurrency(data.marketing.cpa)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">ROI</span>
                <span className="font-semibold text-green-500">{data.marketing.roi}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">ROAS</span>
                <span className="font-semibold text-green-500">{data.marketing.roas}x</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comercial */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              Time Comercial
            </CardTitle>
            <CardDescription>Performance de vendas consultivas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Vendas
                </p>
                <p className="text-2xl font-bold">{formatNumber(data.comercial.sales)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Receita
                </p>
                <p className="text-2xl font-bold">{formatCurrency(data.comercial.revenue)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Reuniões
                </p>
                <p className="text-xl font-bold">{formatNumber(data.comercial.meetings)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  Conversão
                </p>
                <p className="text-xl font-bold text-blue-500">{data.comercial.conversionRate}%</p>
              </div>
            </div>
            <div className="pt-4 border-t border-border space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Ticket Médio</span>
                <span className="font-semibold">{formatCurrency(data.comercial.avgTicket)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">ROI</span>
                <span className="font-semibold text-blue-500">{data.comercial.roi}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
