import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CalendarIcon, 
  BarChart3, 
  Home as HomeIcon, 
  Settings, 
  Moon, 
  Sun, 
  TrendingUp, 
  Eye,
  UserPlus,
  ShoppingCart,
  DollarSign,
  Users,
  Calendar as CalendarCheck,
  FileText,
  CheckCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Link, useLocation } from "wouter";
import MobileNav from "@/components/MobileNav";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTheme } from "@/contexts/ThemeContext";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function Metricas() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();
  
  // Estados para controlar expansão dos produtos
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});

  // Mock data - Funil de Marketing
  const marketingFunnel = {
    etapas: [
      {
        nome: "Views VSL",
        icon: Eye,
        total: 12500,
        produtos: [
          { nome: "Creatina Pro 797", valor: 5000, meta: 6000, percentual: 83.3 },
          { nome: "High-Ticket VIP", valor: 3500, meta: 3000, percentual: 116.7 },
          { nome: "Upsell Premium", valor: 3000, meta: 2500, percentual: 120 },
          { nome: "Outros", valor: 1000, meta: 1000, percentual: 100 },
        ],
      },
      {
        nome: "Leads Gerados",
        icon: UserPlus,
        total: 4368,
        taxaConversao: 34.9,
        cpl: 85,
        produtos: [
          { nome: "Creatina Pro 797", valor: 1800, meta: 2100, percentual: 85.7, cpl: 82 },
          { nome: "High-Ticket VIP", valor: 1200, meta: 1050, percentual: 114.3, cpl: 95 },
          { nome: "Upsell Premium", valor: 1000, meta: 875, percentual: 114.3, cpl: 78 },
          { nome: "Outros", valor: 368, meta: 343, percentual: 107.3, cpl: 88 },
        ],
      },
      {
        nome: "Checkout Iniciado",
        icon: ShoppingCart,
        total: 1200,
        taxaConversao: 27.5,
        produtos: [
          { nome: "Creatina Pro 797", valor: 500, meta: 735, percentual: 68, taxaConversao: 27.8 },
          { nome: "High-Ticket VIP", valor: 350, meta: 368, percentual: 95.1, taxaConversao: 29.2 },
          { nome: "Upsell Premium", valor: 280, meta: 306, percentual: 91.5, taxaConversao: 28 },
          { nome: "Outros", valor: 70, meta: 120, percentual: 58.3, taxaConversao: 19 },
        ],
      },
      {
        nome: "Vendas Concluídas",
        icon: CheckCircle,
        total: 850,
        taxaConversao: 70.8,
        cpa: 430,
        roas: 1.91,
        roi: 90.8,
        produtos: [
          { nome: "Creatina Pro 797", valor: 350, meta: 525, percentual: 66.7, taxaConversao: 70, cpa: 420, ticketMedio: 797, receita: 278950 },
          { nome: "High-Ticket VIP", valor: 250, meta: 263, percentual: 95.1, taxaConversao: 71.4, cpa: 480, ticketMedio: 2500, receita: 625000 },
          { nome: "Upsell Premium", valor: 200, meta: 218, percentual: 91.7, taxaConversao: 71.4, cpa: 390, ticketMedio: 247, receita: 49400 },
          { nome: "Outros", valor: 50, meta: 86, percentual: 58.1, taxaConversao: 71.4, cpa: 440, ticketMedio: 1339, receita: 66950 },
        ],
      },
    ],
  };

  // Mock data - Funil Comercial
  const comercialFunnel = {
    etapas: [
      {
        nome: "Leads Qualificados",
        icon: Users,
        total: 450,
        produtos: [
          { nome: "High-Ticket VIP", valor: 300, meta: 300, percentual: 100 },
          { nome: "Creatina Pro 797", valor: 100, meta: 100, percentual: 100 },
          { nome: "Outros", valor: 50, meta: 50, percentual: 100 },
        ],
      },
      {
        nome: "Reuniões Agendadas",
        icon: CalendarCheck,
        total: 360,
        taxaConversao: 80,
        produtos: [
          { nome: "High-Ticket VIP", valor: 240, meta: 240, percentual: 100, taxaConversao: 80 },
          { nome: "Creatina Pro 797", valor: 80, meta: 80, percentual: 100, taxaConversao: 80 },
          { nome: "Outros", valor: 40, meta: 40, percentual: 100, taxaConversao: 80 },
        ],
      },
      {
        nome: "Reuniões Realizadas",
        icon: Users,
        total: 288,
        taxaShowUp: 80,
        produtos: [
          { nome: "High-Ticket VIP", valor: 192, meta: 192, percentual: 100, taxaShowUp: 80 },
          { nome: "Creatina Pro 797", valor: 64, meta: 64, percentual: 100, taxaShowUp: 80 },
          { nome: "Outros", valor: 32, meta: 32, percentual: 100, taxaShowUp: 80 },
        ],
      },
      {
        nome: "Propostas Enviadas",
        icon: FileText,
        total: 230,
        taxaConversao: 79.9,
        produtos: [
          { nome: "High-Ticket VIP", valor: 154, meta: 154, percentual: 100, taxaConversao: 80.2 },
          { nome: "Creatina Pro 797", valor: 51, meta: 51, percentual: 100, taxaConversao: 79.7 },
          { nome: "Outros", valor: 25, meta: 26, percentual: 96.2, taxaConversao: 78.1 },
        ],
      },
      {
        nome: "Vendas Fechadas",
        icon: CheckCircle,
        total: 200,
        taxaFechamento: 87,
        produtos: [
          { nome: "High-Ticket VIP", valor: 140, meta: 135, percentual: 103.7, taxaFechamento: 90.9, ticketMedio: 2500, receita: 350000 },
          { nome: "Creatina Pro 797", valor: 45, meta: 45, percentual: 100, taxaFechamento: 88.2, ticketMedio: 797, receita: 35865 },
          { nome: "Outros", valor: 15, meta: 23, percentual: 65.2, taxaFechamento: 60, ticketMedio: 1339, receita: 20085 },
        ],
      },
    ],
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

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getGradientColor = (percentual: number) => {
    if (percentual <= 33) {
      const progress = percentual / 33;
      const lightness = 35 + (progress * 20);
      return `hsl(0, 70%, ${lightness}%)`;
    } else if (percentual <= 66) {
      const progress = (percentual - 33) / 33;
      const lightness = 45 + (progress * 20);
      return `hsl(45, 90%, ${lightness}%)`;
    } else {
      const progress = (percentual - 66) / 34;
      const lightness = 40 + (progress * 25);
      return `hsl(142, 70%, ${lightness}%)`;
    }
  };

  const getProgressGradient = (percentual: number) => {
    const clampedPercentual = Math.min(percentual, 100);
    const color = getGradientColor(clampedPercentual);
    
    return {
      background: `linear-gradient(to right, ${color} 0%, ${color} 100%)`,
      width: `${clampedPercentual}%`,
    };
  };

  const toggleProduct = (etapaIndex: number, produtoNome: string) => {
    const key = `${etapaIndex}-${produtoNome}`;
    setExpandedProducts(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isProductExpanded = (etapaIndex: number, produtoNome: string) => {
    const key = `${etapaIndex}-${produtoNome}`;
    return expandedProducts[key] || false;
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
            <h2 className="text-2xl font-bold">Funis de Vendas</h2>
            <p className="text-sm text-muted-foreground">Acompanhe cada etapa e produto detalhadamente</p>
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

        <Tabs defaultValue="marketing" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="marketing">Funil de Marketing</TabsTrigger>
            <TabsTrigger value="comercial">Funil Comercial</TabsTrigger>
          </TabsList>

          {/* Tab Funil de Marketing */}
          <TabsContent value="marketing" className="space-y-6 mt-6">
            {marketingFunnel.etapas.map((etapa, etapaIndex) => {
              const EtapaIcon = etapa.icon;
              
              return (
                <Card key={etapaIndex} className="border-l-4 border-l-green-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <EtapaIcon className="h-5 w-5 text-green-500" />
                      {etapa.nome}
                      <span className="ml-auto text-2xl font-bold">{formatNumber(etapa.total)}</span>
                    </CardTitle>
                    <CardDescription className="flex gap-4">
                      {etapa.taxaConversao && (
                        <span>Taxa de Conversão: <strong>{formatPercent(etapa.taxaConversao)}</strong></span>
                      )}
                      {etapa.cpl && (
                        <span>CPL: <strong>{formatCurrency(etapa.cpl)}</strong></span>
                      )}
                      {etapa.cpa && (
                        <span>CPA: <strong>{formatCurrency(etapa.cpa)}</strong></span>
                      )}
                      {etapa.roas && (
                        <span>ROAS: <strong>{etapa.roas.toFixed(2)}x</strong></span>
                      )}
                      {etapa.roi && (
                        <span>ROI: <strong>{formatPercent(etapa.roi)}</strong></span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {etapa.produtos.map((produto, produtoIndex) => {
                      const isExpanded = isProductExpanded(etapaIndex, produto.nome);
                      
                      return (
                        <Collapsible key={produtoIndex} open={isExpanded} onOpenChange={() => toggleProduct(etapaIndex, produto.nome)}>
                          <Card className={produto.percentual >= 100 ? "border border-green-500/50" : ""}>
                            <CollapsibleTrigger className="w-full">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-base">{produto.nome}</CardTitle>
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm text-muted-foreground">
                                      {formatNumber(produto.valor)} / {formatNumber(produto.meta)}
                                    </span>
                                    <span className="text-lg font-bold">{formatPercent(produto.percentual)}</span>
                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                  </div>
                                </div>
                                <div className="w-full bg-muted/30 rounded-full h-3 overflow-hidden mt-2">
                                  <div 
                                    className="h-3 rounded-full transition-all duration-500"
                                    style={getProgressGradient(produto.percentual)}
                                  />
                                </div>
                              </CardHeader>
                            </CollapsibleTrigger>
                            
                            <CollapsibleContent>
                              <CardContent className="pt-0">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                  {('cpl' in produto) && produto.cpl && (
                                    <div>
                                      <p className="text-muted-foreground">CPL</p>
                                      <p className="font-semibold">{formatCurrency(produto.cpl)}</p>
                                    </div>
                                  )}
                                  {('cpa' in produto) && produto.cpa && (
                                    <div>
                                      <p className="text-muted-foreground">CPA</p>
                                      <p className="font-semibold">{formatCurrency(produto.cpa)}</p>
                                    </div>
                                  )}
                                  {('taxaConversao' in produto) && produto.taxaConversao && (
                                    <div>
                                      <p className="text-muted-foreground">Taxa Conv.</p>
                                      <p className="font-semibold">{formatPercent(produto.taxaConversao)}</p>
                                    </div>
                                  )}
                                  {('ticketMedio' in produto) && produto.ticketMedio && (
                                    <div>
                                      <p className="text-muted-foreground">Ticket Médio</p>
                                      <p className="font-semibold">{formatCurrency(produto.ticketMedio)}</p>
                                    </div>
                                  )}
                                  {('receita' in produto) && produto.receita && (
                                    <div>
                                      <p className="text-muted-foreground">Receita</p>
                                      <p className="font-semibold text-green-500">{formatCurrency(produto.receita)}</p>
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-muted-foreground">Faltam</p>
                                    <p className="font-semibold text-orange-500">{formatNumber(Math.max(0, produto.meta - produto.valor))}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </CollapsibleContent>
                          </Card>
                        </Collapsible>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* Tab Funil Comercial */}
          <TabsContent value="comercial" className="space-y-6 mt-6">
            {comercialFunnel.etapas.map((etapa, etapaIndex) => {
              const EtapaIcon = etapa.icon;
              
              return (
                <Card key={etapaIndex} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <EtapaIcon className="h-5 w-5 text-blue-500" />
                      {etapa.nome}
                      <span className="ml-auto text-2xl font-bold">{formatNumber(etapa.total)}</span>
                    </CardTitle>
                    <CardDescription className="flex gap-4">
                      {etapa.taxaConversao && (
                        <span>Taxa de Conversão: <strong>{formatPercent(etapa.taxaConversao)}</strong></span>
                      )}
                      {etapa.taxaShowUp && (
                        <span>Show-up Rate: <strong>{formatPercent(etapa.taxaShowUp)}</strong></span>
                      )}
                      {etapa.taxaFechamento && (
                        <span>Taxa de Fechamento: <strong>{formatPercent(etapa.taxaFechamento)}</strong></span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {etapa.produtos.map((produto, produtoIndex) => {
                      const isExpanded = isProductExpanded(etapaIndex + 100, produto.nome); // +100 para não conflitar com marketing
                      
                      return (
                        <Collapsible key={produtoIndex} open={isExpanded} onOpenChange={() => toggleProduct(etapaIndex + 100, produto.nome)}>
                          <Card className={produto.percentual >= 100 ? "border border-green-500/50" : ""}>
                            <CollapsibleTrigger className="w-full">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-base">{produto.nome}</CardTitle>
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm text-muted-foreground">
                                      {formatNumber(produto.valor)} / {formatNumber(produto.meta)}
                                    </span>
                                    <span className="text-lg font-bold">{formatPercent(produto.percentual)}</span>
                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                  </div>
                                </div>
                                <div className="w-full bg-muted/30 rounded-full h-3 overflow-hidden mt-2">
                                  <div 
                                    className="h-3 rounded-full transition-all duration-500"
                                    style={getProgressGradient(produto.percentual)}
                                  />
                                </div>
                              </CardHeader>
                            </CollapsibleTrigger>
                            
                            <CollapsibleContent>
                              <CardContent className="pt-0">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                  {('taxaConversao' in produto) && produto.taxaConversao && (
                                    <div>
                                      <p className="text-muted-foreground">Taxa Conv.</p>
                                      <p className="font-semibold">{formatPercent(produto.taxaConversao)}</p>
                                    </div>
                                  )}
                                  {('taxaShowUp' in produto) && produto.taxaShowUp && (
                                    <div>
                                      <p className="text-muted-foreground">Show-up</p>
                                      <p className="font-semibold">{formatPercent(produto.taxaShowUp)}</p>
                                    </div>
                                  )}
                                  {('taxaFechamento' in produto) && produto.taxaFechamento && (
                                    <div>
                                      <p className="text-muted-foreground">Fechamento</p>
                                      <p className="font-semibold">{formatPercent(produto.taxaFechamento)}</p>
                                    </div>
                                  )}
                                  {('ticketMedio' in produto) && produto.ticketMedio && (
                                    <div>
                                      <p className="text-muted-foreground">Ticket Médio</p>
                                      <p className="font-semibold">{formatCurrency(produto.ticketMedio)}</p>
                                    </div>
                                  )}
                                  {('receita' in produto) && produto.receita && (
                                    <div>
                                      <p className="text-muted-foreground">Receita</p>
                                      <p className="font-semibold text-green-500">{formatCurrency(produto.receita)}</p>
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-muted-foreground">Faltam</p>
                                    <p className="font-semibold text-orange-500">{formatNumber(Math.max(0, produto.meta - produto.valor))}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </CollapsibleContent>
                          </Card>
                        </Collapsible>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
