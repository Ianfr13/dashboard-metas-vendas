import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, BarChart3, Home as HomeIcon, Settings, Moon, Sun, Download } from "lucide-react";
import { Link, useLocation } from "wouter";
import MobileNav from "@/components/MobileNav";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTheme } from "@/contexts/ThemeContext";

// Componentes de métricas
import EvolutionChart from "@/components/metrics/EvolutionChart";
import ConversionFunnel from "@/components/metrics/ConversionFunnel";
import ProductsTable from "@/components/metrics/ProductsTable";
import ChannelsComparison from "@/components/metrics/ChannelsComparison";
import RealtimeMetrics from "@/components/metrics/RealtimeMetrics";
import HealthScore from "@/components/metrics/HealthScore";

export default function Metricas() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();

  // Mock data - Evolução temporal (últimos 30 dias)
  const evolutionData = Array.from({ length: 30 }, (_, i) => ({
    date: `${i + 1}/01`,
    vendas: Math.floor(20 + Math.random() * 15 + i * 0.5),
    receita: Math.floor((20000 + Math.random() * 15000 + i * 500)),
    leads: Math.floor(100 + Math.random() * 80 + i * 2),
  }));

  // Mock data - Funil de conversão
  const funnelData = [
    { name: "Views VSL", value: 12500, percentage: 100, conversionFromPrevious: undefined },
    { name: "Leads Gerados", value: 4368, percentage: 34.9, conversionFromPrevious: 34.9 },
    { name: "Checkout Iniciado", value: 1200, percentage: 9.6, conversionFromPrevious: 27.5 },
    { name: "Vendas Concluídas", value: 850, percentage: 6.8, conversionFromPrevious: 70.8 },
  ];

  // Mock data - Produtos
  const productsData = [
    { 
      name: "Creatina Pro 797", 
      sales: 450, 
      revenue: 358650, 
      percentage: 42.2, 
      avgTicket: 797,
      growth: 15.3
    },
    { 
      name: "High-Ticket VIP", 
      sales: 150, 
      revenue: 375000, 
      percentage: 44.1, 
      avgTicket: 2500,
      growth: 22.7
    },
    { 
      name: "Upsell Premium", 
      sales: 200, 
      revenue: 49400, 
      percentage: 5.8, 
      avgTicket: 247,
      growth: 8.4
    },
    { 
      name: "Outros Produtos", 
      sales: 50, 
      revenue: 66950, 
      percentage: 7.9, 
      avgTicket: 1339,
      growth: -3.2
    },
  ];

  // Mock data - Canais
  const channelsData = {
    marketing: {
      sales: 650,
      revenue: 650000,
      leads: 4000,
      conversionRate: 16.25,
      cpa: 430,
      roi: 90.8,
      roas: 1.91,
    },
    comercial: {
      sales: 200,
      revenue: 200000,
      meetings: 120,
      conversionRate: 20,
      avgTicket: 1000,
      roi: 150.5,
    },
  };

  // Mock data - Tempo real
  const realtimeData = {
    last24h: {
      sales: 32,
      revenue: 32000,
      leads: 156,
    },
    today: {
      sales: 18,
      revenue: 18000,
      leads: 89,
    },
    yesterday: {
      sales: 25,
      revenue: 25000,
      leads: 120,
    },
    dailyGoal: {
      sales: 28,
      revenue: 28333,
    },
    recentSales: [
      { time: "Há 5 minutos", product: "Creatina Pro 797", value: 797 },
      { time: "Há 12 minutos", product: "High-Ticket VIP", value: 2500 },
      { time: "Há 18 minutos", product: "Upsell Premium", value: 247 },
      { time: "Há 25 minutos", product: "Creatina Pro 797", value: 797 },
      { time: "Há 31 minutos", product: "Creatina Pro 797", value: 797 },
      { time: "Há 45 minutos", product: "High-Ticket VIP", value: 2500 },
      { time: "Há 52 minutos", product: "Upsell Premium", value: 247 },
      { time: "Há 1 hora", product: "Creatina Pro 797", value: 797 },
    ],
  };

  // Mock data - Score de saúde
  const healthMetrics = [
    { name: "Taxa de Conversão", value: 19.5, target: 20, weight: 0.25, status: 'good' as const },
    { name: "ROI", value: 90.8, target: 100, weight: 0.20, status: 'good' as const },
    { name: "ROAS", value: 1.91, target: 2.0, weight: 0.15, status: 'warning' as const },
    { name: "CPA", value: 430, target: 400, weight: 0.15, status: 'warning' as const },
    { name: "Ticket Médio", value: 1000, target: 1000, weight: 0.15, status: 'excellent' as const },
    { name: "Volume de Vendas", value: 850, target: 1000, weight: 0.10, status: 'good' as const },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card md:sticky md:top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/douravita-logo.png"
                alt="DouraVita"
                className="h-12 w-auto drop-shadow-md"
              />
              <div>
                <h1 className="text-xl font-semibold text-foreground tracking-tight">Dashboard de Metas</h1>
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
                  <Button variant={location === "/" ? "default" : "ghost"} className="gap-2">
                    <HomeIcon className="h-4 w-4" />
                    Home
                  </Button>
                </Link>
                <Link href="/metricas">
                  <Button variant={location === "/metricas" ? "default" : "ghost"} className="gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Métricas
                  </Button>
                </Link>
                <Link href="/admin">
                  <Button variant={location === "/admin" ? "default" : "ghost"} className="gap-2">
                    <Settings className="h-4 w-4" />
                    Admin
                  </Button>
                </Link>
              </nav>

              {/* Toggle Tema */}
              <Button variant="outline" size="icon" onClick={toggleTheme} className="rounded-full">
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

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Análise de Performance</h2>
            <p className="text-sm text-muted-foreground">Acompanhe suas métricas em tempo real</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Filtro de Período */}
            <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diário</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
              </SelectContent>
            </Select>

            {/* Calendário */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
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

            {/* Botão Exportar */}
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar PDF</span>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="geral" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="geral">Visão Geral</TabsTrigger>
            <TabsTrigger value="funil">Funil</TabsTrigger>
            <TabsTrigger value="produtos">Produtos</TabsTrigger>
            <TabsTrigger value="canais">Canais</TabsTrigger>
            <TabsTrigger value="tempo-real">Tempo Real</TabsTrigger>
          </TabsList>

          {/* Tab Visão Geral */}
          <TabsContent value="geral" className="space-y-6 mt-6">
            {/* Score de Saúde */}
            <HealthScore metrics={healthMetrics} />

            {/* Gráficos de Evolução */}
            <EvolutionChart data={evolutionData} />
          </TabsContent>

          {/* Tab Funil */}
          <TabsContent value="funil" className="space-y-6 mt-6">
            <ConversionFunnel data={funnelData} />
          </TabsContent>

          {/* Tab Produtos */}
          <TabsContent value="produtos" className="space-y-6 mt-6">
            <ProductsTable data={productsData} />
          </TabsContent>

          {/* Tab Canais */}
          <TabsContent value="canais" className="space-y-6 mt-6">
            <ChannelsComparison data={channelsData} />
          </TabsContent>

          {/* Tab Tempo Real */}
          <TabsContent value="tempo-real" className="space-y-6 mt-6">
            <RealtimeMetrics data={realtimeData} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
