import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun, TrendingUp, Users, DollarSign, Target } from "lucide-react";
import { MetricsSimulator } from "@/components/MetricsSimulator";
import { GoalGauge } from "@/components/GoalGauge";

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

const weeks = [
  { id: 1, label: "Semana 1", period: "01-07 Jan", days: 7 },
  { id: 2, label: "Semana 2", period: "08-14 Jan", days: 7 },
  { id: 3, label: "Semana 3", period: "15-21 Jan", days: 7 },
  { id: 4, label: "Semana 4", period: "22-31 Jan", days: 10 },
];

export default function Home() {
  const [selectedScenario, setSelectedScenario] = useState<"3M" | "4M" | "5M">("3M");
  const [selectedWeek, setSelectedWeek] = useState(1);
  const { theme, toggleTheme } = useTheme();

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
                className="h-10 w-auto transition-all dark:brightness-110 dark:contrast-110"
              />
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Dashboard de Metas
                </h1>
                <p className="text-sm text-muted-foreground">
                  Janeiro 2025 - Suplementos de Longevidade Ativa
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
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
        {/* Goal Gauge */}
        <GoalGauge
          current={850000}
          target={scenario.total}
          completedGoals={[
            "Validar VSL principal (R$ 100k)",
            "Primeiras 50 vendas orgânicas",
            "Configurar time comercial",
          ]}
          upcomingGoals={[
            "Atingir R$ 1M em vendas diretas",
            "Escalar para R$ 50k/dia",
            "Fechar 10 vendas high-ticket",
            "Atingir meta mensal de R$ 3M",
          ]}
        />

        {/* Seletor de Cenários */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Selecione o Cenário de Faturamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(scenarios).map(([key, data]) => (
                <button
                  key={key}
                  onClick={() => setSelectedScenario(key as "3M" | "4M" | "5M")}
                  className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                    selectedScenario === key
                      ? "border-primary bg-primary/10 shadow-lg scale-105"
                      : "border-border hover:border-primary/50 hover:bg-accent/50"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-3xl font-bold text-foreground">
                        {formatCurrency(data.total)}
                      </h3>
                      {selectedScenario === key && (
                        <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">Meta Total</p>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground">Marketing</p>
                        <p className="text-sm font-semibold text-foreground">85%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Comercial</p>
                        <p className="text-sm font-semibold text-foreground">15%</p>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cards de Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                TOTAL
              </CardTitle>
              <DollarSign className="w-5 h-5 text-primary" />
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

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                MARKETING
              </CardTitle>
              <TrendingUp className="w-5 h-5 text-green-500" />
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
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                COMERCIAL
              </CardTitle>
              <Users className="w-5 h-5 text-purple-500" />
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
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                TICKET MÉDIO
              </CardTitle>
              <Target className="w-5 h-5 text-yellow-500" />
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

        {/* Seletor de Semanas */}
        <Card>
          <CardHeader>
            <CardTitle>Metas Semanais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {weeks.map((week) => (
                <button
                  key={week.id}
                  onClick={() => setSelectedWeek(week.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedWeek === week.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="text-center space-y-1">
                    <p className="font-semibold text-foreground">{week.label}</p>
                    <p className="text-sm text-muted-foreground">{week.period}</p>
                    <p className="text-xs text-muted-foreground">{week.days} dias</p>
                  </div>
                </button>
              ))}
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
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-accent/50">
                      <p className="text-sm text-muted-foreground">Vendas Esperadas</p>
                      <p className="text-2xl font-bold text-foreground">{scenario.marketingSales}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-accent/50">
                      <p className="text-sm text-muted-foreground">Receita Esperada</p>
                      <p className="text-2xl font-bold text-foreground">
                        {formatCurrency(scenario.marketing)}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-accent/50">
                      <p className="text-sm text-muted-foreground">Conversão VSL</p>
                      <p className="text-2xl font-bold text-foreground">1.5%</p>
                    </div>
                    <div className="p-4 rounded-lg bg-accent/50">
                      <p className="text-sm text-muted-foreground">CPA Alvo</p>
                      <p className="text-2xl font-bold text-foreground">R$ 450</p>
                    </div>
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-accent/50">
                    <p className="text-sm text-muted-foreground">SDRs</p>
                    <p className="text-2xl font-bold text-foreground">2</p>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/50">
                    <p className="text-sm text-muted-foreground">Closers</p>
                    <p className="text-2xl font-bold text-foreground">2</p>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/50">
                    <p className="text-sm text-muted-foreground">Agendamentos/Dia</p>
                    <p className="text-2xl font-bold text-foreground">4</p>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/50">
                    <p className="text-sm text-muted-foreground">Taxa Conversão</p>
                    <p className="text-2xl font-bold text-foreground">20%</p>
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
                  <p>• Primeiros dias serão de validação e ajuste das campanhas</p>
                  <p>• Escala forte planejada a partir da segunda semana (dia 8)</p>
                  <p>• Time comercial em fase inicial, tração esperada após dia 15</p>
                  <p>• Capacidade de geração de criativos: 2 editores + 3 copys</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Simulador de Métricas */}
        <MetricsSimulator scenario={selectedScenario} />
      </main>
    </div>
  );
}
