// Neo-Glassmorphism Dashboard - Design Philosophy:
// - Translucent cards with backdrop-filter blur for depth
// - Smooth gradients and luminous accents
// - Generous spacing for visual breathing
// - Fluid transitions and micro-interactions

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Target, 
  Users, 
  DollarSign, 
  Calendar,
  BarChart3,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  scenariosData, 
  formatCurrency, 
  formatNumber,
  calculateProgress,
  type Scenario 
} from '@/lib/salesData';

export default function Home() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario>('3M');
  const [currentWeek, setCurrentWeek] = useState(1);
  
  const scenario = scenariosData[selectedScenario];
  const weekData = scenario.weeks[currentWeek - 1];
  
  // Calcular totais
  const totalMarketingSales = useMemo(() => {
    return scenario.weeks.reduce((sum, week) => sum + week.marketingDirectSales, 0);
  }, [scenario]);
  
  const totalCommercialSales = useMemo(() => {
    return scenario.weeks.reduce((sum, week) => sum + week.commercialSales, 0);
  }, [scenario]);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col items-center justify-center gap-4 mb-6">
            <img 
              src="/douravita-logo.png" 
              alt="DouraVita" 
              className="h-20 md:h-24 w-auto"
            />
          </div>
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-[#00a67d] via-[#418ecb] to-[#5a4b99] bg-clip-text text-transparent">
              Dashboard de Metas de Vendas
            </h1>
            <p className="text-lg text-muted-foreground">
              Janeiro 2025 - Suplementos de Longevidade Ativa
            </p>
          </div>
        </header>

        {/* Scenario Selector */}
        <div className="glass-card p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-[#00a67d]" />
            Selecione o Cenário de Faturamento
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['3M', '4M', '5M'] as Scenario[]).map((id) => {
              const data = scenariosData[id];
              const isSelected = selectedScenario === id;
              return (
                <button
                  key={id}
                  onClick={() => setSelectedScenario(id)}
                  className={`glass-card-hover p-6 text-left transition-all ${
                    isSelected 
                      ? 'ring-2 ring-[#00a67d] bg-[#00a67d]/10' 
                      : 'hover:bg-card/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl font-bold">{formatCurrency(data.totalRevenue)}</span>
                    {isSelected && <CheckCircle2 className="w-6 h-6 text-[#00a67d]" />}
                  </div>
                  <p className="text-sm text-muted-foreground">Meta Total</p>
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Marketing Direto</span>
                      <span className="font-semibold">{data.marketingDirectPercentage}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Time Comercial</span>
                      <span className="font-semibold">{data.commercialPercentage}%</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card p-6 glass-card-hover">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-[#00a67d]" />
                  <span className="text-xs font-medium text-[#00a67d]">TOTAL</span>
            </div>
            <p className="text-3xl font-bold mb-1">{formatCurrency(scenario.totalRevenue)}</p>
            <p className="text-sm text-muted-foreground">Faturamento Meta</p>
          </Card>

          <Card className="glass-card p-6 glass-card-hover">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-[#418ecb]" />
                  <span className="text-xs font-medium text-[#418ecb]">MARKETING</span>
            </div>
            <p className="text-3xl font-bold mb-1">{formatNumber(totalMarketingSales)}</p>
            <p className="text-sm text-muted-foreground">Vendas Diretas</p>
          </Card>

          <Card className="glass-card p-6 glass-card-hover">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-[#5a4b99]" />
                  <span className="text-xs font-medium text-[#5a4b99]">COMERCIAL</span>
            </div>
            <p className="text-3xl font-bold mb-1">{formatNumber(totalCommercialSales)}</p>
            <p className="text-sm text-muted-foreground">Vendas High-Ticket</p>
          </Card>

          <Card className="glass-card p-6 glass-card-hover">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-8 h-8 text-[#efd565]" />
                  <span className="text-xs font-medium text-[#efd565]">TICKET MÉDIO</span>
            </div>
            <p className="text-3xl font-bold mb-1">R$ 1.000</p>
            <p className="text-sm text-muted-foreground">Funil Principal</p>
          </Card>
        </div>

        {/* Week Selector */}
        <div className="glass-card p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#418ecb]" />
            Selecione a Semana
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {scenario.weeks.map((week) => (
              <button
                key={week.week}
                onClick={() => setCurrentWeek(week.week)}
                className={`glass-card-hover p-4 text-center transition-all ${
                  currentWeek === week.week
                    ? 'ring-2 ring-[#418ecb] bg-[#418ecb]/10'
                    : 'hover:bg-card/60'
                }`}
              >
                <p className="text-sm text-muted-foreground mb-1">Semana {week.week}</p>
                <p className="font-semibold">{week.period}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatCurrency(week.marketingDirectRevenue + week.commercialRevenue)}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Weekly Details */}
        <Tabs defaultValue="marketing" className="mb-8">
          <TabsList className="glass-card w-full md:w-auto">
            <TabsTrigger value="marketing" className="flex-1 md:flex-none">
              Marketing Direto
            </TabsTrigger>
            <TabsTrigger value="commercial" className="flex-1 md:flex-none">
              Time Comercial
            </TabsTrigger>
            <TabsTrigger value="operations" className="flex-1 md:flex-none">
              Operações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="marketing" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#00a67d]" />
                  Metas de Vendas
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Meta Semanal</span>
                      <span className="font-semibold">{formatNumber(weekData.marketingDirectSales)} vendas</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Faturamento</span>
                      <span className="font-semibold text-[#00a67d]">{formatCurrency(weekData.marketingDirectRevenue)}</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-border/50">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Meta Diária</span>
                      <span className="text-2xl font-bold text-[#00a67d]">{formatNumber(weekData.dailyTarget)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">vendas por dia</p>
                  </div>
                </div>
              </Card>

              <Card className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#418ecb]" />
                  Tráfego e Conversão
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Visitantes Diários</span>
                      <span className="font-semibold">{formatNumber(weekData.dailyVisitors)}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Taxa de Conversão</span>
                      <span className="font-semibold text-[#418ecb]">1.5%</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-border/50">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">CPA Alvo</span>
                      <span className="text-2xl font-bold text-[#418ecb]">R$ 450</span>
                    </div>
                    <p className="text-xs text-muted-foreground">custo por aquisição</p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="commercial" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#5a4b99]" />
                  Metas do Time
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Vendas Semanais</span>
                      <span className="font-semibold">{formatNumber(weekData.closerSales)} vendas</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Faturamento</span>
                      <span className="font-semibold text-[#5a4b99]">{formatCurrency(weekData.commercialRevenue)}</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-border/50">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Ticket Médio</span>
                      <span className="text-2xl font-bold text-[#5a4b99]">R$ 20.000</span>
                    </div>
                    <p className="text-xs text-muted-foreground">produtos high-ticket</p>
                  </div>
                </div>
              </Card>

              <Card className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#efd565]" />
                  Performance SDR/Closer
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Agendamentos (SDR)</span>
                      <span className="font-semibold">{formatNumber(weekData.sdrMeetings)} reuniões</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Taxa de Conversão</span>
                      <span className="font-semibold text-[#efd565]">20%</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-border/50">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Meta Diária SDR</span>
                      <span className="text-2xl font-bold text-[#efd565]">4</span>
                    </div>
                    <p className="text-xs text-muted-foreground">agendamentos por dia</p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="operations" className="mt-6">
            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-[#f1b82c]" />
                Observações Operacionais - Semana {currentWeek}
              </h3>
              <div className="space-y-3 text-sm">
                {currentWeek === 1 && (
                  <>
                    <p className="flex items-start gap-2">
                      <span className="text-[#00a67d] mt-1">•</span>
                      <span><strong>Marketing:</strong> Foco em validar a VSL e otimizar a conversão. Performance inicial de 25% da capacidade total.</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-[#418ecb] mt-1">•</span>
                      <span><strong>Comercial:</strong> Estruturar o processo e qualificar os primeiros leads. 1 SDR + 1 Closer + Head.</span>
                    </p>
                  </>
                )}
                {currentWeek === 2 && (
                  <>
                    <p className="flex items-start gap-2">
                      <span className="text-[#00a67d] mt-1">•</span>
                      <span><strong>Marketing:</strong> Início da escala após validação. Monitorar CPA rigorosamente. Performance de 60% da capacidade.</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-[#418ecb] mt-1">•</span>
                      <span><strong>Comercial:</strong> Primeiro closer começa a tracionar. SDR precisa qualificar leads rapidamente.</span>
                    </p>
                  </>
                )}
                {(currentWeek === 3 || currentWeek === 4) && (
                  <>
                    <p className="flex items-start gap-2">
                      <span className="text-[#00a67d] mt-1">•</span>
                      <span><strong>Marketing:</strong> Escala total do tráfego. Diversificar criativos para evitar saturação. Múltiplos funis rodando em paralelo.</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-[#418ecb] mt-1">•</span>
                      <span><strong>Comercial:</strong> Time completo operando (2 SDRs + 2 Closers). Exige performance de elite para atingir metas.</span>
                    </p>
                  </>
                )}
                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    <strong>Premissas:</strong> Conversão VSL/TSL: 1.5-1.8% | CPA: R$ 400-500 | Conversão Upsell: 20-30% | Taxa Closer: 20%
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Summary Table */}
        <Card className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#00a67d]" />
            Resumo Completo - Cenário {selectedScenario}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-2 font-semibold">Semana</th>
                  <th className="text-right py-3 px-2 font-semibold">Vendas Mkt</th>
                  <th className="text-right py-3 px-2 font-semibold">Receita Mkt</th>
                  <th className="text-right py-3 px-2 font-semibold">Vendas Com</th>
                  <th className="text-right py-3 px-2 font-semibold">Receita Com</th>
                  <th className="text-right py-3 px-2 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {scenario.weeks.map((week) => (
                  <tr 
                    key={week.week} 
                    className={`border-b border-border/30 hover:bg-card/30 transition-colors ${
                      currentWeek === week.week ? 'bg-[#00a67d]/10' : ''
                    }`}
                  >
                    <td className="py-3 px-2">
                      <span className="font-medium">Semana {week.week}</span>
                      <span className="text-xs text-muted-foreground ml-2">({week.period})</span>
                    </td>
                    <td className="text-right py-3 px-2">{formatNumber(week.marketingDirectSales)}</td>
                    <td className="text-right py-3 px-2 text-[#00a67d]">{formatCurrency(week.marketingDirectRevenue)}</td>
                    <td className="text-right py-3 px-2">{formatNumber(week.commercialSales)}</td>
                    <td className="text-right py-3 px-2 text-[#418ecb]">{formatCurrency(week.commercialRevenue)}</td>
                    <td className="text-right py-3 px-2 font-semibold">
                      {formatCurrency(week.marketingDirectRevenue + week.commercialRevenue)}
                    </td>
                  </tr>
                ))}
                <tr className="font-bold bg-card/50">
                  <td className="py-3 px-2">TOTAL</td>
                  <td className="text-right py-3 px-2">{formatNumber(totalMarketingSales)}</td>
                  <td className="text-right py-3 px-2 text-[#00a67d]">{formatCurrency(scenario.marketingDirectTotal)}</td>
                  <td className="text-right py-3 px-2">{formatNumber(totalCommercialSales)}</td>
                  <td className="text-right py-3 px-2 text-[#418ecb]">{formatCurrency(scenario.commercialTotal)}</td>
                  <td className="text-right py-3 px-2 text-xl">{formatCurrency(scenario.totalRevenue)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-muted-foreground">
          <p>Dashboard de Metas de Vendas - Janeiro 2025</p>
          <p className="mt-1">Suplementos de Longevidade Ativa</p>
        </footer>
      </div>
    </div>
  );
}
