import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, BarChart3, Home as HomeIcon, Settings, Moon, Sun, Target, TrendingUp, Package, DollarSign } from "lucide-react";
import { Link, useLocation } from "wouter";
import MobileNav from "@/components/MobileNav";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTheme } from "@/contexts/ThemeContext";
import { Progress } from "@/components/ui/progress";

export default function Metricas() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();

  // Mock data - Metas e Realizações
  const metasData = {
    total: {
      meta: 3000000,
      realizado: 850000,
      falta: 2150000,
      percentual: 28.3,
      vendasMeta: 3000,
      vendasRealizadas: 850,
      vendasFaltam: 2150,
    },
    produtos: [
      {
        nome: "Creatina Pro 797",
        meta: 1500,
        realizado: 450,
        falta: 1050,
        percentual: 30,
        valorUnitario: 797,
        receitaMeta: 1195500,
        receitaRealizada: 358650,
        receitaFalta: 836850,
      },
      {
        nome: "High-Ticket VIP",
        meta: 150,
        realizado: 150,
        falta: 0,
        percentual: 100,
        valorUnitario: 2500,
        receitaMeta: 375000,
        receitaRealizada: 375000,
        receitaFalta: 0,
      },
      {
        nome: "Upsell Premium",
        meta: 1000,
        realizado: 200,
        falta: 800,
        percentual: 20,
        valorUnitario: 247,
        receitaMeta: 247000,
        receitaRealizada: 49400,
        receitaFalta: 197600,
      },
      {
        nome: "Outros Produtos",
        meta: 350,
        realizado: 50,
        falta: 300,
        percentual: 14.3,
        valorUnitario: 1339,
        receitaMeta: 468650,
        receitaRealizada: 66950,
        receitaFalta: 401700,
      },
    ],
    canais: {
      marketing: {
        meta: 2550,
        realizado: 650,
        falta: 1900,
        percentual: 25.5,
        receitaMeta: 2550000,
        receitaRealizada: 650000,
        receitaFalta: 1900000,
      },
      comercial: {
        meta: 450,
        realizado: 200,
        falta: 250,
        percentual: 44.4,
        receitaMeta: 450000,
        receitaRealizada: 200000,
        receitaFalta: 250000,
      },
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

  const getProgressColor = (percentual: number) => {
    if (percentual >= 100) return "bg-green-500";
    if (percentual >= 75) return "bg-blue-500";
    if (percentual >= 50) return "bg-yellow-500";
    return "bg-orange-500";
  };

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
            <h2 className="text-2xl font-bold">Acompanhamento de Metas</h2>
            <p className="text-sm text-muted-foreground">Veja quanto falta para bater cada meta</p>
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
          </div>
        </div>

        {/* Meta Total */}
        <Card className="mb-6 border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Target className="h-6 w-6 text-primary" />
              Meta Total do Mês
            </CardTitle>
            <CardDescription>Progresso geral de vendas e receita</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Receita */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm text-muted-foreground">Receita</p>
                  <p className="text-3xl font-bold">{formatCurrency(metasData.total.realizado)}</p>
                  <p className="text-sm text-muted-foreground">de {formatCurrency(metasData.total.meta)}</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-primary">{metasData.total.percentual.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">atingido</p>
                </div>
              </div>
              <Progress value={metasData.total.percentual} className="h-4" />
              <p className="text-sm font-semibold text-orange-500 mt-2">
                Falta: {formatCurrency(metasData.total.falta)}
              </p>
            </div>

            {/* Vendas */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm text-muted-foreground">Vendas</p>
                  <p className="text-3xl font-bold">{formatNumber(metasData.total.vendasRealizadas)}</p>
                  <p className="text-sm text-muted-foreground">de {formatNumber(metasData.total.vendasMeta)}</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-primary">{metasData.total.percentual.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">atingido</p>
                </div>
              </div>
              <Progress value={metasData.total.percentual} className="h-4" />
              <p className="text-sm font-semibold text-orange-500 mt-2">
                Faltam: {formatNumber(metasData.total.vendasFaltam)} vendas
              </p>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="produtos" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="produtos">Por Produto</TabsTrigger>
            <TabsTrigger value="canais">Por Canal</TabsTrigger>
          </TabsList>

          {/* Tab Por Produto */}
          <TabsContent value="produtos" className="space-y-4 mt-6">
            {metasData.produtos.map((produto, index) => (
              <Card key={index} className={produto.percentual >= 100 ? "border-2 border-green-500" : ""}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    {produto.nome}
                    {produto.percentual >= 100 && (
                      <span className="ml-auto text-green-500 text-sm font-semibold flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        META BATIDA!
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>Valor unitário: {formatCurrency(produto.valorUnitario)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Vendas */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Vendas</p>
                        <p className="text-2xl font-bold">{formatNumber(produto.realizado)}</p>
                        <p className="text-xs text-muted-foreground">de {formatNumber(produto.meta)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-primary">{produto.percentual.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="relative">
                      <Progress value={Math.min(produto.percentual, 100)} className="h-3" />
                      <div 
                        className={`absolute top-0 left-0 h-3 rounded-full ${getProgressColor(produto.percentual)}`}
                        style={{ width: `${Math.min(produto.percentual, 100)}%` }}
                      />
                    </div>
                    {produto.falta > 0 && (
                      <p className="text-sm font-semibold text-orange-500 mt-2">
                        Faltam: {formatNumber(produto.falta)} vendas
                      </p>
                    )}
                  </div>

                  {/* Receita */}
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Receita</p>
                        <p className="text-xl font-bold">{formatCurrency(produto.receitaRealizada)}</p>
                        <p className="text-xs text-muted-foreground">de {formatCurrency(produto.receitaMeta)}</p>
                      </div>
                      {produto.receitaFalta > 0 && (
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Falta</p>
                          <p className="text-lg font-semibold text-orange-500">{formatCurrency(produto.receitaFalta)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Tab Por Canal */}
          <TabsContent value="canais" className="space-y-4 mt-6">
            {/* Marketing */}
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Marketing Direto
                </CardTitle>
                <CardDescription>Vendas online e tráfego pago</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Vendas */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Vendas</p>
                      <p className="text-2xl font-bold">{formatNumber(metasData.canais.marketing.realizado)}</p>
                      <p className="text-xs text-muted-foreground">de {formatNumber(metasData.canais.marketing.meta)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-primary">{metasData.canais.marketing.percentual.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="relative">
                    <Progress value={metasData.canais.marketing.percentual} className="h-3" />
                    <div 
                      className={`absolute top-0 left-0 h-3 rounded-full ${getProgressColor(metasData.canais.marketing.percentual)}`}
                      style={{ width: `${Math.min(metasData.canais.marketing.percentual, 100)}%` }}
                    />
                  </div>
                  <p className="text-sm font-semibold text-orange-500 mt-2">
                    Faltam: {formatNumber(metasData.canais.marketing.falta)} vendas
                  </p>
                </div>

                {/* Receita */}
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Receita</p>
                      <p className="text-xl font-bold">{formatCurrency(metasData.canais.marketing.receitaRealizada)}</p>
                      <p className="text-xs text-muted-foreground">de {formatCurrency(metasData.canais.marketing.receitaMeta)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Falta</p>
                      <p className="text-lg font-semibold text-orange-500">{formatCurrency(metasData.canais.marketing.receitaFalta)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comercial */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-500" />
                  Time Comercial
                </CardTitle>
                <CardDescription>Vendas consultivas e high-ticket</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Vendas */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Vendas</p>
                      <p className="text-2xl font-bold">{formatNumber(metasData.canais.comercial.realizado)}</p>
                      <p className="text-xs text-muted-foreground">de {formatNumber(metasData.canais.comercial.meta)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-primary">{metasData.canais.comercial.percentual.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="relative">
                    <Progress value={metasData.canais.comercial.percentual} className="h-3" />
                    <div 
                      className={`absolute top-0 left-0 h-3 rounded-full ${getProgressColor(metasData.canais.comercial.percentual)}`}
                      style={{ width: `${Math.min(metasData.canais.comercial.percentual, 100)}%` }}
                    />
                  </div>
                  <p className="text-sm font-semibold text-orange-500 mt-2">
                    Faltam: {formatNumber(metasData.canais.comercial.falta)} vendas
                  </p>
                </div>

                {/* Receita */}
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Receita</p>
                      <p className="text-xl font-bold">{formatCurrency(metasData.canais.comercial.receitaRealizada)}</p>
                      <p className="text-xs text-muted-foreground">de {formatCurrency(metasData.canais.comercial.receitaMeta)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Falta</p>
                      <p className="text-lg font-semibold text-orange-500">{formatCurrency(metasData.canais.comercial.receitaFalta)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
