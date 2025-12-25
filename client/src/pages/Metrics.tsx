import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Table2, GitBranch, LayoutGrid } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";

type ViewMode = 'grafico' | 'tabela' | 'stage' | 'cards';
type FunnelType = 'marketing' | 'comercial';

interface FunnelMetrics {
  // Marketing
  leads?: number;
  vendas?: number;
  receita?: number;
  custoTotal?: number;
  cpl?: number;
  cpa?: number;
  taxaConversao?: number;
  
  // Comercial
  agendamentos?: number;
  contatos?: number;
  noShow?: number;
  taxaPresenca?: number;
  taxaAgendamento?: number;
}

export default function Metrics() {
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [selectedFunnel, setSelectedFunnel] = useState<FunnelType>('marketing');
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<FunnelMetrics>({});
  
  // Filtros
  const hoje = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(hoje.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(hoje.getFullYear());

  const mesesNomes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  useEffect(() => {
    loadMetrics();
  }, [selectedMonth, selectedYear, selectedFunnel]);

  async function loadMetrics() {
    setLoading(true);
    try {
      // TODO: Chamar Edge Function get-funnel-metrics
      // Por enquanto, dados mockados
      if (selectedFunnel === 'marketing') {
        setMetrics({
          leads: 1250,
          vendas: 85,
          receita: 425000,
          custoTotal: 45000,
          cpl: 36,
          cpa: 529.41,
          taxaConversao: 6.8
        });
      } else {
        setMetrics({
          agendamentos: 320,
          contatos: 280,
          vendas: 42,
          receita: 210000,
          noShow: 45,
          taxaPresenca: 85.94,
          taxaAgendamento: 114.29,
          taxaConversao: 15
        });
      }
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const renderCards = () => {
    if (selectedFunnel === 'marketing') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Leads Gerados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.leads?.toLocaleString('pt-BR')}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">CPL</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.cpl || 0)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">CPA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.cpa || 0)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Conversão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.taxaConversao?.toFixed(2)}%</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.vendas?.toLocaleString('pt-BR')}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Receita</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.receita || 0)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Custo Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.custoTotal || 0)}</div>
            </CardContent>
          </Card>
        </div>
      );
    } else {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Agendamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.agendamentos?.toLocaleString('pt-BR')}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Contatos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.contatos?.toLocaleString('pt-BR')}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.vendas?.toLocaleString('pt-BR')}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Conversão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.taxaConversao?.toFixed(2)}%</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Agendamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.taxaAgendamento?.toFixed(2)}%</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">No-Show</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.noShow?.toLocaleString('pt-BR')}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Presença</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.taxaPresenca?.toFixed(2)}%</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Receita</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.receita || 0)}</div>
            </CardContent>
          </Card>
        </div>
      );
    }
  };

  const renderTabela = () => {
    if (selectedFunnel === 'marketing') {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Métricas de Marketing</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Métrica</th>
                  <th className="text-right py-2">Valor</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2">Leads Gerados</td>
                  <td className="text-right">{metrics.leads?.toLocaleString('pt-BR')}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Vendas</td>
                  <td className="text-right">{metrics.vendas?.toLocaleString('pt-BR')}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Receita</td>
                  <td className="text-right">{formatCurrency(metrics.receita || 0)}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Custo Total</td>
                  <td className="text-right">{formatCurrency(metrics.custoTotal || 0)}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">CPL (Custo por Lead)</td>
                  <td className="text-right">{formatCurrency(metrics.cpl || 0)}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">CPA (Custo por Aquisição)</td>
                  <td className="text-right">{formatCurrency(metrics.cpa || 0)}</td>
                </tr>
                <tr>
                  <td className="py-2 font-bold">Taxa de Conversão</td>
                  <td className="text-right font-bold">{metrics.taxaConversao?.toFixed(2)}%</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      );
    } else {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Métricas Comerciais</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Métrica</th>
                  <th className="text-right py-2">Valor</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2">Agendamentos</td>
                  <td className="text-right">{metrics.agendamentos?.toLocaleString('pt-BR')}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Contatos</td>
                  <td className="text-right">{metrics.contatos?.toLocaleString('pt-BR')}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Vendas</td>
                  <td className="text-right">{metrics.vendas?.toLocaleString('pt-BR')}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Receita</td>
                  <td className="text-right">{formatCurrency(metrics.receita || 0)}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">No-Show</td>
                  <td className="text-right">{metrics.noShow?.toLocaleString('pt-BR')}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Taxa de Presença</td>
                  <td className="text-right">{metrics.taxaPresenca?.toFixed(2)}%</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Taxa de Agendamento</td>
                  <td className="text-right">{metrics.taxaAgendamento?.toFixed(2)}%</td>
                </tr>
                <tr>
                  <td className="py-2 font-bold">Taxa de Conversão</td>
                  <td className="text-right font-bold">{metrics.taxaConversao?.toFixed(2)}%</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      );
    }
  };

  const renderStage = () => {
    if (selectedFunnel === 'marketing') {
      const stages = [
        { label: 'Leads', value: metrics.leads || 0, percentage: 100 },
        { label: 'Vendas', value: metrics.vendas || 0, percentage: metrics.taxaConversao || 0 }
      ];

      return (
        <Card>
          <CardHeader>
            <CardTitle>Funil de Marketing</CardTitle>
            <CardDescription>Visualização por etapas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stages.map((stage, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{stage.label}</span>
                    <span>{stage.value.toLocaleString('pt-BR')} ({stage.percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-8 relative overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium transition-all"
                      style={{ width: `${stage.percentage}%` }}
                    >
                      {stage.percentage > 20 && `${stage.percentage.toFixed(1)}%`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    } else {
      const stages = [
        { label: 'Contatos', value: metrics.contatos || 0, percentage: 100 },
        { label: 'Agendamentos', value: metrics.agendamentos || 0, percentage: metrics.taxaAgendamento || 0 },
        { label: 'Presentes', value: (metrics.agendamentos || 0) - (metrics.noShow || 0), percentage: metrics.taxaPresenca || 0 },
        { label: 'Vendas', value: metrics.vendas || 0, percentage: metrics.taxaConversao || 0 }
      ];

      return (
        <Card>
          <CardHeader>
            <CardTitle>Funil Comercial</CardTitle>
            <CardDescription>Visualização por etapas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stages.map((stage, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{stage.label}</span>
                    <span>{stage.value.toLocaleString('pt-BR')} ({stage.percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-8 relative overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium transition-all"
                      style={{ width: `${Math.min(stage.percentage, 100)}%` }}
                    >
                      {stage.percentage > 20 && `${stage.percentage.toFixed(1)}%`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }
  };

  const renderGrafico = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gráfico de Métricas</CardTitle>
          <CardDescription>Em desenvolvimento - visualização gráfica</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <BarChart3 className="h-16 w-16 mx-auto mb-2 opacity-50" />
            <p>Visualização gráfica em desenvolvimento</p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Métricas</h1>
            <p className="text-muted-foreground">Análise detalhada dos funis</p>
          </div>
          
          {/* Filtros */}
          <div className="flex gap-2">
            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mesesNomes.map((mes, idx) => (
                  <SelectItem key={idx} value={(idx + 1).toString()}>
                    {mes}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map((ano) => (
                  <SelectItem key={ano} value={ano.toString()}>
                    {ano}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Modo de visualização */}
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

        {/* Tabs de Funis */}
        <Tabs value={selectedFunnel} onValueChange={(v) => setSelectedFunnel(v as FunnelType)}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="marketing">Funil de Marketing</TabsTrigger>
            <TabsTrigger value="comercial">Funil Comercial</TabsTrigger>
          </TabsList>

          <TabsContent value="marketing" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {viewMode === 'cards' && renderCards()}
                {viewMode === 'tabela' && renderTabela()}
                {viewMode === 'stage' && renderStage()}
                {viewMode === 'grafico' && renderGrafico()}
              </>
            )}
          </TabsContent>

          <TabsContent value="comercial" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {viewMode === 'cards' && renderCards()}
                {viewMode === 'tabela' && renderTabela()}
                {viewMode === 'stage' && renderStage()}
                {viewMode === 'grafico' && renderGrafico()}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
