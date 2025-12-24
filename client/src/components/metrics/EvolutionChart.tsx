import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface EvolutionChartProps {
  data: Array<{
    date: string;
    vendas: number;
    receita: number;
    leads: number;
  }>;
}

export default function EvolutionChart({ data }: EvolutionChartProps) {
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

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Gráfico de Vendas e Receita */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução de Vendas e Receita</CardTitle>
          <CardDescription>Últimos 30 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
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
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="vendas" 
                stroke="#00a67d" 
                strokeWidth={2}
                name="Vendas"
                dot={{ fill: '#00a67d', r: 3 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="receita" 
                stroke="#418ecb" 
                strokeWidth={2}
                name="Receita"
                dot={{ fill: '#418ecb', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Leads */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução de Leads Gerados</CardTitle>
          <CardDescription>Últimos 30 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5a4b99" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#5a4b99" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={formatNumber}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => [formatNumber(value), 'Leads']}
              />
              <Area 
                type="monotone" 
                dataKey="leads" 
                stroke="#5a4b99" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorLeads)"
                name="Leads"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
