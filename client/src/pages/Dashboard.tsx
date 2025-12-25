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
  
  const valorMeta = meta?.valor_meta || 0;
  const valorAtual = meta?.valor_atual || 0;
  const progressoReal = valorMeta > 0 ? (valorAtual / valorMeta) * 100 : 0;

  const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
  const diaAtual = hoje.getDate();
  const diasDecorridos = diaAtual;
  const diasRestantes = diasNoMes - diaAtual;
  const progressoEsperado = (diasDecorridos / diasNoMes) * 100;
  const deficit = (valorAtual - (valorMeta * (progressoEsperado / 100)));

  const metaMarketing = valorMeta * 0.85;
  const metaComercial = valorMeta * 0.15;
  const vendasMarketing = valorAtual * 0.85;
  const vendasComercial = valorAtual * 0.15;
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

  return (
    <DashboardLayout
      showFilters={true}
      selectedMonth={selectedMonth}
      selectedYear={selectedYear}
      viewMode={viewMode}
      onMonthChange={setSelectedMonth}
      onYearChange={setSelectedYear}
      onViewModeChange={(mode) => setViewMode(mode as 'month' | 'week' | 'day')}
      onRefresh={handleRefresh}
    >
      {showCelebration && <GoalCelebration show={showCelebration} />}
      
      <div className="space-y-6">
        {/* Goal Gauge */}
        <div className="flex justify-center mb-8">
          <GoalGauge 
            percentage={progressoReal}
            current={valorAtual}
            target={valorMeta}
            subGoals={subMetas.map((sm: any) => {
              const statusPremio = calcularStatusPremio(parseFloat(sm.valor), sm.atingida);
              return {
                value: parseFloat(sm.valor) || 0,
                achieved: sm.atingida === 1,
                premio: sm.premio,
                status: statusPremio.status,
                icon: statusPremio.icon,
                color: statusPremio.color
              };
            })}
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
                {vendasMarketing.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Meta: {metaMarketing.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}
              </p>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-teal-500 to-teal-600 dark:from-teal-400 dark:to-teal-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, (vendasMarketing / metaMarketing) * 100)}%` }}
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
                {vendasComercial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Meta: {metaComercial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}
              </p>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-400 dark:to-amber-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, (vendasComercial / metaComercial) * 100)}%` }}
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
                {ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}
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
                {safeToFixed(progressoReal, 1)}%
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
              <div className="text-4xl font-bold text-foreground">{diasRestantes}</div>
              <p className="text-xs text-muted-foreground mt-1">dias até o fim do mês</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 dark:border-l-blue-400 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Progresso Esperado</CardTitle>
              <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground">{safeToFixed(progressoEsperado, 1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">baseado no dia atual</p>
            </CardContent>
          </Card>

          <Card className={`border-l-4 ${deficit < 0 ? 'border-l-green-500 dark:border-l-green-400' : 'border-l-red-500 dark:border-l-red-400'} shadow-lg`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {deficit < 0 ? 'Superávit' : 'Déficit'}
              </CardTitle>
              <TrendingDown className={`h-5 w-5 ${deficit < 0 ? 'text-green-600 dark:text-green-400 rotate-180' : 'text-red-600 dark:text-red-400'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-bold ${deficit < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {Math.abs(deficit).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {deficit < 0 ? 'acima da meta esperada' : 'abaixo da meta esperada'}
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
                  {ritmoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}/dia
                </p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Ritmo Necessário</p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                  {ritmoNecessario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}/dia
                </p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Diferença</p>
                <p className={`text-2xl font-bold ${ritmoAtual >= ritmoNecessario ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {(ritmoAtual - ritmoNecessario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}/dia
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
