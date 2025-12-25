import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Table2, GitBranch, LayoutGrid } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

type ViewMode = 'cards' | 'tabela' | 'stage' | 'grafico';

interface FunnelMetrics {
  agendamentos: number;
  contatos: number;
  vendas: number;
  receita: number;
  taxaConversao: number;
  taxaAgendamento: number;
  noShow: number;
  taxaPresenca: number;
}

interface FunilComercialProps {
  selectedMonth: number;
  selectedYear: number;
}

export default function FunilComercial({ selectedMonth, selectedYear }: FunilComercialProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<FunnelMetrics>({
    agendamentos: 0,
    contatos: 0,
    vendas: 0,
    receita: 0,
    taxaConversao: 0,
    taxaAgendamento: 0,
    noShow: 0,
    taxaPresenca: 0
  });

  useEffect(() => {
    loadMetrics();
  }, [selectedMonth, selectedYear]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      
      // Chamar Edge Function do Supabase (sem expor chaves)
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-funnel-metrics?month=${selectedMonth}&year=${selectedYear}&funnel=comercial`,
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
    { name: 'Agendamentos', value: metrics.agendamentos, color: '#3b82f6' },
    { name: 'Contatos', value: metrics.contatos, color: '#8b5cf6' },
    { name: 'Vendas', value: metrics.vendas, color: '#10b981' },
  ];

  const evolutionData = [
    { periodo: 'Sem 1', agendamentos: 45, contatos: 38, vendas: 12 },
    { periodo: 'Sem 2', agendamentos: 52, contatos: 44, vendas: 15 },
    { periodo: 'Sem 3', agendamentos: 48, contatos: 40, vendas: 13 },
    { periodo: 'Sem 4', agendamentos: 55, contatos: 46, vendas: 17 },
  ];

  const taxasData = [
    { name: 'Taxa Agendamento', value: metrics.taxaAgendamento, color: '#3b82f6' },
    { name: 'Taxa Presença', value: metrics.taxaPresenca, color: '#10b981' },
    { name: 'Taxa Conversão', value: metrics.taxaConversao, color: '#f59e0b' },
  ];

  const renderCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Agendamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{metrics.agendamentos}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Contatos Realizados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{metrics.contatos}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.taxaPresenca}% taxa de presença
          </p>
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
            Taxa de Agendamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{metrics.taxaAgendamento}%</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            No-Show
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{metrics.noShow}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {((metrics.noShow / metrics.agendamentos) * 100).toFixed(1)}% dos agendamentos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Taxa de Presença
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{metrics.taxaPresenca}%</div>
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
    </div>
  );

  const renderTabela = () => (
    <Card>
      <CardHeader>
        <CardTitle>Métricas do Funil Comercial</CardTitle>
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
                <td className="p-4">Agendamentos</td>
                <td className="p-4 text-right font-mono">{metrics.agendamentos}</td>
              </tr>
              <tr className="border-b hover:bg-muted/50">
                <td className="p-4">Contatos Realizados</td>
                <td className="p-4 text-right font-mono">{metrics.contatos}</td>
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
                <td className="p-4">Taxa de Agendamento</td>
                <td className="p-4 text-right font-mono">{metrics.taxaAgendamento}%</td>
              </tr>
              <tr className="border-b hover:bg-muted/50">
                <td className="p-4">No-Show</td>
                <td className="p-4 text-right font-mono">{metrics.noShow}</td>
              </tr>
              <tr className="border-b hover:bg-muted/50">
                <td className="p-4">Taxa de Presença</td>
                <td className="p-4 text-right font-mono">{metrics.taxaPresenca}%</td>
              </tr>
              <tr className="hover:bg-muted/50">
                <td className="p-4 font-semibold">Taxa de Conversão</td>
                <td className="p-4 text-right font-mono font-semibold">{metrics.taxaConversao}%</td>
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
          <CardTitle>Funil Comercial - Visualização por Etapas</CardTitle>
          <CardDescription>Acompanhe o fluxo de agendamentos até a venda</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Agendamentos */}
            <div className="relative">
              <div className="bg-blue-500 text-white p-6 rounded-lg text-center">
                <div className="text-4xl font-bold">{metrics.agendamentos}</div>
                <div className="text-sm mt-2">Agendamentos</div>
              </div>
              <div className="absolute left-1/2 -bottom-4 transform -translate-x-1/2">
                <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[20px] border-t-blue-500"></div>
              </div>
            </div>

            <div className="h-4"></div>

            {/* Contatos */}
            <div className="relative">
              <div className="bg-purple-500 text-white p-6 rounded-lg text-center mx-auto" style={{ width: `${(metrics.contatos / metrics.agendamentos) * 100}%`, minWidth: '200px' }}>
                <div className="text-4xl font-bold">{metrics.contatos}</div>
                <div className="text-sm mt-2">Contatos ({metrics.taxaPresenca}% presença)</div>
              </div>
              <div className="absolute left-1/2 -bottom-4 transform -translate-x-1/2">
                <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[20px] border-t-purple-500"></div>
              </div>
            </div>

            <div className="h-4"></div>

            {/* Vendas */}
            <div className="bg-green-500 text-white p-6 rounded-lg text-center mx-auto" style={{ width: `${(metrics.vendas / metrics.agendamentos) * 100}%`, minWidth: '200px' }}>
              <div className="text-4xl font-bold">{metrics.vendas}</div>
              <div className="text-sm mt-2">Vendas ({metrics.taxaConversao}%)</div>
            </div>

            <div className="h-4"></div>

            {/* Receita */}
            <div className="bg-yellow-500 text-white p-6 rounded-lg text-center mx-auto" style={{ width: '50%', minWidth: '200px' }}>
              <div className="text-4xl font-bold">R$ {(metrics.receita / 1000).toFixed(0)}k</div>
              <div className="text-sm mt-2">Receita Gerada</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Taxa de Agendamento:</span>
                <span className="font-bold">{metrics.taxaAgendamento}%</span>
              </div>
              <div className="flex justify-between">
                <span>Taxa de Presença:</span>
                <span className="font-bold">{metrics.taxaPresenca}%</span>
              </div>
              <div className="flex justify-between">
                <span>Taxa de Conversão:</span>
                <span className="font-bold text-green-600">{metrics.taxaConversao}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Perdas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>No-Show:</span>
                <span className="font-bold text-red-600">{metrics.noShow}</span>
              </div>
              <div className="flex justify-between">
                <span>% No-Show:</span>
                <span className="font-bold text-red-600">
                  {((metrics.noShow / metrics.agendamentos) * 100).toFixed(1)}%
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
        {/* Gráfico de Funil */}
        <Card>
          <CardHeader>
            <CardTitle>Funil Completo</CardTitle>
            <CardDescription>Volume em cada etapa</CardDescription>
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

        {/* Gráfico de Taxas */}
        <Card>
          <CardHeader>
            <CardTitle>Taxas de Performance</CardTitle>
            <CardDescription>Percentuais de conversão</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={taxasData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {taxasData.map((entry, index) => (
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
          <CardDescription>Tendência de agendamentos, contatos e vendas</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={evolutionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="periodo" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="agendamentos" stroke="#3b82f6" strokeWidth={2} name="Agendamentos" />
              <Line type="monotone" dataKey="contatos" stroke="#8b5cf6" strokeWidth={2} name="Contatos" />
              <Line type="monotone" dataKey="vendas" stroke="#10b981" strokeWidth={2} name="Vendas" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de No-Show */}
      <Card>
        <CardHeader>
          <CardTitle>Taxa de Presença vs No-Show</CardTitle>
          <CardDescription>Comparação de presença e ausências</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart 
              data={[
                { name: 'Presença', value: metrics.taxaPresenca, color: '#10b981' },
                { name: 'No-Show', value: (metrics.noShow / metrics.agendamentos) * 100, color: '#ef4444' }
              ]} 
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis type="category" dataKey="name" />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                {[
                  { name: 'Presença', value: metrics.taxaPresenca, color: '#10b981' },
                  { name: 'No-Show', value: (metrics.noShow / metrics.agendamentos) * 100, color: '#ef4444' }
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
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
          <CardTitle>Funil Comercial</CardTitle>
          <CardDescription>
            Métricas de performance do funil comercial: Agendamentos, Contatos, Vendas, Taxas
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
