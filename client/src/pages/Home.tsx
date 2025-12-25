import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun, TrendingUp, DollarSign, Target, Home as HomeIcon, BarChart3, Settings, Loader2 } from "lucide-react";
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
      <div className="min-h-screen bg-background">
        <nav className="border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Dashboard de Metas</h1>
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </nav>
        
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Carregando dashboard...</p>
          </div>
        </div>
        
        <MobileNav />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Dashboard de Metas</h1>
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </nav>
        
        <div className="container mx-auto px-4 py-8">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Erro ao carregar dados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <MobileNav />
      </div>
    );
  }

  const { meta, subMetas, metrics, sales } = dashboardData || {};
  
  const valorMeta = metrics?.valorMeta || meta?.valor_meta || 0;
  const valorAtual = metrics?.valorAtual || 0;
  const progressoReal = metrics?.progressoReal || 0;
  const progressoEsperado = metrics?.progressoEsperado || 0;
  const diasRestantes = metrics?.dias?.restantes || 0;
  const diasDecorridos = metrics?.dias?.decorridos || 0;
  const diasTotais = metrics?.dias?.total || 30;
  const deficit = metrics?.deficit || { valor: 0, percentual: 0 };
  const ritmo = metrics?.ritmo || { atual: 0, necessario: 0, diferenca: 0 };

  return (
    <div className="min-h-screen bg-background">
      {showCelebration && <GoalCelebration />}
      
      {/* Header */}
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard de Metas</h1>
          
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
      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        {/* Meta Principal */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Meta do Mês - {meta?.mes}/{meta?.ano}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <GoalGauge 
                  current={valorAtual} 
                  goal={valorMeta}
                  size={280}
                />
                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    R$ {valorAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de R$ {valorMeta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-2xl font-bold mt-2">
                    {progressoReal.toFixed(1)}% concluído
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
                  <span className="text-green-500">Acima do esperado</span>
                ) : (
                  <span className="text-orange-500">Abaixo do esperado</span>
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
                R$ {Math.abs(deficit.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.abs(deficit.percentual).toFixed(1)}% {deficit.valor >= 0 ? 'abaixo' : 'acima'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Ritmo */}
        <Card className="mb-8">
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
                  R$ {ritmo.atual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/dia
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Ritmo Necessário</p>
                <p className="text-2xl font-bold">
                  R$ {ritmo.necessario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/dia
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Diferença</p>
                <p className={`text-2xl font-bold ${ritmo.diferenca >= 0 ? 'text-orange-500' : 'text-green-500'}`}>
                  R$ {Math.abs(ritmo.diferenca).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/dia
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

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
                  const atingida = subMeta.atingida === 1 || valorAtual >= subMeta.valor_meta;
                  return (
                    <div 
                      key={subMeta.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        atingida ? 'bg-green-500/10 border-green-500' : 'bg-muted'
                      }`}
                    >
                      <div>
                        <p className="font-medium">{subMeta.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          R$ {subMeta.valor_meta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="text-right">
                        {atingida ? (
                          <span className="text-green-500 font-bold">✓ Atingida</span>
                        ) : (
                          <span className="text-muted-foreground">
                            Faltam R$ {(subMeta.valor_meta - valorAtual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
