import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun, TrendingUp, Users, DollarSign, Target, CalendarIcon, Home as HomeIcon, BarChart3, Settings } from "lucide-react";
import { Link, useLocation } from "wouter";
import MobileNav from "@/components/MobileNav";
import GoalGauge from "@/components/GoalGauge";
import GoalCelebration from "@/components/GoalCelebration";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Dados dos cenários
const scenarios = {
  "3M": {
    total: 3000000,
    marketing: 2550000,
    commercial: 450000,
    marketingSales: 2550,
    commercialSales: 23,
  },
  "4M": {
    total: 4000000,
    marketing: 3400000,
    commercial: 600000,
    marketingSales: 3400,
    commercialSales: 30,
  },
  "5M": {
    total: 5000000,
    marketing: 4250000,
    commercial: 750000,
    marketingSales: 4250,
    commercialSales: 38,
  },
};



export default function Home() {
  // Ler configurações da Admin
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem("dashboard-config");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Erro ao ler config:", e);
      }
    }
    return null;
  });

  const [selectedScenario, setSelectedScenario] = useState<"3M" | "4M" | "5M">("3M");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(2025, 0, 1), // 1 de janeiro
    to: new Date(2025, 0, 9), // 9 de janeiro
  });
  const [selectedPeriod, setSelectedPeriod] = useState<"day" | "week" | "month">("month");
  const [showCelebration, setShowCelebration] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();

  const scenario = scenarios[selectedScenario];
  const avgTicket = 1000;

  // Calcular valores baseados no período selecionado e intervalo de datas
  const getPeriodValues = () => {
    // Calcular número de dias no intervalo
    const daysDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const divisor = 30 / daysDiff; // Proporção do mês
    
    return {
      total: scenario.total / divisor,
      marketing: scenario.marketing / divisor,
      commercial: scenario.commercial / divisor,
      marketingSales: Math.round(scenario.marketingSales / divisor),
      commercialSales: Math.round(scenario.commercialSales / divisor),
      // Valores realizados (mockados - simular 110% para demonstrar meta batida)
      totalRealized: (scenario.total / divisor) * 1.1,
      marketingRealized: Math.round((scenario.marketingSales / divisor) * 1.1),
      commercialRealized: Math.round((scenario.commercialSales / divisor) * 1.1),
      revenueRealized: (scenario.marketing / divisor) * 1.1,
      daysDiff,
    };
  };

  const periodValues = getPeriodValues();
  const periodLabel = `${periodValues.daysDiff} ${periodValues.daysDiff === 1 ? 'dia' : 'dias'}`;
  const isGoalAchieved = periodValues.totalRealized >= periodValues.total;
  
  // Mostrar celebração quando meta for batida
  useEffect(() => {
    if (isGoalAchieved) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isGoalAchieved]);

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
      {/* Celebração de Meta Batida */}
      <GoalCelebration show={showCelebration} />
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm md:sticky md:top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/douravita-logo.png"
                alt="DouraVita"
                className="h-12 w-auto drop-shadow-md"
              />
              <div>
                <h1 className="text-xl font-semibold text-foreground tracking-tight">
                  Dashboard de Metas
                </h1>
                <p className="text-xs text-muted-foreground font-medium">
                  Janeiro 2025
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Menu Mobile */}
              <MobileNav />
              
              {/* Navegação Desktop */}
              <nav className="hidden md:flex items-center gap-2">
                <Link href="/">
                  <Button
                    variant={location === "/" ? "default" : "ghost"}
                    className="gap-2"
                  >
                    <HomeIcon className="h-4 w-4" />
                    Home
                  </Button>
                </Link>
                <Link href="/metricas">
                  <Button
                    variant={location === "/metricas" ? "default" : "ghost"}
                    className="gap-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Métricas
                  </Button>
                </Link>
                <Link href="/admin">
                  <Button
                    variant={location === "/admin" ? "default" : "ghost"}
                    className="gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Admin
                  </Button>
                </Link>
              </nav>

              {/* Toggle de Tema */}
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Filtros e Controles */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Seletor de Cenário (Dropdown) */}
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-primary" />
            <Select value={selectedScenario} onValueChange={(value) => setSelectedScenario(value as "3M" | "4M" | "5M")}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione o cenário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3M">R$ 3.000.000</SelectItem>
                <SelectItem value="4M">R$ 4.000.000</SelectItem>
                <SelectItem value="5M">R$ 5.000.000</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Seletor de Intervalo de Datas */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from && dateRange.to ? (
                  <>
                    {format(dateRange.from, "dd/MM", { locale: ptBR })} - {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                  </>
                ) : (
                  "Selecione o período"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                  }
                }}
                initialFocus
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Goal Gauge */}
        <GoalGauge
          percentage={(periodValues.totalRealized / periodValues.total) * 100}
          current={periodValues.totalRealized}
          target={periodValues.total}
          subGoals={(config?.subMetas || [
            { id: "1", valor: 100000, cor: "#10b981" },
            { id: "2", valor: 250000, cor: "#10b981" },
            { id: "3", valor: 500000, cor: "#10b981" },
            { id: "4", valor: 1000000, cor: "#3b82f6" },
            { id: "5", valor: 1500000, cor: "#3b82f6" },
            { id: "6", valor: 2000000, cor: "#3b82f6" },
            { id: "7", valor: 3000000, cor: "#3b82f6" },
          ]).map((sm: any) => ({ value: sm.valor, achieved: periodValues.totalRealized >= sm.valor })).slice(0, 6)
          }
        />

        {/* Seletor de Período */}
        <div className="flex justify-center">
          <Select value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as "day" | "week" | "month")}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Diário</SelectItem>
              <SelectItem value="week">Semanal</SelectItem>
              <SelectItem value="month">Mensal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Cards de Overview - Período Selecionado */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                TOTAL
              </CardTitle>
              <DollarSign className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {formatCurrency(periodValues.total)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Meta {periodLabel} completa
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
                {periodValues.marketingSales}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Vendas diretas esperadas
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
                {periodValues.commercialSales}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Vendas high-ticket esperadas
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
                {formatCurrency(avgTicket)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Valor médio por venda
              </p>
            </CardContent>
          </Card>
        </div>



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
                    <p className="text-xl font-bold text-foreground">{periodValues.marketingSales.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Receita Esperada</p>
                    <p className="text-xl font-bold text-foreground">
                      {formatCurrency(periodValues.marketing)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Vendas</p>
                    <p className="text-xl font-bold text-green-500">{periodValues.marketingRealized}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Receita</p>
                    <p className="text-xl font-bold text-green-500">
                      {formatCurrency(periodValues.revenueRealized)}
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
                    <p className="text-xl font-bold text-foreground">{periodValues.commercialSales.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Receita Esperada</p>
                    <p className="text-xl font-bold text-foreground">
                      {formatCurrency(periodValues.commercial)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Vendas</p>
                    <p className="text-xl font-bold text-green-500">{periodValues.commercialRealized}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Receita</p>
                    <p className="text-xl font-bold text-green-500">
                      {formatCurrency(periodValues.commercial * 0.283)}
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


      </main>
    </div>
  );
}
