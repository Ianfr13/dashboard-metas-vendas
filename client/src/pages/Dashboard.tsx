import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  Calendar,
  Activity,
  RefreshCw,
} from "lucide-react";
import GoalGauge from "@/components/GoalGauge";
import GoalCelebration from "@/components/GoalCelebration";
import DashboardLayout from "@/components/DashboardLayout";
import { dashboardAPI } from "@/lib/edge-functions";
import { safeToFixed } from "@/lib/formatters";

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);

  // Filtros
  const hoje = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(hoje.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(hoje.getFullYear());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [selectedSubMeta, setSelectedSubMeta] = useState<number | null>(null);

  // Funções auxiliares para cálculos
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  const getWeeksInMonth = (month: number, year: number) => {
    const days = getDaysInMonth(month, year);
    return Math.ceil(days / 7);
  };

  const getTodaySales = (salesByDay: any) => {
    const today = new Date().toISOString().split('T')[0];
    return salesByDay?.[today]?.revenue || 0;
  };

  const getThisWeekSales = (salesByDay: any) => {
    if (!salesByDay) return 0;

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Domingo, 6 = Sábado

    // Encontrar o domingo desta semana
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - dayOfWeek);
    sunday.setHours(0, 0, 0, 0);

    let weekRevenue = 0;

    // Somar vendas de domingo até hoje
    for (let i = 0; i <= dayOfWeek; i++) {
      const date = new Date(sunday);
      date.setDate(sunday.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      weekRevenue += salesByDay[dateStr]?.revenue || 0;
    }

    return weekRevenue;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await dashboardAPI.getMetaPrincipal(selectedMonth, selectedYear);
      setDashboardData(data);

      if (data?.metaPrincipal?.progresso >= 100) {
        setShowCelebration(true);
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const meta = dashboardData?.metaPrincipal;
  const subMetas = dashboardData?.subMetas || [];

  // Percentuais configurados no Admin (padrão 85/15)
  const percentualMarketing = meta?.percentual_marketing || 85;
  const percentualComercial = meta?.percentual_comercial || 15;

  // Se uma submeta está selecionada, usar seu valor como meta
  const subMetaSelecionada = selectedSubMeta !== null ? subMetas.find((sm: any) => sm.id === selectedSubMeta) : null;
  const valorMeta = subMetaSelecionada ? subMetaSelecionada.valor : (meta?.valor_meta || 0);
  const valorAtual = meta?.valor_atual || 0;
  const progressoReal = valorMeta > 0 ? (valorAtual / valorMeta) * 100 : 0;

  // Calcular dias baseado no mês/ano selecionado
  const diasNoMes = getDaysInMonth(selectedMonth, selectedYear);

  // Determinar se o mês selecionado é passado, atual ou futuro
  const mesAtual = selectedMonth === (hoje.getMonth() + 1) && selectedYear === hoje.getFullYear();
  const mesPassado = selectedYear < hoje.getFullYear() ||
    (selectedYear === hoje.getFullYear() && selectedMonth < (hoje.getMonth() + 1));
  const mesFuturo = selectedYear > hoje.getFullYear() ||
    (selectedYear === hoje.getFullYear() && selectedMonth > (hoje.getMonth() + 1));

  // Calcular dias decorridos e restantes baseado no período
  let diaAtual: number;
  let diasDecorridos: number;
  let diasRestantes: number;

  if (mesPassado) {
    // Mês passado: todos os dias decorridos, nenhum restante
    diaAtual = diasNoMes;
    diasDecorridos = diasNoMes;
    diasRestantes = 0;
  } else if (mesFuturo) {
    // Mês futuro: nenhum dia decorrido, todos restantes
    diaAtual = 0;
    diasDecorridos = 0;
    diasRestantes = diasNoMes;
  } else {
    // Mês atual: calcular normalmente
    diaAtual = hoje.getDate();
    diasDecorridos = diaAtual;
    diasRestantes = diasNoMes - diaAtual;
  }
  const progressoEsperado = (diasDecorridos / diasNoMes) * 100;
  const deficit = (valorAtual - (valorMeta * (progressoEsperado / 100)));

  const metaMarketing = valorMeta * (percentualMarketing / 100);
  const metaComercial = valorMeta * (percentualComercial / 100);
  const vendasMarketing = valorAtual * (percentualMarketing / 100);
  const vendasComercial = valorAtual * (percentualComercial / 100);
  const ticketMedio = valorAtual > 0 ? valorAtual / 100 : 0;

  const ritmoAtual = diasDecorridos > 0 ? valorAtual / diasDecorridos : 0;
  const ritmoNecessario = diasRestantes > 0 ? (valorMeta - valorAtual) / diasRestantes : 0;

  // Função para calcular status do prêmio
  const calcularStatusPremio = (valorSubMeta: number, atingida: number) => {
    const progressoSubMeta = valorMeta > 0 ? (valorAtual / valorSubMeta) * 100 : 0;
    const mesAtual = meta?.mes === hoje.getMonth() + 1 && meta?.ano === hoje.getFullYear();
    const mesPassado = meta?.ano ? (meta.ano < hoje.getFullYear() || (meta.ano === hoje.getFullYear() && (meta.mes || 0) < hoje.getMonth() + 1)) : false;

    if (atingida === 1) {
      return { status: 'desbloqueado', icon: '✅', color: 'bg-green-500', text: 'Prêmio Desbloqueado!' };
    }
    if (mesPassado) {
      return { status: 'perdido', icon: '😢', color: 'bg-red-500', text: 'Prêmio Perdido' };
    }
    if (mesAtual && progressoSubMeta >= 80 && progressoSubMeta < 100) {
      return { status: 'quase', icon: '🔥', color: 'bg-orange-500', text: 'Quase lá!' };
    }
    return { status: 'andamento', icon: '⏳', color: 'bg-blue-500', text: 'Em andamento' };
  };

  // Status do grande prêmio
  const statusGrandePremio = () => {
    const mesAtual = meta?.mes === hoje.getMonth() + 1 && meta?.ano === hoje.getFullYear();
    const mesPassado = meta?.ano ? (meta.ano < hoje.getFullYear() || (meta.ano === hoje.getFullYear() && (meta.mes || 0) < hoje.getMonth() + 1)) : false;

    if (progressoReal >= 100) {
      return { status: 'desbloqueado', icon: '🎉', color: 'bg-green-500', text: 'Grande Prêmio Desbloqueado!' };
    }
    if (mesPassado) {
      return { status: 'perdido', icon: '😢', color: 'bg-red-500', text: 'Grande Prêmio Perdido' };
    }
    if (mesAtual && progressoReal >= 80 && progressoReal < 100) {
      return { status: 'quase', icon: '🔥', color: 'bg-orange-500', text: 'Quase lá!' };
    }
    return { status: 'andamento', icon: '⏳', color: 'bg-blue-500', text: 'Em andamento' };
  };

  const handleRefresh = () => {
    fetchData();
  };

  // Cálculos baseados no modo de visualização - TODOS OS VALORES
  const getDisplayValues = () => {
    const salesByDay = dashboardData?.salesByDay || {};
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const weeksInMonth = getWeeksInMonth(selectedMonth, selectedYear);
    const now = new Date();
    const currentHour = now.getHours();
    const hoursInDay = 24;

    // DEBUG
    console.log('🔍 getDisplayValues called');
    console.log('viewMode:', viewMode);
    console.log('salesByDay:', salesByDay);
    console.log('dashboardData:', dashboardData);

    switch (viewMode) {
      case 'day': {
        // Meta e vendas diárias
        const metaDiaria = valorMeta / daysInMonth;
        const vendasHoje = getTodaySales(salesByDay);
        const progressoDiario = metaDiaria > 0 ? (vendasHoje / metaDiaria) * 100 : 0;

        console.log('📅 MODO DIÁRIO:');
        console.log('  metaDiaria:', metaDiaria);
        console.log('  vendasHoje:', vendasHoje);
        console.log('  progressoDiario:', progressoDiario);

        // Se mês passado ou futuro, não calcular horas (não faz sentido)
        let horasRestantes: number;
        let progressoEsperadoDia: number;
        let ritmoAtualDia: number;
        let ritmoNecessarioDia: number;

        if (mesPassado) {
          // Mês passado: dia completo
          horasRestantes = 0;
          progressoEsperadoDia = 100;
          ritmoAtualDia = vendasHoje / hoursInDay;
          ritmoNecessarioDia = 0;
        } else if (mesFuturo) {
          // Mês futuro: dia ainda não começou
          horasRestantes = hoursInDay;
          progressoEsperadoDia = 0;
          ritmoAtualDia = 0;
          ritmoNecessarioDia = metaDiaria / hoursInDay;
        } else {
          // Mês atual: calcular normalmente
          horasRestantes = hoursInDay - currentHour;
          progressoEsperadoDia = (currentHour / hoursInDay) * 100;
          ritmoAtualDia = currentHour > 0 ? vendasHoje / currentHour : 0;
          const faltaHoje = metaDiaria - vendasHoje;
          ritmoNecessarioDia = horasRestantes > 0 ? faltaHoje / horasRestantes : 0;
        }

        const deficitDiario = vendasHoje - (metaDiaria * (progressoEsperadoDia / 100));

        // Marketing e Comercial
        const metaMarketingDia = metaDiaria * (percentualMarketing / 100);
        const metaComercialDia = metaDiaria * (percentualComercial / 100);
        const vendasMarketingDia = vendasHoje * (percentualMarketing / 100);
        const vendasComercialDia = vendasHoje * (percentualComercial / 100);

        // Ticket médio (vendas hoje / número de vendas hoje)
        const vendasCountHoje = salesByDay[now.toISOString().split('T')[0]]?.sales || 0;
        const ticketMedioDia = vendasCountHoje > 0 ? vendasHoje / vendasCountHoje : 0;

        return {
          meta: metaDiaria,
          atual: vendasHoje,
          progresso: progressoDiario,
          label: 'Meta Diária',
          tempoRestante: horasRestantes,
          tempoLabel: horasRestantes === 1 ? 'hora restante' : 'horas restantes',
          progressoEsperado: progressoEsperadoDia,
          deficit: deficitDiario,
          ritmoAtual: ritmoAtualDia,
          ritmoNecessario: ritmoNecessarioDia,
          ritmoLabel: '/hora',
          metaMarketing: metaMarketingDia,
          metaComercial: metaComercialDia,
          vendasMarketing: vendasMarketingDia,
          vendasComercial: vendasComercialDia,
          ticketMedio: ticketMedioDia
        };
      }

      case 'week': {
        // Meta e vendas semanais
        const metaSemanal = (valorMeta / daysInMonth) * 7;
        const vendasSemana = getThisWeekSales(salesByDay);
        const progressoSemanal = metaSemanal > 0 ? (vendasSemana / metaSemanal) * 100 : 0;

        // Dias da semana - ajustar baseado no mês selecionado
        let diasDecorridosSemana: number;
        let diasRestantesSemana: number;
        let progressoEsperadoSemana: number;

        if (mesPassado) {
          // Mês passado: semana completa
          diasDecorridosSemana = 7;
          diasRestantesSemana = 0;
          progressoEsperadoSemana = 100;
        } else if (mesFuturo) {
          // Mês futuro: semana ainda não começou
          diasDecorridosSemana = 0;
          diasRestantesSemana = 7;
          progressoEsperadoSemana = 0;
        } else {
          // Mês atual: calcular normalmente
          const dayOfWeek = now.getDay(); // 0 = Domingo
          diasDecorridosSemana = dayOfWeek + 1; // Domingo = 1
          diasRestantesSemana = 7 - diasDecorridosSemana;
          progressoEsperadoSemana = (diasDecorridosSemana / 7) * 100;
        }

        // Déficit/superávit semanal
        const deficitSemanal = vendasSemana - (metaSemanal * (progressoEsperadoSemana / 100));

        // Ritmo atual (vendas por dia esta semana)
        const ritmoAtualSemana = diasDecorridosSemana > 0 ? vendasSemana / diasDecorridosSemana : 0;

        // Ritmo necessário (quanto precisa vender por dia restante)
        const faltaSemana = metaSemanal - vendasSemana;
        const ritmoNecessarioSemana = diasRestantesSemana > 0 ? faltaSemana / diasRestantesSemana : 0;

        // Marketing e Comercial
        const metaMarketingSemana = metaSemanal * (percentualMarketing / 100);
        const metaComercialSemana = metaSemanal * (percentualComercial / 100);
        const vendasMarketingSemana = vendasSemana * (percentualMarketing / 100);
        const vendasComercialSemana = vendasSemana * (percentualComercial / 100);

        // Ticket médio da semana
        let vendasCountSemana = 0;
        const sunday = new Date(now);
        const dayOfWeek = now.getDay();
        sunday.setDate(now.getDate() - dayOfWeek);
        for (let i = 0; i <= dayOfWeek; i++) {
          const date = new Date(sunday);
          date.setDate(sunday.getDate() + i);
          const dateStr = date.toISOString().split('T')[0];
          vendasCountSemana += salesByDay[dateStr]?.sales || 0;
        }
        const ticketMedioSemana = vendasCountSemana > 0 ? vendasSemana / vendasCountSemana : 0;

        return {
          meta: metaSemanal,
          atual: vendasSemana,
          progresso: progressoSemanal,
          label: 'Meta Semanal',
          tempoRestante: diasRestantesSemana,
          tempoLabel: diasRestantesSemana === 1 ? 'dia restante' : 'dias restantes',
          progressoEsperado: progressoEsperadoSemana,
          deficit: deficitSemanal,
          ritmoAtual: ritmoAtualSemana,
          ritmoNecessario: ritmoNecessarioSemana,
          ritmoLabel: '/dia',
          metaMarketing: metaMarketingSemana,
          metaComercial: metaComercialSemana,
          vendasMarketing: vendasMarketingSemana,
          vendasComercial: vendasComercialSemana,
          ticketMedio: ticketMedioSemana
        };
      }

      default: { // 'month'
        // Cálculos mensais - usar variáveis do escopo externo que já consideram mês selecionado
        // diasNoMes, diasDecorridos, diasRestantes já foram calculados corretamente acima
        const progressoEsperadoMensal = (diasDecorridos / diasNoMes) * 100;
        const deficitMensal = valorAtual - (valorMeta * (progressoEsperadoMensal / 100));

        const ritmoAtualMensal = diasDecorridos > 0 ? valorAtual / diasDecorridos : 0;
        const ritmoNecessarioMensal = diasRestantes > 0 ? (valorMeta - valorAtual) / diasRestantes : 0;

        const metaMarketing = valorMeta * (percentualMarketing / 100);
        const metaComercial = valorMeta * (percentualComercial / 100);
        const vendasMarketing = valorAtual * (percentualMarketing / 100);
        const vendasComercial = valorAtual * (percentualComercial / 100);

        // Ticket médio do mês (vendas totais / número total de vendas)
        const vendasCountMes = Object.values(salesByDay).reduce((sum: number, day: any) => sum + (day?.sales || 0), 0);
        const ticketMedio = vendasCountMes > 0 ? valorAtual / vendasCountMes : 0;

        return {
          meta: valorMeta,
          atual: valorAtual,
          progresso: progressoReal,
          label: 'Meta Mensal',
          tempoRestante: diasRestantes,
          tempoLabel: diasRestantes === 1 ? 'dia restante' : 'dias restantes',
          progressoEsperado: progressoEsperadoMensal,
          deficit: deficitMensal,
          ritmoAtual: ritmoAtualMensal,
          ritmoNecessario: ritmoNecessarioMensal,
          ritmoLabel: '/dia',
          metaMarketing,
          metaComercial,
          vendasMarketing,
          vendasComercial,
          ticketMedio
        };
      }
    }
  };

  // Calcular valores de exibição (não usar useMemo para evitar erro #310)
  const displayValues = getDisplayValues();

  // Loading state
  if (loading || !dashboardData) {
    return (
      <DashboardLayout
        showFilters={false}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        viewMode={viewMode}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
        onViewModeChange={(mode) => {
          console.log('🔄 onViewModeChange called with:', mode);
          setViewMode(mode as 'month' | 'week' | 'day');
          console.log('✅ setViewMode called');
        }}
        onRefresh={handleRefresh}
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando dados...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      showFilters={true}
      selectedMonth={selectedMonth}
      selectedYear={selectedYear}
      viewMode={viewMode}
      onMonthChange={setSelectedMonth}
      onYearChange={setSelectedYear}
      onViewModeChange={(mode) => {
        console.log('🔄 onViewModeChange called with:', mode);
        setViewMode(mode as 'month' | 'week' | 'day');
        console.log('✅ setViewMode called');
      }}
      onRefresh={handleRefresh}
    >
      {showCelebration && <GoalCelebration show={showCelebration} />}

      <div className="space-y-6">
        {/* Goal Gauge */}
        <div className="flex justify-center mb-8">
          <GoalGauge
            percentage={displayValues.progresso}
            current={displayValues.atual}
            target={displayValues.meta}
            subGoals={subMetas.map((sm: any) => {
              const statusPremio = calcularStatusPremio(parseFloat(sm.valor), sm.atingida);
              return {
                id: sm.id,
                value: parseFloat(sm.valor) || 0,
                achieved: sm.atingida === 1,
                premio: sm.premio,
                status: statusPremio.status,
                icon: statusPremio.icon,
                color: statusPremio.color
              };
            })}
            selectedSubMetaId={selectedSubMeta}
            onSubMetaClick={(id) => {
              // Toggle: se clicar na mesma submeta, desseleciona
              setSelectedSubMeta(selectedSubMeta === id ? null : id);
            }}
            grandPrize={meta?.grande_premio ? {
              text: meta.grande_premio,
              status: statusGrandePremio().status,
              icon: statusGrandePremio().icon,
              color: statusGrandePremio().color
            } : undefined}
          />
        </div>

        {/* Cards de Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Marketing</CardTitle>
              <TrendingUp className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-teal-700 dark:text-teal-300">
                {displayValues.vendasMarketing.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Meta: {displayValues.metaMarketing.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}
              </p>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-teal-600 dark:from-teal-400 dark:to-teal-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, (displayValues.vendasMarketing / displayValues.metaMarketing) * 100)}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Comercial</CardTitle>
              <Users className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                {displayValues.vendasComercial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Meta: {displayValues.metaComercial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}
              </p>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-400 dark:to-amber-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, (displayValues.vendasComercial / displayValues.metaComercial) * 100)}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Médio</CardTitle>
              <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                {displayValues.ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Por venda</p>
            </CardContent>
          </Card>

          <Card className="border shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Meta Total</CardTitle>
              <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                {safeToFixed(displayValues.progresso, 1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Progresso atual</p>
            </CardContent>
          </Card>
        </div>

        {/* Cards de Progresso */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-l-4 border-l-teal-500 dark:border-l-teal-400 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Dias Restantes</CardTitle>
              <Calendar className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground">{displayValues.tempoRestante}</div>
              <p className="text-xs text-muted-foreground mt-1">{displayValues.tempoLabel}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 dark:border-l-blue-400 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Progresso Esperado</CardTitle>
              <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground">{safeToFixed(displayValues.progressoEsperado, 1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">baseado no período</p>
            </CardContent>
          </Card>

          <Card className={`border-l-4 ${displayValues.deficit > 0 ? 'border-l-green-500 dark:border-l-green-400' : 'border-l-red-500 dark:border-l-red-400'} shadow-lg`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {displayValues.deficit > 0 ? 'Superávit' : 'Déficit'}
              </CardTitle>
              <TrendingDown className={`h-5 w-5 ${displayValues.deficit > 0 ? 'text-green-600 dark:text-green-400 rotate-180' : 'text-red-600 dark:text-red-400'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-bold ${displayValues.deficit > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {Math.abs(displayValues.deficit).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {displayValues.deficit > 0 ? 'acima da meta esperada' : 'abaixo da meta esperada'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Ritmo de Vendas */}
        <Card className="mb-8 border shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Activity className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              Ritmo de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Ritmo Atual</p>
                <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">
                  {displayValues.ritmoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}{displayValues.ritmoLabel}
                </p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Ritmo Necessário</p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                  {displayValues.ritmoNecessario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}{displayValues.ritmoLabel}
                </p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Diferença</p>
                <p className={`text-2xl font-bold ${displayValues.ritmoAtual >= displayValues.ritmoNecessario ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {(displayValues.ritmoAtual - displayValues.ritmoNecessario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}{displayValues.ritmoLabel}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs de Detalhamento */}
        <Card className="mb-8 border shadow-lg">
          <CardContent className="pt-6">
            <Tabs defaultValue="marketing" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-muted">
                <TabsTrigger value="marketing" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white dark:data-[state=active]:bg-teal-500">
                  Marketing Direto
                </TabsTrigger>
                <TabsTrigger value="comercial" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white dark:data-[state=active]:bg-amber-500">
                  Time Comercial
                </TabsTrigger>
                <TabsTrigger value="operacoes" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:data-[state=active]:bg-blue-500">
                  Operações
                </TabsTrigger>
              </TabsList>

              <TabsContent value="marketing" className="mt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-teal-50 dark:bg-teal-950/30 rounded-lg border border-teal-200 dark:border-teal-800">
                    <span className="font-medium text-foreground">Vendas Esperadas</span>
                    <span className="text-lg font-bold text-teal-700 dark:text-teal-300">
                      {(metaMarketing * (progressoEsperado / 100)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-teal-100 dark:bg-teal-900/30 rounded-lg border border-teal-300 dark:border-teal-700">
                    <span className="font-medium text-foreground">Vendas Realizadas</span>
                    <span className="text-lg font-bold text-teal-700 dark:text-teal-300">
                      {vendasMarketing.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-card border-2 border-teal-500 dark:border-teal-400 rounded-lg">
                    <span className="font-medium text-foreground">Meta Total</span>
                    <span className="text-xl font-bold text-teal-700 dark:text-teal-300">
                      {metaMarketing.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="comercial" className="mt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                    <span className="font-medium text-foreground">Vendas Esperadas</span>
                    <span className="text-lg font-bold text-amber-700 dark:text-amber-300">
                      {(metaComercial * (progressoEsperado / 100)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-amber-100 dark:bg-amber-900/30 rounded-lg border border-amber-300 dark:border-amber-700">
                    <span className="font-medium text-foreground">Vendas Realizadas</span>
                    <span className="text-lg font-bold text-amber-700 dark:text-amber-300">
                      {vendasComercial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-card border-2 border-amber-500 dark:border-amber-400 rounded-lg">
                    <span className="font-medium text-foreground">Meta Total</span>
                    <span className="text-xl font-bold text-amber-700 dark:text-amber-300">
                      {metaComercial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="operacoes" className="mt-6">
                <div className="space-y-4">
                  <div className="p-6 bg-muted rounded-lg text-center">
                    <p className="text-muted-foreground">
                      Observações e notas operacionais serão exibidas aqui.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>


      </div>
    </DashboardLayout>
  );
}
