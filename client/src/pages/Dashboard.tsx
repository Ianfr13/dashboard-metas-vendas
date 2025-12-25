import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  Calendar,
  Activity,
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await dashboardAPI.getMetaPrincipal();
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

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

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

  const hoje = new Date();
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

  return (
    <DashboardLayout>
      {showCelebration && <GoalCelebration show={showCelebration} />}
      
      <div className="space-y-6">
        {/* Goal Gauge */}
        <div className="flex justify-center mb-8">
          <GoalGauge 
            percentage={progressoReal}
            current={valorAtual}
            target={valorMeta}
            subGoals={subMetas.map((sm: any) => ({ value: sm.valor_meta || 0, achieved: sm.status === 'concluida' }))}
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

        {/* Sub-Metas */}
        {subMetas.length > 0 && (
          <Card className="mb-8 border shadow-lg">
            <CardHeader>
              <CardTitle className="text-foreground">Sub-Metas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {subMetas.map((subMeta: any) => (
                  <div
                    key={subMeta.id}
                    className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        subMeta.status === 'concluida' ? 'bg-green-500' : 
                        subMeta.status === 'em_andamento' ? 'bg-yellow-500' : 
                        'bg-gray-400'
                      }`}></div>
                      <span className="font-medium text-foreground">{subMeta.nome}</span>
                    </div>
                    <span className="text-sm font-semibold text-muted-foreground">
                      {(subMeta.valor_meta || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
