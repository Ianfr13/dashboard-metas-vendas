import { useState } from "react";
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
  const [selectedScenario, setSelectedScenario] = useState<"3M" | "4M" | "5M">("3M");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();

  const scenario = scenarios[selectedScenario];
  const avgTicket = 1000;

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
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/LOGO_-21.png"
                alt="DouraVita"
                className="h-10 w-auto transition-all filter drop-shadow-md"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
              />
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Dashboard de Metas
                </h1>
                <p className="text-sm text-muted-foreground">
                  Acompanhamento de Vendas - DouraVita
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

          {/* Seletor de Data */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : "Selecione a data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Goal Gauge */}
        <GoalGauge
          percentage={(850000 / scenario.total) * 100}
          current={850000}
          target={scenario.total}
          subGoals={[
            { value: 100000, achieved: true },
            { value: 250000, achieved: true },
            { value: 500000, achieved: true },
            { value: 1000000, achieved: false },
            { value: 1500000, achieved: false },
            { value: 2000000, achieved: false },
            { value: scenario.total, achieved: false },
          ]}
        />

        {/* Cards de Overview */}
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
                {formatCurrency(scenario.total)}
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
                {scenario.marketingSales}
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
                {scenario.commercialSales}
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
                    <p className="text-xl font-bold text-foreground">{scenario.marketingSales.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Receita Esperada</p>
                    <p className="text-xl font-bold text-foreground">
                      {formatCurrency(scenario.marketing)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Vendas</p>
                    <p className="text-xl font-bold text-green-500">0</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Receita</p>
                    <p className="text-xl font-bold text-green-500">
                      R$ 0
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
                    <p className="text-xl font-bold text-foreground">{scenario.commercialSales.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Receita Esperada</p>
                    <p className="text-xl font-bold text-foreground">
                      {formatCurrency(scenario.commercial)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Vendas</p>
                    <p className="text-xl font-bold text-green-500">0</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Receita</p>
                    <p className="text-xl font-bold text-green-500">
                      R$ 0
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
