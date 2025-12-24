import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Target, BarChart3, Home as HomeIcon, Settings, Moon, Sun } from "lucide-react";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTheme } from "@/contexts/ThemeContext";

export default function Metricas() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();

  // Mock data - substituir por dados reais da API
  const mockMetrics = {
    totalSales: 850,
    totalRevenue: 850000,
    totalLeads: 4368,
    conversionRate: 19.5,
    avgTicket: 1000,
    cpa: 450,
    cpl: 30,
    roi: 90.8,
    roas: 1.91,
  };

  const mockProductSales = [
    { name: "Creatina Pro 797", sales: 450, revenue: 358650, percentage: 42.2 },
    { name: "Upsell Premium", sales: 200, revenue: 49400, percentage: 23.5 },
    { name: "High-Ticket VIP", sales: 150, revenue: 375000, percentage: 17.6 },
    { name: "Outros", sales: 50, revenue: 66950, percentage: 5.9 },
  ];

  const mockChannelMetrics = {
    marketing: {
      sales: 650,
      revenue: 650000,
      leads: 4000,
      conversionRate: 16.25,
      cpa: 430,
    },
    comercial: {
      sales: 200,
      revenue: 200000,
      meetings: 120,
      conversionRate: 20,
      avgTicket: 1000,
    },
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("pt-BR").format(value);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/logo-douravita.png"
                alt="DouraVita"
                className="h-10 w-auto drop-shadow-lg"
              />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Métricas Detalhadas</h1>
                <p className="text-sm text-muted-foreground">
                  Análise completa de performance
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Navegação */}
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

              {/* Toggle Tema */}
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {theme === "dark" ? "🌞" : "🌙"}
              </Button>

              <Button asChild variant="outline">
                <a href="/">← Dashboard</a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="geral" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="geral">Visão Geral</TabsTrigger>
            <TabsTrigger value="produtos">Por Produto</TabsTrigger>
            <TabsTrigger value="canais">Por Canal</TabsTrigger>
            <TabsTrigger value="funil">Funil de Vendas</TabsTrigger>
          </TabsList>

          {/* Tab Visão Geral */}
          <TabsContent value="geral" className="space-y-6 mt-6">
            {/* Cards de Métricas Principais */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(mockMetrics.totalSales)}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-500 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      +12.5% vs. período anterior
                    </span>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(mockMetrics.totalRevenue)}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-500 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      +15.3% vs. período anterior
                    </span>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(mockMetrics.totalLeads)}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-500 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      +8.7% vs. período anterior
                    </span>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockMetrics.conversionRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-500 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      +2.1% vs. período anterior
                    </span>
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Métricas Secundárias */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{formatCurrency(mockMetrics.avgTicket)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">CPA</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{formatCurrency(mockMetrics.cpa)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">CPL</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{formatCurrency(mockMetrics.cpl)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">ROI</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-green-500">{mockMetrics.roi}%</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">ROAS</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-green-500">{mockMetrics.roas}x</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Por Produto */}
          <TabsContent value="produtos" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Vendas por Produto
                </CardTitle>
                <CardDescription>
                  Performance detalhada de cada produto no período
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockProductSales.map((product, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatNumber(product.sales)} vendas • {formatCurrency(product.revenue)}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-primary">
                          {product.percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${product.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Por Canal */}
          <TabsContent value="canais" className="space-y-6 mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Marketing Direto */}
              <Card className="border-2 border-green-500/20">
                <CardHeader>
                  <CardTitle className="text-green-500">Marketing Direto</CardTitle>
                  <CardDescription>Performance do tráfego pago</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Vendas</p>
                      <p className="text-2xl font-bold">{formatNumber(mockChannelMetrics.marketing.sales)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Receita</p>
                      <p className="text-2xl font-bold">{formatCurrency(mockChannelMetrics.marketing.revenue)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Leads</p>
                      <p className="text-2xl font-bold">{formatNumber(mockChannelMetrics.marketing.leads)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Conversão</p>
                      <p className="text-2xl font-bold">{mockChannelMetrics.marketing.conversionRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">CPA</p>
                      <p className="text-xl font-bold">{formatCurrency(mockChannelMetrics.marketing.cpa)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Time Comercial */}
              <Card className="border-2 border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-purple-500">Time Comercial</CardTitle>
                  <CardDescription>Performance do time de vendas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Vendas</p>
                      <p className="text-2xl font-bold">{formatNumber(mockChannelMetrics.comercial.sales)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Receita</p>
                      <p className="text-2xl font-bold">{formatCurrency(mockChannelMetrics.comercial.revenue)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Reuniões</p>
                      <p className="text-2xl font-bold">{formatNumber(mockChannelMetrics.comercial.meetings)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Conversão</p>
                      <p className="text-2xl font-bold">{mockChannelMetrics.comercial.conversionRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ticket Médio</p>
                      <p className="text-xl font-bold">{formatCurrency(mockChannelMetrics.comercial.avgTicket)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Funil de Vendas */}
          <TabsContent value="funil" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Funil de Conversão</CardTitle>
                <CardDescription>
                  Acompanhe cada etapa do processo de vendas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[
                    { stage: "Views VSL", count: 291200, percentage: 100, color: "bg-blue-500" },
                    { stage: "Leads Gerados", count: 4368, percentage: 1.5, color: "bg-green-500" },
                    { stage: "Checkout Iniciado", count: 3494, percentage: 80, color: "bg-yellow-500" },
                    { stage: "Vendas Concluídas", count: 850, percentage: 24.3, color: "bg-purple-500" },
                  ].map((stage, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-foreground">{stage.stage}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatNumber(stage.count)} • {stage.percentage}% do total
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <div
                          className={`${stage.color} h-3 rounded-full transition-all`}
                          style={{ width: `${stage.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
