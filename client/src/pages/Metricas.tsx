import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  CalendarIcon,
  Loader2,
  Wifi,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/DashboardLayout";
import { format, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { rankingAPI } from "@/lib/ranking-api";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  useFunnelMetrics,
  useEvolutionMetrics,
  useProductMetrics,
  useTrafficMetrics,
  useCreativeMetrics,
  usePlacementMetrics,
  useVturbMetrics
} from "@/hooks/useMetrics";
import FunilMarketing from "@/components/metricas/FunilMarketing";
import FunilComercial from "@/components/metricas/FunilComercial";
import FunisCadastrados from "@/components/metricas/FunisCadastrados";
import { useRef, useCallback } from "react";
import TrafficSourcesTable from "@/components/metrics/TrafficSourcesTable";
import AdvancedFunnel from "@/components/metrics/AdvancedFunnel";
import CreativeRankingTable from "@/components/metrics/CreativeRankingTable";
import VslRankingTable from "@/components/metrics/VslRankingTable";
import VslRetentionChart from "@/components/metrics/VslRetentionChart";
import VslComparisonDashboard from "@/components/metrics/VslComparisonDashboard";
import FacebookAdsDashboard from "@/components/metrics/FacebookAdsDashboard";
import { TrafficSourceMetrics, CreativeMetrics, vturbAnalyticsAPI } from "@/lib/edge-functions";

