import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun, TrendingUp, DollarSign, Target, Home as HomeIcon, BarChart3, Settings, Loader2, Users, Calendar, TrendingDown, Activity } from "lucide-react";
import { Link, useLocation } from "wouter";
import MobileNav from "@/components/MobileNav";
import GoalGauge from "@/components/GoalGauge";
import GoalCelebration from "@/components/GoalCelebration";
import { dashboardAPI } from "@/lib/edge-functions";
import { safeToFixed } from "@/lib/formatters";

export default function Home() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();

  // Buscar dados do dashboard via edge function
  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);
        const data = await dashboardAPI.getMetaPrincipal();
        setDashboardData(data);
        
        // Mostrar celebração se meta foi batida
        if (data.meta && data.metrics) {
          const progressoReal = data.metrics.progressoReal || 0;
          if (progressoReal >= 100) {
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 5000);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-amber-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <img src="/douravita-logo.png" alt="Douravita" className="w-48 h-auto mx-auto animate-pulse" />
          <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto" />
          <p className="text-teal-700 font-medium">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-amber-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-200 shadow-xl">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-red-700">Erro ao Carregar</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="w-full bg-teal-600 hover:bg-teal-700">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const meta = dashboardData?.meta || {};
  const metrics = dashboardData?.metrics || {};
  const subMetas = dashboardData?.subMetas || [];

  // Calcular valores
  const valorMeta = meta.valor_meta || 0;
  const valorAtual = meta.valor_atual || 0;
  const progressoReal = metrics.progressoReal || 0;
  const diasRestantes = metrics.diasRestantes || 0;
  const progressoEsperado = metrics.progressoEsperado || 0;
  const deficit = metrics.deficit || 0;

  // Distribuição 85% Marketing / 15% Comercial
  const metaMarketing = valorMeta * 0.85;
  const metaComercial = valorMeta * 0.15;
  const vendasMarketing = valorAtual * 0.85;
  const vendasComercial = valorAtual * 0.15;

  // Ticket médio
  const ticketMedio = valorAtual > 0 ? valorAtual / Math.max(1, Math.floor(valorAtual / 800)) : 0;

  // Ritmo de vendas
  const diasDecorridos = 30 - diasRestantes;
  const ritmoAtual = diasDecorridos > 0 ? valorAtual / diasDecorridos : 0;
  const ritmoNecessario = diasRestantes > 0 ? (valorMeta - valorAtual) / diasRestantes : 0;

  return (
    <div className="min-h-screen bg-background">
      {showCelebration && <GoalCelebration onClose={() => setShowCelebration(false)} />}
      
      {/* Header com Logo */}
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/douravita-logo.png"
              alt="DouraVita"
              className="h-10 w-auto transition-all filter drop-shadow-md"
            />
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Dashboard de Metas</h1>
              <p className="text-xs font-medium text-muted-foreground">
                {meta?.mes ? `${meta.mes}/${meta.ano}` : 'Janeiro 2025'}
              </p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant={location === "/dashboard" ? "default" : "ghost"} size="sm">
                <HomeIcon className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
            <Link href="/metricas">
              <Button variant={location === "/metricas" ? "default" : "ghost"} size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Métricas
              </Button>
            </Link>
            <Link href="/ranking">
              <Button variant={location === "/ranking" ? "default" : "ghost"} size="sm">
                <TrendingUp className="h-4 w-4 mr-2" />
                Ranking
              </Button>
            </Link>
            <Link href="/admin">
              <Button variant={location === "/admin" ? "default" : "ghost"} size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 pb-24">
        {/* Meta Principal com Gauge */}
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
          <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-teal-50 to-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Marketing</CardTitle>
              <TrendingUp className="h-5 w-5 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-teal-700">
                {vendasMarketing.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Meta: {metaMarketing.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}
              </p>
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-teal-500 to-teal-600 transition-all duration-500"
                  style={{ width: `${Math.min(100, (vendasMarketing / metaMarketing) * 100)}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-amber-50 to-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Comercial</CardTitle>
              <Users className="h-5 w-5 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-700">
                {vendasComercial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Meta: {metaComercial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}
              </p>
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-500"
                  style={{ width: `${Math.min(100, (vendasComercial / metaComercial) * 100)}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Ticket Médio</CardTitle>
              <DollarSign className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700">
                {ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-gray-500 mt-1">Por venda</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Meta Total</CardTitle>
              <Target className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-700">
                {safeToFixed(progressoReal, 1)}%
              </div>
              <p className="text-xs text-gray-500 mt-1">Progresso atual</p>
            </CardContent>
          </Card>
        </div>

        {/* Cards de Progresso */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-l-4 border-l-teal-500 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Dias Restantes</CardTitle>
              <Calendar className="h-5 w-5 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-gray-900">{diasRestantes}</div>
              <p className="text-xs text-gray-500 mt-1">dias até o fim do mês</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Progresso Esperado</CardTitle>
              <Activity className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-gray-900">{safeToFixed(progressoEsperado, 1)}%</div>
              <p className="text-xs text-gray-500 mt-1">baseado no dia atual</p>
            </CardContent>
          </Card>

          <Card className={`border-l-4 ${deficit < 0 ? 'border-l-green-500' : 'border-l-red-500'} shadow-lg`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {deficit < 0 ? 'Superávit' : 'Déficit'}
              </CardTitle>
              <TrendingDown className={`h-5 w-5 ${deficit < 0 ? 'text-green-600 rotate-180' : 'text-red-600'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-bold ${deficit < 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(deficit).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {deficit < 0 ? 'acima da meta esperada' : 'abaixo da meta esperada'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Ritmo de Vendas */}
        <Card className="mb-8 border-none shadow-lg bg-gradient-to-r from-teal-50 to-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-teal-700">
              <Activity className="h-5 w-5" />
              Ritmo de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-white rounded-lg shadow">
                <p className="text-sm text-gray-600 mb-2">Ritmo Atual</p>
                <p className="text-2xl font-bold text-teal-700">
                  {ritmoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}/dia
                </p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow">
                <p className="text-sm text-gray-600 mb-2">Ritmo Necessário</p>
                <p className="text-2xl font-bold text-amber-700">
                  {ritmoNecessario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}/dia
                </p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow">
                <p className="text-sm text-gray-600 mb-2">Diferença</p>
                <p className={`text-2xl font-bold ${ritmoAtual >= ritmoNecessario ? 'text-green-600' : 'text-red-600'}`}>
                  {(ritmoAtual - ritmoNecessario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}/dia
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs de Detalhamento */}
        <Card className="mb-8 border-none shadow-lg">
          <CardContent className="pt-6">
            <Tabs defaultValue="marketing" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-teal-50">
                <TabsTrigger value="marketing" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white">
                  Marketing Direto
                </TabsTrigger>
                <TabsTrigger value="comercial" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                  Time Comercial
                </TabsTrigger>
                <TabsTrigger value="operacoes" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  Operações
                </TabsTrigger>
              </TabsList>

              <TabsContent value="marketing" className="mt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-teal-50 rounded-lg">
                    <span className="font-medium text-gray-700">Vendas Esperadas</span>
                    <span className="text-lg font-bold text-teal-700">
                      {(metaMarketing * (progressoEsperado / 100)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-teal-100 rounded-lg">
                    <span className="font-medium text-gray-700">Vendas Realizadas</span>
                    <span className="text-lg font-bold text-teal-700">
                      {vendasMarketing.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white border-2 border-teal-200 rounded-lg">
                    <span className="font-medium text-gray-700">Meta Total</span>
                    <span className="text-xl font-bold text-teal-700">
                      {metaMarketing.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="comercial" className="mt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-amber-50 rounded-lg">
                    <span className="font-medium text-gray-700">Vendas Esperadas</span>
                    <span className="text-lg font-bold text-amber-700">
                      {(metaComercial * (progressoEsperado / 100)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-amber-100 rounded-lg">
                    <span className="font-medium text-gray-700">Vendas Realizadas</span>
                    <span className="text-lg font-bold text-amber-700">
                      {vendasComercial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white border-2 border-amber-200 rounded-lg">
                    <span className="font-medium text-gray-700">Meta Total</span>
                    <span className="text-xl font-bold text-amber-700">
                      {metaComercial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="operacoes" className="mt-6">
                <div className="p-6 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-4">Observações Operacionais</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Acompanhamento diário do progresso das metas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Análise de performance por canal (Marketing vs Comercial)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Monitoramento do ritmo de vendas necessário</span>
                    </li>
                  </ul>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Sub-Metas */}
        {subMetas.length > 0 && (
          <Card className="border-none shadow-lg">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-amber-50">
              <CardTitle className="flex items-center gap-2 text-teal-700">
                <Target className="h-5 w-5" />
                Sub-Metas do Mês
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {subMetas.map((subMeta: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        subMeta.status === 'concluida' ? 'bg-green-500' :
                        subMeta.status === 'em_andamento' ? 'bg-amber-500' :
                        'bg-gray-300'
                      }`}></div>
                      <span className="font-medium text-gray-800">{subMeta.titulo}</span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {subMeta.valor_meta?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <MobileNav />
    </div>
  );
}
