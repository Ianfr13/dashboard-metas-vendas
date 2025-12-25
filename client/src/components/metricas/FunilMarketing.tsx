import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Table2, GitBranch, LayoutGrid } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

type ViewMode = 'cards' | 'tabela' | 'stage' | 'grafico';

interface FunnelMetrics {
  leads: number;
  vendas: number;
  receita: number;
  custoTotal: number;
  cpl: number;
  cpa: number;
  taxaConversao: number;
}

interface FunilMarketingProps {
  selectedMonth: number;
  selectedYear: number;
}

export default function FunilMarketing({ selectedMonth, selectedYear }: FunilMarketingProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<FunnelMetrics>({
    leads: 0,
    vendas: 0,
    receita: 0,
    custoTotal: 0,
    cpl: 0,
    cpa: 0,
    taxaConversao: 0
  });

  useEffect(() => {
    loadMetrics();
  }, [selectedMonth, selectedYear]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      
      // Chamar Edge Function do Supabase (sem expor chaves)
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-funnel-metrics?month=${selectedMonth}&year=${selectedYear}&funnel=marketing`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Erro ao carregar métricas');
      }
      
      const data = await response.json();
      setMetrics(data.metrics);
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
      // Manter valores zerados em caso de erro
    } finally {
      setLoading(false);
    }
  };

  // Dados para gráficos
  const chartData = [
    { name: 'Leads', value: metrics.leads, color: '#3b82f6' },
    { name: 'Vendas', value: metrics.vendas, color: '#10b981' },
  ];

  const evolutionData = [
    { periodo: 'Sem 1', leads: 280, vendas: 18 },
    { periodo: 'Sem 2', leads: 320, vendas: 22 },
    { periodo: 'Sem 3', leads: 310, vendas: 20 },
    { periodo: 'Sem 4', leads: 340, vendas: 25 },
  ];

  const custoData = [
    { name: 'CPL', value: metrics.cpl, color: '#f59e0b' },
    { name: 'CPA', value: metrics.cpa, color: '#ef4444' },
  ];

  const renderCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Leads Gerados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{metrics.leads.toLocaleString('pt-BR')}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Vendas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{metrics.vendas}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.taxaConversao}% conversão
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Receita Total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            R$ {metrics.receita.toLocaleString('pt-BR')}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Custo Total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            R$ {metrics.custoTotal.toLocaleString('pt-BR')}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            CPL (Custo por Lead)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            R$ {metrics.cpl.toFixed(2)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            CPA (Custo por Aquisição)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            R$ {metrics.cpa.toFixed(2)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Taxa de Conversão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{metrics.taxaConversao}%</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            ROI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {((metrics.receita / metrics.custoTotal - 1) * 100).toFixed(1)}%
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTabela = () => (
    <Card>
      <CardHeader>
        <CardTitle>Métricas do Funil de Marketing</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-medium">Métrica</th>
                <th className="text-right p-4 font-medium">Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-muted/50">
                <td className="p-4">Leads Gerados</td>
                <td className="p-4 text-right font-mono">{metrics.leads.toLocaleString('pt-BR')}</td>
              </tr>
              <tr className="border-b hover:bg-muted/50">
                <td className="p-4">Vendas</td>
                <td className="p-4 text-right font-mono">{metrics.vendas}</td>
              </tr>
              <tr className="border-b hover:bg-muted/50">
                <td className="p-4">Receita Total</td>
                <td className="p-4 text-right font-mono">R$ {metrics.receita.toLocaleString('pt-BR')}</td>
              </tr>
              <tr className="border-b hover:bg-muted/50">
                <td className="p-4">Custo Total</td>
                <td className="p-4 text-right font-mono">R$ {metrics.custoTotal.toLocaleString('pt-BR')}</td>
              </tr>
              <tr className="border-b hover:bg-muted/50">
                <td className="p-4">CPL (Custo por Lead)</td>
                <td className="p-4 text-right font-mono">R$ {metrics.cpl.toFixed(2)}</td>
              </tr>
              <tr className="border-b hover:bg-muted/50">
                <td className="p-4">CPA (Custo por Aquisição)</td>
                <td className="p-4 text-right font-mono">R$ {metrics.cpa.toFixed(2)}</td>
              </tr>
              <tr className="border-b hover:bg-muted/50">
                <td className="p-4">Taxa de Conversão</td>
                <td className="p-4 text-right font-mono">{metrics.taxaConversao}%</td>
              </tr>
              <tr className="hover:bg-muted/50">
                <td className="p-4 font-semibold">ROI</td>
                <td className="p-4 text-right font-mono font-semibold">
                  {((metrics.receita / metrics.custoTotal - 1) * 100).toFixed(1)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  const renderStage = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Funil de Marketing - Visualização por Etapas</CardTitle>
          <CardDescription>Acompanhe o fluxo de leads até a conversão</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Leads */}
            <div className="relative">
              <div className="bg-blue-500 text-white p-6 rounded-lg text-center">
                <div className="text-4xl font-bold">{metrics.leads}</div>
                <div className="text-sm mt-2">Leads Gerados</div>
              </div>
              <div className="absolute left-1/2 -bottom-4 transform -translate-x-1/2">
                <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[20px] border-t-blue-500"></div>
              </div>
            </div>

            <div className="h-4"></div>

            {/* Vendas */}
            <div className="relative">
              <div className="bg-green-500 text-white p-6 rounded-lg text-center mx-auto" style={{ width: `${(metrics.vendas / metrics.leads) * 100}%`, minWidth: '200px' }}>
                <div className="text-4xl font-bold">{metrics.vendas}</div>
                <div className="text-sm mt-2">Vendas ({metrics.taxaConversao}%)</div>
              </div>
            </div>

            <div className="h-4"></div>

            {/* Receita */}
            <div className="bg-purple-500 text-white p-6 rounded-lg text-center mx-auto" style={{ width: '60%', minWidth: '200px' }}>
              <div className="text-4xl font-bold">R$ {(metrics.receita / 1000).toFixed(0)}k</div>
              <div className="text-sm mt-2">Receita Gerada</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Custos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Custo Total:</span>
                <span className="font-bold">R$ {metrics.custoTotal.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex justify-between">
                <span>CPL:</span>
                <span className="font-bold">R$ {metrics.cpl.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>CPA:</span>
                <span className="font-bold">R$ {metrics.cpa.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Taxa de Conversão:</span>
                <span className="font-bold">{metrics.taxaConversao}%</span>
              </div>
              <div className="flex justify-between">
                <span>ROI:</span>
                <span className="font-bold text-green-600">
                  {((metrics.receita / metrics.custoTotal - 1) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Ticket Médio:</span>
                <span className="font-bold">
                  R$ {(metrics.receita / metrics.vendas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderGrafico = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gráfico de Leads vs Vendas */}
        <Card>
          <CardHeader>
            <CardTitle>Leads vs Vendas</CardTitle>
            <CardDescription>Comparação de volume</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Custos */}
        <Card>
          <CardHeader>
            <CardTitle>Custos por Métrica</CardTitle>
            <CardDescription>CPL vs CPA</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={custoData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: R$ ${value.toFixed(2)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {custoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Evolução */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução Semanal</CardTitle>
          <CardDescription>Tendência de leads e vendas ao longo do mês</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={evolutionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="periodo" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={2} name="Leads" />
              <Line type="monotone" dataKey="vendas" stroke="#10b981" strokeWidth={2} name="Vendas" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Taxa de Conversão */}
      <Card>
        <CardHeader>
          <CardTitle>Taxa de Conversão</CardTitle>
          <CardDescription>Percentual de leads convertidos em vendas</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[{ name: 'Conversão', value: metrics.taxaConversao, max: 100 }]} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis type="category" dataKey="name" />
              <Tooltip />
              <Bar dataKey="value" fill="#10b981" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Controles de Visualização */}
      <Card>
        <CardHeader>
          <CardTitle>Funil de Marketing</CardTitle>
          <CardDescription>
            Métricas de performance do funil de marketing: CPL, CPA, Taxa de Conversão
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'cards' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('cards')}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Cards
            </Button>
            <Button
              variant={viewMode === 'tabela' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('tabela')}
            >
              <Table2 className="h-4 w-4 mr-2" />
              Tabela
            </Button>
            <Button
              variant={viewMode === 'stage' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('stage')}
            >
              <GitBranch className="h-4 w-4 mr-2" />
              Stage
            </Button>
            <Button
              variant={viewMode === 'grafico' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grafico')}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Gráfico
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo baseado no modo de visualização */}
      {viewMode === 'cards' && renderCards()}
      {viewMode === 'tabela' && renderTabela()}
      {viewMode === 'stage' && renderStage()}
      {viewMode === 'grafico' && renderGrafico()}
    </div>
  );
}