export default function Metricas() {
  const { user, loading: authLoading } = useAuth();
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());

  // View States
  const [selectedEvent, setSelectedEvent] = useState<'purchase' | 'generate_lead' | 'begin_checkout'>('purchase');
  const [groupBy, setGroupBy] = useState<'hour' | 'day' | 'week'>('day');
  const [isLive, setIsLive] = useState(false);
  // Error state not strictly needed if we use hook errors, but keeping for compatibility if referenced elsewhere
  // const [error, setError] = useState<string | null>(null); 

  // Estados para aba Comercial
  const [selectedRole, setSelectedRole] = useState<string>('todos');
  const [selectedSeller, setSelectedSeller] = useState<string>('todos');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('mes_atual');
  const [commercialMetrics, setCommercialMetrics] = useState<any>(null);
  const [commercialEvolutionData, setCommercialEvolutionData] = useState<any[]>([]);
  const [commercialLoading, setCommercialLoading] = useState(false);

  // Carregar métricas comerciais
  useEffect(() => {
    async function loadCommercialMetrics() {
      if (authLoading || !user || !selectedRole || !selectedPeriod) return

      try {
        setCommercialLoading(true)

        // Calcular mês baseado no período selecionado
        const now = new Date()
        let targetMonth: string

        if (selectedPeriod === 'mes_atual') {
          targetMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        } else if (selectedPeriod === 'mes_anterior') {
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          targetMonth = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`
        } else {
          targetMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        }

        // Buscar métricas da API
        const [metrics, evolution] = await Promise.all([
          rankingAPI.getMetrics({
            type: 'cards',
            month: targetMonth
          }),
          rankingAPI.getMetrics({
            type: 'evolucao',
            month: targetMonth
          })
        ])

        setCommercialMetrics(metrics)
        setCommercialEvolutionData(evolution || [])
      } catch (err) {
        console.error('Erro ao carregar métricas comerciais:', err)
      } finally {
        setCommercialLoading(false)
      }
    }

    loadCommercialMetrics()
  }, [selectedRole, selectedSeller, selectedPeriod, user, authLoading])

  // React Query Hooks
  const { data: funnelData, isLoading: funnelLoading, error: funnelError } = useFunnelMetrics({ startDate, endDate, enabled: !!user });
  const { data: evolutionData = [], isLoading: evolutionLoading } = useEvolutionMetrics({ startDate, endDate, selectedEvent, groupBy, enabled: !!user });
  const { data: productData = [], isLoading: productLoading } = useProductMetrics({ startDate, endDate, enabled: !!user });
  const { data: trafficData = [], isLoading: trafficLoading } = useTrafficMetrics({ startDate, endDate, enabled: !!user });
  const { data: creativeData = [], isLoading: creativeLoading } = useCreativeMetrics({ startDate, endDate, enabled: !!user });
  const { data: placementData = [], isLoading: placementLoading } = usePlacementMetrics({ startDate, endDate, enabled: !!user });
  const { data: vturbData = [], isLoading: vturbLoading } = useVturbMetrics({ startDate, endDate, enabled: !!user });

  // Combine loading states
  const loading = funnelLoading || evolutionLoading || productLoading || trafficLoading || creativeLoading || placementLoading || vturbLoading;

  // Combine error states
  const error = funnelError || null; // Only blocking error is funnel, others are partials usually

  // Realtime Subscription (Simplified to just invalidate queries if needed, or keep existing logic but manual refetch is now queryClient.invalidateQueries)
  // For now, let's disable the manual realtime debounce that called fetchMetrics.
  // Ideally we import queryClient and invalidate.
  useEffect(() => {
    const channel = supabase.channel('realtime-metrics')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'gtm_events' }, () => {
        setIsLive(true);
        // In a full implementation, we would use queryClient.invalidateQueries(['metrics']) here.
        // For now, we just indicate it's live. React Query 'staleTime' will handle background updates on window focus.
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setIsLive(true);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Preparar dados para gráfico de funil
  const funnelChartData = funnelData ? [
    { etapa: 'Visualizações', valor: funnelData.etapas.pageViews, cor: '#8884d8' },
    { etapa: 'Leads', valor: funnelData.etapas.leads, cor: '#82ca9d' },
    { etapa: 'Checkouts', valor: funnelData.etapas.checkouts, cor: '#ffc658' },
    { etapa: 'Vendas', valor: funnelData.etapas.purchases, cor: '#ff7c7c' },
  ] : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Filtros de Data */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              Período de Análise
              {isLive && (
                <Badge variant="outline" className="text-green-600 border-green-600 animate-pulse gap-1.5 font-normal">
                  <Wifi className="h-3 w-3" />
                  Ao Vivo
                </Badge>
              )}
            </CardTitle>
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

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Carregando métricas...</p>
            </div>
          </div>
        ) : error ? (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Erro ao carregar métricas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{(error as Error)?.message || 'Erro desconhecido'}</p>
              <Button onClick={() => window.location.reload()}>
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="marketing" className="space-y-6">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="marketing">Marketing</TabsTrigger>
              <TabsTrigger value="facebook">Facebook Ads</TabsTrigger>
              <TabsTrigger value="produtos">Produtos</TabsTrigger>
              <TabsTrigger value="comercial">Comercial</TabsTrigger>
              <TabsTrigger value="creative">Criativos</TabsTrigger>
              <TabsTrigger value="vturb">Vturb</TabsTrigger>
              <TabsTrigger value="funis">Funis</TabsTrigger>
            </TabsList>

            {/* Marketing - Funil de Conversão e Tráfego */}
            <TabsContent value="marketing" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Novo Funil Avançado */}
                <AdvancedFunnel
                  data={{
                    pageViews: funnelData?.etapas?.pageViews || 0,
                    addToCart: funnelData?.etapas?.addToCart || 0,
                    checkouts: funnelData?.etapas?.beginCheckout || funnelData?.etapas?.checkouts || 0,
                    purchases: funnelData?.etapas?.purchases || 0
                  }}
                />

                {/* Nova Tabela de Tráfego */}
                <TrafficSourcesTable data={trafficData} />
              </div>

              {/* Cards de Métricas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Visualizações
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{funnelData?.etapas.pageViews || 0}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Leads Gerados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{funnelData?.etapas.leads || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(funnelData?.conversao?.viewsParaLeads || 0).toFixed(1)}% conversão
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Checkouts Iniciados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{funnelData?.etapas?.checkouts || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(funnelData?.conversao?.leadsParaCheckout || 0).toFixed(1)}% conversão
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Vendas Concluídas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{funnelData?.etapas?.purchases || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(funnelData?.conversao?.checkoutParaVenda || 0).toFixed(1)}% conversão
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Financeiro */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Receita Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold">
                      R$ {(funnelData?.financeiro?.receitaTotal ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Ticket Médio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold">
                      R$ {(funnelData?.financeiro?.ticketMedio ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Facebook Ads */}
            <TabsContent value="facebook" className="space-y-6">
              <FacebookAdsDashboard startDate={startDate} endDate={endDate} />
            </TabsContent>

            {/* Produtos */}
            <TabsContent value="produtos" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Desempenho por Produto</CardTitle>
                  <CardDescription>
                    Análise de vendas e receita por produto
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {productData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={productData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="produto" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="vendas" fill="#8884d8" name="Vendas" />
                          <Bar dataKey="receita" fill="#82ca9d" name="Receita (R$)" />
                        </BarChart>
                      </ResponsiveContainer>

                      <div className="mt-6">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2">Produto</th>
                              <th className="text-right py-2">Vendas</th>
                              <th className="text-right py-2">Receita</th>
                              <th className="text-right py-2">Ticket Médio</th>
                            </tr>
                          </thead>
                          <tbody>
                            {productData.map((product, index) => (
                              <tr key={index} className="border-b">
                                <td className="py-2">{product.produto}</td>
                                <td className="text-right">{product.vendas}</td>
                                <td className="text-right">R$ {(product.receita ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                <td className="text-right">R$ {(product.ticketMedio ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      Nenhum dado de produto encontrado para o período selecionado
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Comercial - Métricas de SDR e Closer */}
            <TabsContent value="comercial" className="space-y-6">
              {/* Filtros */}
              <Card>
                <CardHeader>
                  <CardTitle>Métricas Comerciais</CardTitle>
                  <CardDescription>Acompanhe o desempenho de SDRs e Closers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {/* Filtro de Função */}
                    <div>
                      <label htmlFor="role-filter" className="text-sm font-medium mb-2 block">Função</label>
                      <select
                        id="role-filter"
                        className="w-full border rounded px-3 py-2"
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                      >
                        <option value="todos">Todos</option>
                        <option value="sdr">SDR</option>
                        <option value="closer">Closer</option>
                      </select>
                    </div>

                    {/* Filtro de Vendedor */}
                    <div>
                      <label htmlFor="seller-filter" className="text-sm font-medium mb-2 block">Vendedor</label>
                      <select
                        id="seller-filter"
                        className="w-full border rounded px-3 py-2"
                        value={selectedSeller}
                        onChange={(e) => setSelectedSeller(e.target.value)}
                      >
                        <option value="todos">Todos</option>
                        {/* TODO: Carregar lista de vendedores dinamicamente */}
                      </select>
                    </div>

                    {/* Filtro de Período */}
                    <div>
                      <label htmlFor="period-filter" className="text-sm font-medium mb-2 block">Período</label>
                      <select
                        id="period-filter"
                        className="w-full border rounded px-3 py-2"
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                      >
                        <option value="mes_atual">Mês Atual</option>
                        <option value="mes_anterior">Mês Anterior</option>
                        <option value="trimestre">Trimestre</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Métricas SDR */}
              {(selectedRole === 'todos' || selectedRole === 'sdr') && (
                <Card>
                  <CardHeader>
                    <CardTitle>Métricas de SDR</CardTitle>
                    <CardDescription>Performance de prospecção e agendamentos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {commercialLoading ? (
                      <p className="text-center text-muted-foreground py-8">Carregando métricas...</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-4">
                        <div className="border rounded-lg p-4">
                          <p className="text-sm text-muted-foreground">Ligações Realizadas</p>
                          <p className="text-3xl font-bold mt-2">
                            {commercialMetrics?.ligacoes_realizadas || 0}
                          </p>
                        </div>
                        <div className="border rounded-lg p-4">
                          <p className="text-sm text-muted-foreground">Agendamentos Feitos</p>
                          <p className="text-3xl font-bold mt-2">
                            {commercialMetrics?.total_agendamentos || 0}
                          </p>
                        </div>
                        <div className="border rounded-lg p-4">
                          <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                          <p className="text-3xl font-bold mt-2">
                            {commercialMetrics?.taxa_conversao_agendamentos || 0}%
                          </p>
                        </div>
                        <div className="border rounded-lg p-4">
                          <p className="text-sm text-muted-foreground">Agendamentos Qualificados</p>
                          <p className="text-3xl font-bold mt-2">
                            {commercialMetrics?.agendamentos_qualificados || 0}
                          </p>
                        </div>
                        <div className="border rounded-lg p-4">
                          <p className="text-sm text-muted-foreground">Tempo Médio Resposta</p>
                          <p className="text-3xl font-bold mt-2">
                            {commercialMetrics?.tempo_medio_resposta || 0}min
                          </p>
                        </div>
                        <div className="border rounded-lg p-4">
                          <p className="text-sm text-muted-foreground">No-shows</p>
                          <p className="text-3xl font-bold mt-2">
                            {commercialMetrics?.no_shows || 0}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Métricas Closer */}
              {(selectedRole === 'todos' || selectedRole === 'closer') && (
                <Card>
                  <CardHeader>
                    <CardTitle>Métricas de Closer</CardTitle>
                    <CardDescription>Performance de fechamento e vendas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {commercialLoading ? (
                      <p className="text-center text-muted-foreground py-8">Carregando métricas...</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-4">
                        <div className="border rounded-lg p-4">
                          <p className="text-sm text-muted-foreground">Vendas Fechadas</p>
                          <p className="text-3xl font-bold mt-2">
                            {commercialMetrics?.total_vendas || 0}
                          </p>
                        </div>
                        <div className="border rounded-lg p-4">
                          <p className="text-sm text-muted-foreground">Receita Gerada</p>
                          <p className="text-3xl font-bold mt-2">
                            R$ {(commercialMetrics?.faturamento_total || 0).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <div className="border rounded-lg p-4">
                          <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                          <p className="text-3xl font-bold mt-2">
                            {commercialMetrics?.taxa_conversao_geral || 0}%
                          </p>
                        </div>
                        <div className="border rounded-lg p-4">
                          <p className="text-sm text-muted-foreground">Ticket Médio</p>
                          <p className="text-3xl font-bold mt-2">
                            R$ {(commercialMetrics?.ticket_medio || 0).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <div className="border rounded-lg p-4">
                          <p className="text-sm text-muted-foreground">Taxa de Presença</p>
                          <p className="text-3xl font-bold mt-2">
                            {(100 - (commercialMetrics?.taxa_nao_comparecimento || 0)).toFixed(1)}%
                          </p>
                        </div>
                        <div className="border rounded-lg p-4">
                          <p className="text-sm text-muted-foreground">Follow-ups Realizados</p>
                          <p className="text-3xl font-bold mt-2">
                            {commercialMetrics?.follow_ups || 0}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Gráfico de Evolução */}
              <Card>
                <CardHeader>
                  <CardTitle>Evolução Temporal</CardTitle>
                  <CardDescription>Acompanhe a evolução das métricas ao longo do tempo</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={evolutionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {selectedRole === 'sdr' && (
                        <>
                          <Line type="monotone" dataKey="ligacoes" stroke="#8884d8" name="Ligações" />
                          <Line type="monotone" dataKey="agendamentos" stroke="#82ca9d" name="Agendamentos" />
                        </>
                      )}
                      {selectedRole === 'closer' && (
                        <>
                          <Line type="monotone" dataKey="vendas" stroke="#8884d8" name="Vendas" />
                          <Line type="monotone" dataKey="receita" stroke="#82ca9d" name="Receita" />
                        </>
                      )}
                      {selectedRole === 'todos' && (
                        <>
                          <Line type="monotone" dataKey="agendamentos" stroke="#8884d8" name="Agendamentos" />
                          <Line type="monotone" dataKey="vendas" stroke="#82ca9d" name="Vendas" />
                        </>
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                  {evolutionData.length === 0 && !commercialLoading && (
                    <p className="text-center text-sm text-muted-foreground mt-4">
                      Nenhum dado disponível para o período selecionado
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Funis */}
            {/* Aba Criativos */}
            <TabsContent value="creative" className="space-y-6">
              <CreativeRankingTable data={creativeData} />
            </TabsContent>

            {/* Aba Vturb */}
            <TabsContent value="vturb" className="space-y-6">
              <VslComparisonDashboard vsls={vturbData} startDate={startDate} endDate={endDate} />
            </TabsContent>

            <TabsContent value="funis" className="space-y-6">
              <FunisCadastrados
                startDate={startDate}
                endDate={endDate}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout >
  );
}
