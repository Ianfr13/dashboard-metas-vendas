import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun, TrendingUp, DollarSign, Target, Home as HomeIcon, BarChart3, Settings, Loader2, Users } from "lucide-react";
import { Link, useLocation } from "wouter";
import MobileNav from "@/components/MobileNav";
import GoalGauge from "@/components/GoalGauge";
import GoalCelebration from "@/components/GoalCelebration";
import { dashboardAPI } from "@/lib/edge-functions";

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-500">Erro ao carregar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { meta, subMetas, metrics, totals, salesByDay } = dashboardData || {};
  
  // Valores com fallback para 0
  const valorMeta = metrics?.valorMeta || meta?.valor_meta || 0;
  const valorAtual = metrics?.valorAtual || totals?.revenue || 0;
  const progressoReal = metrics?.progressoReal || 0;
  const progressoEsperado = metrics?.progressoEsperado || 0;
  const diasRestantes = metrics?.dias?.restantes || 0;
  const diasDecorridos = metrics?.dias?.decorridos || 0;
  const diasTotais = metrics?.dias?.total || 30;
  const deficit = metrics?.deficit || { valor: 0, percentual: 0 };
  const ritmo = metrics?.ritmo || { atual: 0, necessario: 0, diferenca: 0 };
  
  // Calcular vendas totais
  const vendasTotais = totals?.sales || 0;
  
  // Calcular ticket médio
  const ticketMedio = vendasTotais > 0 ? valorAtual / vendasTotais : 1000;
  
  // Calcular distribuição Marketing/Comercial (85% marketing, 15% comercial)
  const percentualMarketing = 0.85;
  const percentualComercial = 0.15;
  
  const metaMarketing = valorMeta * percentualMarketing;
  const metaComercial = valorMeta * percentualComercial;
  
  const receitaMarketing = valorAtual * percentualMarketing;
  const receitaComercial = valorAtual * percentualComercial;
  
  const vendasMarketing = Math.floor(vendasTotais * percentualMarketing);
  const vendasComercial = Math.floor(vendasTotais * percentualComercial);
  
  // Vendas esperadas baseadas no progresso esperado
  const vendasEsperadasMarketing = Math.floor((metaMarketing / ticketMedio) * (progressoEsperado / 100));
  const vendasEsperadasComercial = Math.floor((metaComercial / 20000) * (progressoEsperado / 100)); // ticket médio comercial ~20k
  
  const receitaEsperadaMarketing = metaMarketing * (progressoEsperado / 100);
  const receitaEsperadaComercial = metaComercial * (progressoEsperado / 100);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-background">
      {showCelebration && <GoalCelebration show={showCelebration} />}
      
      {/* Header */}
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
            <Link href="/">
              <Button variant={location === "/" ? "default" : "ghost"} size="sm">
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

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8 space-y-8">
        {/* Goal Gauge */}
        <div className="flex justify-center">
          <GoalGauge 
            percentage={progressoReal}
            current={valorAtual} 
            target={valorMeta}
            subGoals={subMetas?.map((sm: any) => ({
              value: sm.valor_meta || sm.valor,
              achieved: sm.atingida === 1 || valorAtual >= (sm.valor_meta || sm.valor)
            })) || []}
          />
        </div>

        {/* Cards de Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                META TOTAL
              </CardTitle>
              <DollarSign className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {formatCurrency(valorMeta)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Meta mensal completa
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                MARKETING
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {vendasMarketing}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Vendas diretas realizadas
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                COMERCIAL
              </CardTitle>
              <Users className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {vendasComercial}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Vendas high-ticket realizadas
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                TICKET MÉDIO
              </CardTitle>
              <Target className="h-5 w-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {formatCurrency(ticketMedio)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Valor médio por venda
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Métricas de Progresso */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Dias Restantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{diasRestantes}</div>
              <p className="text-xs text-muted-foreground mt-1">
                de {diasTotais} dias ({diasDecorridos} decorridos)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Progresso Esperado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{progressoEsperado.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {progressoReal >= progressoEsperado ? (
                  <span className="text-green-500">✓ Acima do esperado</span>
                ) : (
                  <span className="text-orange-500">⚠ Abaixo do esperado</span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {deficit.valor >= 0 ? 'Déficit' : 'Superávit'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${deficit.valor >= 0 ? 'text-orange-500' : 'text-green-500'}`}>
                {formatCurrency(Math.abs(deficit.valor))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.abs(deficit.percentual).toFixed(1)}% {deficit.valor >= 0 ? 'abaixo' : 'acima'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Ritmo de Vendas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Ritmo de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Ritmo Atual</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(ritmo.atual)}/dia
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Ritmo Necessário</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(ritmo.necessario)}/dia
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Diferença</p>
                <p className={`text-2xl font-bold ${ritmo.diferenca >= 0 ? 'text-orange-500' : 'text-green-500'}`}>
                  {formatCurrency(Math.abs(ritmo.diferenca))}/dia
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs de Detalhamento */}
        <Tabs defaultValue="marketing" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="marketing">Marketing Direto</TabsTrigger>
            <TabsTrigger value="comercial">Time Comercial</TabsTrigger>
            <TabsTrigger value="operacoes">Operações</TabsTrigger>
          </TabsList>

          <TabsContent value="marketing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Marketing Direto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Vendas Esperadas</p>
                    <p className="text-xl font-bold text-foreground">{vendasEsperadasMarketing.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Receita Esperada</p>
                    <p className="text-xl font-bold text-foreground">
                      {formatCurrency(receitaEsperadaMarketing)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Vendas Realizadas</p>
                    <p className="text-xl font-bold text-green-500">{vendasMarketing}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Receita Realizada</p>
                    <p className="text-xl font-bold text-green-500">
                      {formatCurrency(receitaMarketing)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comercial" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Time Comercial</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Vendas Esperadas</p>
                    <p className="text-xl font-bold text-foreground">{vendasEsperadasComercial.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Receita Esperada</p>
                    <p className="text-xl font-bold text-foreground">
                      {formatCurrency(receitaEsperadaComercial)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Vendas Realizadas</p>
                    <p className="text-xl font-bold text-green-500">{vendasComercial}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Receita Realizada</p>
                    <p className="text-xl font-bold text-green-500">
                      {formatCurrency(receitaComercial)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="operacoes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Observações Operacionais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>• Primeiros dias focados em validação da VSL</p>
                  <p>• Escala forte a partir da segunda semana</p>
                  <p>• Time comercial ganha tração progressivamente</p>
                  <p>• Funil completo com upsells implementado até dia 05</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Sub-Metas */}
        {subMetas && subMetas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Sub-Metas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {subMetas.map((subMeta: any) => {
                  const valorSubMeta = subMeta.valor_meta || subMeta.valor;
                  const atingida = subMeta.atingida === 1 || valorAtual >= valorSubMeta;
                  return (
                    <div 
                      key={subMeta.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        atingida ? 'bg-green-500/10 border-green-500' : 'bg-muted'
                      }`}
                    >
                      <div>
                        <p className="font-medium">{subMeta.nome || `Meta ${formatCurrency(valorSubMeta)}`}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(valorSubMeta)}
                        </p>
                      </div>
                      <div className="text-right">
                        {atingida ? (
                          <span className="text-green-500 font-bold">✓ Atingida</span>
                        ) : (
                          <span className="text-muted-foreground">
                            Faltam {formatCurrency(valorSubMeta - valorAtual)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <MobileNav />
    </div>
  );
}
