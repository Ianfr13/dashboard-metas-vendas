import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  CalendarIcon, 
  Loader2,
  Users,
  DollarSign,
  TrendingUp,
  Target,
  UserCheck,
  UserX
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { gtmAnalyticsAPI } from "@/lib/edge-functions";
import { rankingAPI } from "@/lib/ranking-api";
import FunilMarketing from "@/components/metricas/FunilMarketing";
import FunilComercial from "@/components/metricas/FunilComercial";
import FunisCadastrados from "@/components/metricas/FunisCadastrados";
import MetricCard from "@/components/metricas/MetricCard";

export default function Metricas() {
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [funnelData, setFunnelData] = useState<any>(null);
  const [evolutionData, setEvolutionData] = useState<any[]>([]);
  const [productData, setProductData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<'purchase' | 'generate_lead' | 'begin_checkout'>('purchase');
  const [groupBy, setGroupBy] = useState<'hour' | 'day' | 'week'>('day');

  // Novos estados para métricas de ranking
  const [cardsMetrics, setCardsMetrics] = useState<any>(null);
  const [salesFunnel, setSalesFunnel] = useState<any>(null);
  const [salesEvolution, setSalesEvolution] = useState<any>(null);
  const [sdrPerformance, setSdrPerformance] = useState<any>(null);
  const [closerPerformance, setCloserPerformance] = useState<any>(null);
  const [salesDistribution, setSalesDistribution] = useState<any>(null);
  const [meetingsMetrics, setMeetingsMetrics] = useState<any>(null);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [rankingError, setRankingError] = useState<string | null>(null);

  // Carregar dados do GTM (mantido)
  useEffect(() => {
    async function loadMetrics() {
      try {
        setLoading(true);
        setError(null);

        const start = format(startDate, 'yyyy-MM-dd');
        const end = format(endDate, 'yyyy-MM-dd');

        // Buscar dados em paralelo
        const [funnel, evolution, products] = await Promise.all([
          gtmAnalyticsAPI.getFunnelMetrics(start, end),
          gtmAnalyticsAPI.getEvolutionChart(start, end, selectedEvent, groupBy),
          gtmAnalyticsAPI.getProductMetrics(start, end),
        ]);

        setFunnelData(funnel);
        setEvolutionData(evolution);
        setProductData(products);
      } catch (err) {
        console.error('Erro ao carregar métricas:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    }

    loadMetrics();
  }, [startDate, endDate, selectedEvent, groupBy]);

  // Carregar métricas de ranking (novo)
  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    async function loadRankingMetrics() {
      try {
        setRankingLoading(true);
        setRankingError(null);

        const start = format(startDate, 'yyyy-MM-dd');
        const end = format(endDate, 'yyyy-MM-dd');
        const month = format(startDate, 'yyyy-MM');

        const [cards, funnel, evolution, sdr, closer, distribution, meetings] = await Promise.all([
          rankingAPI.getMetrics({ type: 'cards', period: 'custom', start_date: start, end_date: end }),
          rankingAPI.getMetrics({ type: 'funil', period: 'custom', start_date: start, end_date: end }),
          rankingAPI.getMetrics({ type: 'evolucao', period: 'custom', start_date: start, end_date: end }),
          rankingAPI.getMetrics({ type: 'performance-sdr', month }),
          rankingAPI.getMetrics({ type: 'performance-closer', month }),
          rankingAPI.getMetrics({ type: 'distribuicao', period: 'custom', start_date: start, end_date: end }),
          rankingAPI.getMetrics({ type: 'reunioes', month })
        ]);

        if (isMounted) {
          setCardsMetrics(cards);
          setSalesFunnel(funnel);
          setSalesEvolution(evolution);
          setSdrPerformance(sdr);
          setCloserPerformance(closer);
          setSalesDistribution(distribution);
          setMeetingsMetrics(meetings);
        }
      } catch (err) {
        console.error('Erro ao carregar métricas de ranking:', err);
        if (isMounted) {
          setRankingError(err instanceof Error ? err.message : 'Erro ao carregar métricas de vendas');
        }
      } finally {
        if (isMounted) {
          setRankingLoading(false);
        }
      }
    }

    loadRankingMetrics();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [startDate, endDate]);

  // Preparar dados para gráfico de funil (mantido)
  const funnelChartData = funnelData ? [
    { etapa: 'Visualizações', valor: funnelData.etapas.pageViews, cor: '#8884d8' },
    { etapa: 'Leads', valor: funnelData.etapas.leads, cor: '#82ca9d' },
    { etapa: 'Checkouts', valor: funnelData.etapas.checkouts, cor: '#ffc658' },
    { etapa: 'Vendas', valor: funnelData.etapas.purchases, cor: '#ff7c7c' },
  ] : [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Filtros de Data */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Período de Análise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Data Inicial</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[200px] justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(startDate, "dd/MM/yyyy", { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Data Final</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[200px] justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(endDate, "dd/MM/yyyy", { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => date && setEndDate(date)}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards de Métricas Gerais (NOVO) */}
        {cardsMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              title="Total de Agendamentos"
              value={cardsMetrics.total_agendamentos}
              icon={Users}
              format="number"
            />
            <MetricCard
              title="Total de Vendas"
              value={cardsMetrics.total_vendas}
              icon={DollarSign}
              format="number"
            />
            <MetricCard
              title="Taxa de Conversão Geral"
              value={cardsMetrics.taxa_conversao_geral}
              icon={TrendingUp}
              format="percentage"
            />
            <MetricCard
              title="Faturamento Total"
              value={cardsMetrics.faturamento_total}
              icon={DollarSign}
              format="currency"
            />
            <MetricCard
              title="Ticket Médio"
              value={cardsMetrics.ticket_medio}
              icon={Target}
              format="currency"
            />
            <MetricCard
              title="Taxa de Não Comparecimento"
              value={cardsMetrics.taxa_nao_comparecimento}
              icon={UserX}
              format="percentage"
            />
          </div>
        )}

        {/* Tabs de Métricas */}
        <Tabs defaultValue="vendas" className="space-y-4">
          <TabsList>
            <TabsTrigger value="vendas">Métricas de Vendas</TabsTrigger>
            <TabsTrigger value="gtm">GTM Analytics</TabsTrigger>
            <TabsTrigger value="funis">Funis</TabsTrigger>
          </TabsList>

          {/* Tab: Métricas de Vendas (NOVO) */}
          <TabsContent value="vendas" className="space-y-4">
            {/* Funil de Vendas */}
            {salesFunnel && (
              <Card>
                <CardHeader>
                  <CardTitle>Funil de Vendas</CardTitle>
                  <CardDescription>Primeiro Contato → Agendado → Compareceu → Venda</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={salesFunnel.funil}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="etapa" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="count" fill="#8884d8" name="Quantidade" />
                      <Bar yAxisId="right" dataKey="conversion" fill="#82ca9d" name="Conversão (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Evolução de Vendas */}
            {salesEvolution && salesEvolution.labels && salesEvolution.values && salesEvolution.labels.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Evolução de Vendas</CardTitle>
                  <CardDescription>Vendas ao longo do período</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={(salesEvolution?.labels ?? []).map((label: string, idx: number) => ({
                      date: label,
                      vendas: (salesEvolution?.values ?? [])[idx] ?? 0
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="vendas" stroke="#8884d8" name="Vendas" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Performance por SDR */}
              {sdrPerformance && sdrPerformance.sdrs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Performance por SDR</CardTitle>
                    <CardDescription>Top 10 SDRs do mês</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={sdrPerformance.sdrs}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="agendamentos" fill="#8884d8" name="Agendamentos" />
                        <Bar dataKey="comparecimentos" fill="#82ca9d" name="Comparecimentos" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Performance por Closer */}
              {closerPerformance && closerPerformance.closers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Performance por Closer</CardTitle>
                    <CardDescription>Top 10 Closers do mês</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={closerPerformance.closers}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="vendas" fill="#8884d8" name="Vendas" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Distribuição de Vendas */}
              {salesDistribution && (
                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição de Vendas</CardTitle>
                    <CardDescription>Realizada vs Sinal vs Perdida</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={salesDistribution.distribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.label}: ${entry.value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {salesDistribution.distribution.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* 1ª vs 2ª Reunião */}
              {meetingsMetrics && (
                <Card>
                  <CardHeader>
                    <CardTitle>1ª vs 2ª Reunião</CardTitle>
                    <CardDescription>Vendas fechadas por reunião</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={[
                        { reuniao: '1ª Reunião', vendas: meetingsMetrics.primeira_reuniao },
                        { reuniao: '2ª Reunião', vendas: meetingsMetrics.segunda_reuniao }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="reuniao" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="vendas" fill="#8884d8" name="Vendas" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Tab: GTM Analytics (mantido) */}
          <TabsContent value="gtm" className="space-y-4">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}

            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-800">Erro ao carregar dados</CardTitle>
                  <CardDescription className="text-red-600">{error}</CardDescription>
                </CardHeader>
              </Card>
            )}

            {!loading && !error && (
              <>
                {/* Funil de Conversão */}
                <Card>
                  <CardHeader>
                    <CardTitle>Funil de Conversão (GTM)</CardTitle>
                    <CardDescription>Visualizações → Leads → Checkouts → Vendas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={funnelChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="etapa" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="valor">
                          {funnelChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.cor} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Evolução de Eventos */}
                <Card>
                  <CardHeader>
                    <CardTitle>Evolução de Eventos</CardTitle>
                    <CardDescription>
                      <div className="flex gap-4 mt-2">
                        <select 
                          value={selectedEvent} 
                          onChange={(e) => setSelectedEvent(e.target.value as any)}
                          className="border rounded px-2 py-1"
                        >
                          <option value="purchase">Compras</option>
                          <option value="generate_lead">Leads</option>
                          <option value="begin_checkout">Checkouts</option>
                        </select>
                        <select 
                          value={groupBy} 
                          onChange={(e) => setGroupBy(e.target.value as any)}
                          className="border rounded px-2 py-1"
                        >
                          <option value="hour">Por Hora</option>
                          <option value="day">Por Dia</option>
                          <option value="week">Por Semana</option>
                        </select>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={evolutionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="count" stroke="#8884d8" name="Eventos" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Métricas por Produto */}
                {productData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Métricas por Produto</CardTitle>
                      <CardDescription>Performance de cada produto</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={productData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="product_name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="count" fill="#8884d8" name="Quantidade" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Tab: Funis (mantido) */}
          <TabsContent value="funis" className="space-y-4">
            <FunisCadastrados />
            <FunilMarketing />
            <FunilComercial />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
