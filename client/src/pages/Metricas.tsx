import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, BarChart3, Home as HomeIcon, Settings, Moon, Sun, Package, TrendingUp, DollarSign } from "lucide-react";
import { Link, useLocation } from "wouter";
import MobileNav from "@/components/MobileNav";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTheme } from "@/contexts/ThemeContext";

export default function Metricas() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();

  // Mock data - Produtos
  const produtosData = [
    {
      nome: "Creatina Pro 797",
      meta: 1500,
      realizado: 450,
      falta: 1050,
      percentual: 30,
      valorUnitario: 797,
    },
    {
      nome: "High-Ticket VIP",
      meta: 150,
      realizado: 150,
      falta: 0,
      percentual: 100,
      valorUnitario: 2500,
    },
    {
      nome: "Upsell Premium",
      meta: 1000,
      realizado: 200,
      falta: 800,
      percentual: 20,
      valorUnitario: 247,
    },
    {
      nome: "Outros Produtos",
      meta: 350,
      realizado: 50,
      falta: 300,
      percentual: 14.3,
      valorUnitario: 1339,
    },
  ];

  // Mock data - Canais
  const canaisData = {
    marketing: {
      nome: "Marketing Direto",
      meta: 2550,
      realizado: 650,
      falta: 1900,
      percentual: 25.5,
    },
    comercial: {
      nome: "Time Comercial",
      meta: 450,
      realizado: 200,
      falta: 250,
      percentual: 44.4,
    },
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("pt-BR").format(value);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Função para calcular cor do gradiente baseado no percentual
  const getGradientColor = (percentual: number) => {
    // 0-33%: Vermelho (escuro → claro)
    if (percentual <= 33) {
      const progress = percentual / 33; // 0 a 1
      const lightness = 35 + (progress * 20); // 35% a 55%
      return `hsl(0, 70%, ${lightness}%)`;
    }
    // 33-66%: Amarelo (escuro → claro)
    else if (percentual <= 66) {
      const progress = (percentual - 33) / 33; // 0 a 1
      const lightness = 45 + (progress * 20); // 45% a 65%
      return `hsl(45, 90%, ${lightness}%)`;
    }
    // 66-100%: Verde (escuro → claro)
    else {
      const progress = (percentual - 66) / 34; // 0 a 1
      const lightness = 40 + (progress * 25); // 40% a 65%
      return `hsl(142, 70%, ${lightness}%)`;
    }
  };

  // Função para criar gradiente completo da barra
  const getProgressGradient = (percentual: number) => {
    const clampedPercentual = Math.min(percentual, 100);
    const color = getGradientColor(clampedPercentual);
    
    return {
      background: `linear-gradient(to right, ${color} 0%, ${color} 100%)`,
      width: `${clampedPercentual}%`,
    };
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
              <MobileNav />
              
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
            <h2 className="text-2xl font-bold">Vendas por Produto e Canal</h2>
            <p className="text-sm text-muted-foreground">Acompanhe quantas vendas faltam para cada meta</p>
          </div>
          
          <div className="flex items-center gap-3">
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

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
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

        <Tabs defaultValue="produtos" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="produtos">Por Produto</TabsTrigger>
            <TabsTrigger value="canais">Por Canal</TabsTrigger>
          </TabsList>

          {/* Tab Por Produto */}
          <TabsContent value="produtos" className="space-y-4 mt-6">
            {produtosData.map((produto, index) => (
              <Card key={index} className={produto.percentual >= 100 ? "border-2 border-green-500" : ""}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {produto.nome}
                    </div>
                    {produto.percentual >= 100 && (
                      <span className="text-green-500 text-sm font-semibold flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        META BATIDA!
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>Valor unitário: {formatCurrency(produto.valorUnitario)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Números */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Meta</p>
                      <p className="text-2xl font-bold">{formatNumber(produto.meta)}</p>
                      <p className="text-xs text-muted-foreground">vendas</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Realizado</p>
                      <p className="text-2xl font-bold text-primary">{formatNumber(produto.realizado)}</p>
                      <p className="text-xs text-muted-foreground">{produto.percentual.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Faltam</p>
                      <p className="text-2xl font-bold text-orange-500">{formatNumber(produto.falta)}</p>
                      <p className="text-xs text-muted-foreground">vendas</p>
                    </div>
                  </div>

                  {/* Barra de Progresso Gradiente */}
                  <div className="space-y-2">
                    <div className="w-full bg-muted/30 rounded-full h-6 overflow-hidden">
                      <div 
                        className="h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                        style={getProgressGradient(produto.percentual)}
                      >
                        <span className="text-xs font-bold text-white drop-shadow-md">
                          {produto.percentual.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    {/* Legenda da barra */}
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0%</span>
                      <span>33%</span>
                      <span>66%</span>
                      <span>100%</span>
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
                  {canaisData.marketing.nome}
                </CardTitle>
                <CardDescription>Vendas online e tráfego pago</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Meta</p>
                    <p className="text-2xl font-bold">{formatNumber(canaisData.marketing.meta)}</p>
                    <p className="text-xs text-muted-foreground">vendas</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Realizado</p>
                    <p className="text-2xl font-bold text-primary">{formatNumber(canaisData.marketing.realizado)}</p>
                    <p className="text-xs text-muted-foreground">{canaisData.marketing.percentual.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Faltam</p>
                    <p className="text-2xl font-bold text-orange-500">{formatNumber(canaisData.marketing.falta)}</p>
                    <p className="text-xs text-muted-foreground">vendas</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="w-full bg-muted/30 rounded-full h-6 overflow-hidden">
                    <div 
                      className="h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                      style={getProgressGradient(canaisData.marketing.percentual)}
                    >
                      <span className="text-xs font-bold text-white drop-shadow-md">
                        {canaisData.marketing.percentual.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>33%</span>
                    <span>66%</span>
                    <span>100%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comercial */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-500" />
                  {canaisData.comercial.nome}
                </CardTitle>
                <CardDescription>Vendas consultivas e high-ticket</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Meta</p>
                    <p className="text-2xl font-bold">{formatNumber(canaisData.comercial.meta)}</p>
                    <p className="text-xs text-muted-foreground">vendas</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Realizado</p>
                    <p className="text-2xl font-bold text-primary">{formatNumber(canaisData.comercial.realizado)}</p>
                    <p className="text-xs text-muted-foreground">{canaisData.comercial.percentual.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Faltam</p>
                    <p className="text-2xl font-bold text-orange-500">{formatNumber(canaisData.comercial.falta)}</p>
                    <p className="text-xs text-muted-foreground">vendas</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="w-full bg-muted/30 rounded-full h-6 overflow-hidden">
                    <div 
                      className="h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                      style={getProgressGradient(canaisData.comercial.percentual)}
                    >
                      <span className="text-xs font-bold text-white drop-shadow-md">
                        {canaisData.comercial.percentual.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>33%</span>
                    <span>66%</span>
                    <span>100%</span>
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
