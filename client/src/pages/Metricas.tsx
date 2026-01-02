import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  CalendarIcon,
  Loader2,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { gtmAnalyticsAPI } from "@/lib/edge-functions";
import FunilMarketing from "@/components/metricas/FunilMarketing";
import FunilComercial from "@/components/metricas/FunilComercial";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Metricas() {
  const { user, loading: authLoading } = useAuth();
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [funnelData, setFunnelData] = useState<any>(null);
  const [evolutionData, setEvolutionData] = useState<any[]>([]);
  const [productData, setProductData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<'purchase' | 'generate_lead' | 'begin_checkout'>('purchase');
  const [groupBy, setGroupBy] = useState<'hour' | 'day' | 'week'>('day');

  // Carregar dados do GTM
  useEffect(() => {
    async function loadMetrics() {
      // Aguardar autenticação
      if (authLoading) return;
      if (!user) return;

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
  }, [startDate, endDate, selectedEvent, groupBy, user, authLoading]);

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
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="funil" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="funil">Funil de Conversão</TabsTrigger>
              <TabsTrigger value="evolucao">Evolução</TabsTrigger>
              <TabsTrigger value="produtos">Produtos</TabsTrigger>
              <TabsTrigger value="marketing">Funil Marketing</TabsTrigger>
              <TabsTrigger value="comercial">Funil Comercial</TabsTrigger>
            </TabsList>

            {/* Funil de Conversão */}
            <TabsContent value="funil" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Funil de Conversão</CardTitle>
                  <CardDescription>
                    Visualização do funil completo de marketing e vendas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={funnelChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="etapa" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
                        {funnelChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.cor} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

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
                      {funnelData?.conversao.viewsParaLeads.toFixed(1)}% conversão
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
                    <div className="text-3xl font-bold">{funnelData?.etapas.checkouts || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {funnelData?.conversao.leadsParaCheckout.toFixed(1)}% conversão
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
                    <div className="text-3xl font-bold">{funnelData?.etapas.purchases || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {funnelData?.conversao.checkoutParaVenda.toFixed(1)}% conversão
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
                      R$ {funnelData?.financeiro.receitaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Ticket Médio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold">
                      R$ {funnelData?.financeiro.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Evolução Temporal */}
            <TabsContent value="evolucao" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Evolução Temporal</CardTitle>
                  <CardDescription>
                    Acompanhe a evolução dos eventos ao longo do tempo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 mb-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Evento</label>
                      <select
                        className="border rounded px-3 py-2"
                        value={selectedEvent}
                        onChange={(e) => setSelectedEvent(e.target.value as any)}
                      >
                        <option value="purchase">Vendas</option>
                        <option value="generate_lead">Leads</option>
                        <option value="begin_checkout">Checkouts</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Agrupar por</label>
                      <select
                        className="border rounded px-3 py-2"
                        value={groupBy}
                        onChange={(e) => setGroupBy(e.target.value as any)}
                      >
                        <option value="hour">Hora</option>
                        <option value="day">Dia</option>
                        <option value="week">Semana</option>
                      </select>
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={evolutionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} name="Quantidade" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
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
                                <td className="text-right">R$ {product.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                <td className="text-right">R$ {product.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
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

            {/* Funil Marketing */}
            <TabsContent value="marketing" className="space-y-6">
              <FunilMarketing
                startDate={startDate}
                endDate={endDate}
              />
            </TabsContent>

            {/* Funil Comercial */}
            <TabsContent value="comercial" className="space-y-6">
              <FunilComercial
                startDate={startDate}
                endDate={endDate}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
