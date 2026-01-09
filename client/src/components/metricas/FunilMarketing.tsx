import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Table2, GitBranch, LayoutGrid, Loader2 } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { gtmAnalyticsAPI } from "@/lib/edge-functions";

type ViewMode = 'cards' | 'tabela' | 'stage' | 'grafico';

interface FunnelMetrics {
  leads: number;
  vendas: number;
  receita: number;
  custoTotal: number;
  cpl: number;
  cpa: number;
  taxaConversao: number;
  dropOff?: {
    pageViewToViewItem: number;
    viewItemToAddToCart: number;
    addToCartToCheckout: number;
    checkoutToPurchase: number;
  };
  etapas?: {
    pageViews: number;
    viewItem: number;
    addToCart: number;
    beginCheckout: number;
    purchases: number;
  };
}

interface EvolutionData {
  periodo: string;
  leads: number;
  vendas: number;
  receita: number;
}

interface FunilMarketingProps {
  startDate: Date;
  endDate: Date;
}

export default function FunilMarketing({ startDate, endDate }: FunilMarketingProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<FunnelMetrics>({
    leads: 0,
    vendas: 0,
    receita: 0,
    custoTotal: 0,
    cpl: 0,
    cpa: 0,
    taxaConversao: 0
  });
  const [evolutionData, setEvolutionData] = useState<EvolutionData[]>([]);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setLoading(true);
        setError(null);

        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        // Usar gtmAnalyticsAPI que busca da tabela gtm_events
        const funnelData = await gtmAnalyticsAPI.getFunnelMetrics(startStr, endStr);

        // Mapear resposta para o formato esperado
        const leads = funnelData.etapas?.leads || funnelData.etapas?.pageViews || 0;
        const vendas = funnelData.etapas?.purchases || 0;
        const receita = funnelData.financeiro?.receitaTotal || 0;
        const taxaConversao = funnelData.conversao?.endToEnd || 0;

        setMetrics({
          leads,
          vendas,
          receita,
          custoTotal: 0, // Custo vem de outra fonte
          cpl: 0,
          cpa: 0,
          taxaConversao: Math.round(taxaConversao * 100) / 100,
          dropOff: funnelData.dropOff,
          etapas: {
            pageViews: funnelData.etapas?.pageViews || 0,
            viewItem: funnelData.etapas?.viewItem || 0,
            addToCart: funnelData.etapas?.addToCart || 0,
            beginCheckout: funnelData.etapas?.beginCheckout || 0,
            purchases: funnelData.etapas?.purchases || 0
          }
        });

        // Buscar dados de evolução
        const evolutionRaw = await gtmAnalyticsAPI.getEvolutionChart(startStr, endStr, 'purchase', 'day');
        const evolutionMapped = evolutionRaw.map(item => ({
          periodo: item.date,
          leads: 0,
          vendas: item.count,
          receita: 0
        }));
        setEvolutionData(evolutionMapped);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar métricas';
        console.error('Erro ao carregar métricas:', errorMessage);
        setError(errorMessage)
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, [startDate, endDate]);

  // Dados para gráficos
  const chartData = [
    { name: 'Leads', value: metrics.leads, color: '#3b82f6' },
    { name: 'Vendas', value: metrics.vendas, color: '#10b981' },
  ];

  // evolutionData agora vem do backend

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
            R$ {(metrics.cpl || 0).toFixed(2)}
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
            R$ {(metrics.cpa || 0).toFixed(2)}
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
            {metrics.custoTotal > 0
              ? ((metrics.receita / metrics.custoTotal - 1) * 100).toFixed(1)
              : '0.0'
            }%
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
                <td className="p-4 text-right font-mono">R$ {(metrics.cpl || 0).toFixed(2)}</td>
              </tr>
              <tr className="border-b hover:bg-muted/50">
                <td className="p-4">CPA (Custo por Aquisição)</td>
                <td className="p-4 text-right font-mono">R$ {(metrics.cpa || 0).toFixed(2)}</td>
              </tr>
              <tr className="border-b hover:bg-muted/50">
                <td className="p-4">Taxa de Conversão</td>
                <td className="p-4 text-right font-mono">{metrics.taxaConversao}%</td>
              </tr>
              <tr className="hover:bg-muted/50">
                <td className="p-4 font-semibold">ROI</td>
                <td className="p-4 text-right font-mono font-semibold">
                  {metrics.custoTotal > 0
                    ? ((metrics.receita / metrics.custoTotal - 1) * 100).toFixed(1)
                    : '0.0'
                  }%
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

          <div className="space-y-6">

            {/* 1. Page View -> View Content */}
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 text-white p-4 rounded-lg flex-1 text-center">
                <div className="text-2xl font-bold">{metrics.etapas?.pageViews.toLocaleString() || 0}</div>
                <div className="text-sm">Visualizações de Página</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-red-500 font-bold text-xs">{metrics.dropOff?.pageViewToViewItem.toFixed(1)}% Drop-off</div>
                <div className="h-0.5 w-16 bg-gray-300 my-1 relative">
                  <div className="absolute right-0 top-1/2 -mt-1 -mr-1 w-2 h-2 border-t-2 border-r-2 border-gray-300 transform rotate-45"></div>
                </div>
              </div>
              <div className="bg-blue-500 text-white p-4 rounded-lg flex-1 text-center">
                <div className="text-2xl font-bold">{metrics.etapas?.viewItem.toLocaleString() || 0}</div>
                <div className="text-sm">Visualização de Produto</div>
              </div>
            </div>

            {/* 2. View Content -> Add To Cart */}
            <div className="flex items-center gap-4 pl-12">
              <div className="w-0.5 h-8 bg-gray-300 ml-[25%]"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 text-right text-red-500 text-xs font-bold pr-4">
                {metrics.dropOff?.viewItemToAddToCart.toFixed(1)}% Drop-off
              </div>
              <div className="bg-blue-400 text-white p-4 rounded-lg flex-1 text-center">
                <div className="text-2xl font-bold">{metrics.etapas?.addToCart.toLocaleString() || 0}</div>
                <div className="text-sm">Adições ao Carrinho</div>
              </div>
            </div>

            {/* 3. Add to Cart -> Checkout */}
            <div className="flex items-center gap-4 pl-12">
              <div className="w-0.5 h-8 bg-gray-300 ml-[60%]"></div>
            </div>
            <div className="flex items-center gap-4 justify-end">
              <div className="flex-1 text-right text-red-500 text-xs font-bold pr-4">
                {metrics.dropOff?.addToCartToCheckout.toFixed(1)}% Drop-off
              </div>
              <div className="bg-orange-500 text-white p-4 rounded-lg flex-1 text-center max-w-[50%]">
                <div className="text-2xl font-bold">{metrics.etapas?.beginCheckout.toLocaleString() || 0}</div>
                <div className="text-sm">Initiate Checkout</div>
              </div>
            </div>

            {/* 4. Checkout -> Purchase */}
            <div className="flex items-center gap-4 pl-12">
              <div className="w-0.5 h-8 bg-gray-300 ml-[75%]"></div>
            </div>
            <div className="flex items-center gap-4 justify-end">
              <div className="flex-1 text-right text-red-500 text-xs font-bold pr-4">
                {metrics.dropOff?.checkoutToPurchase.toFixed(1)}% Drop-off
              </div>
              <div className="bg-green-600 text-white p-4 rounded-lg flex-1 text-center max-w-[40%]">
                <div className="text-2xl font-bold">{metrics.etapas?.purchases.toLocaleString() || 0}</div>
                <div className="text-sm">Compras Realizadas</div>
              </div>
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
                <span className="font-bold">R$ {(metrics.cpl || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>CPA:</span>
                <span className="font-bold">R$ {(metrics.cpa || 0).toFixed(2)}</span>
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
                  {metrics.custoTotal > 0
                    ? ((metrics.receita / metrics.custoTotal - 1) * 100).toFixed(1)
                    : '0.0'
                  }%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Ticket Médio:</span>
                <span className="font-bold">
                  R$ {metrics.vendas > 0
                    ? (metrics.receita / metrics.vendas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                    : '0,00'
                  }
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
                  label={({ name, value }) => `${name}: R$ ${Number(value || 0).toFixed(2)}`}
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
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-destructive font-semibold mb-2">Erro ao carregar métricas</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === 'cards' && renderCards()}
          {viewMode === 'tabela' && renderTabela()}
          {viewMode === 'stage' && renderStage()}
          {viewMode === 'grafico' && renderGrafico()}
        </>
      )}
    </div>
  );
}
