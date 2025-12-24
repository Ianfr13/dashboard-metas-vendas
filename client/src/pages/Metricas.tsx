import { useState, useEffect } from "react";
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
  TrendingDown,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import MobileNav from "@/components/MobileNav";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTheme } from "@/contexts/ThemeContext";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Metricas() {
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

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();
  
  // Estados para seleção
  const [selectedFunil, setSelectedFunil] = useState<string | null>(null);
  const [showFunilCompleto, setShowFunilCompleto] = useState(false);
  const [metricasReais, setMetricasReais] = useState<any>(null);
  const [loadingMetricas, setLoadingMetricas] = useState(false);
  const [selectedEtapaMarketing, setSelectedEtapaMarketing] = useState("leads");
  const [selectedProdutoMarketing, setSelectedProdutoMarketing] = useState("todos");
  const [selectedEtapaComercial, setSelectedEtapaComercial] = useState("agendadas");
  const [selectedProdutoComercial, setSelectedProdutoComercial] = useState("todos");

  // Definição de produtos por canal
  const produtosMarketing = [
    { id: "creatina", nome: "Creatina Pro 797" },
    { id: "upsell", nome: "Upsell Premium" },
    { id: "outros-mkt", nome: "Outros Marketing" },
  ];

  const produtosComercial = [
    { id: "high-ticket", nome: "High-Ticket VIP" },
    { id: "creatina", nome: "Creatina Pro 797" }, // Também vendido pelo comercial
    { id: "outros-com", nome: "Outros Comercial" },
  ];

  // Etapas dos funis
  const etapasMarketing = [
    { id: "leads", nome: "Leads Gerados" },
    { id: "checkout", nome: "Checkout Iniciado" },
    { id: "vendas", nome: "Vendas Concluídas" },
  ];

  const etapasComercial = [
    { id: "agendadas", nome: "Reuniões Agendadas" },
    { id: "realizadas", nome: "Reuniões Realizadas" },
    { id: "propostas", nome: "Propostas Enviadas" },
    { id: "vendas", nome: "Vendas Fechadas" },
  ];

  // Buscar métricas reais da API quando showFunilCompleto é ativado
  useEffect(() => {
    if (showFunilCompleto && selectedFunil && config) {
      const funil = config.funis?.find((f: any) => f.id === selectedFunil);
      if (!funil || !funil.url) return;

      setLoadingMetricas(true);
      
      // Preparar produtos do funil para enviar à API
      const produtosParaAPI = funil.produtos.map((p: any) => {
        const produto = config.produtos?.find((pr: any) => pr.id === p.produtoId);
        return {
          valor: produto?.valor || 0,
          tipo: p.tipo, // frontend, backend, downsell
        };
      });

      // Chamar API
      fetch('/api/funil/metricas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          funilUrl: funil.url,
          produtos: produtosParaAPI,
        }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setMetricasReais(data);
          }
        })
        .catch(err => console.error('Erro ao buscar métricas:', err))
        .finally(() => setLoadingMetricas(false));
    }
  }, [showFunilCompleto, selectedFunil, config]);

  // Mock data - Gráfico de evolução (últimos 7 dias)
  const graficoEvol = [
    { dia: "Dia 1", valor: 45, meta: 50 },
    { dia: "Dia 2", valor: 52, meta: 50 },
    { dia: "Dia 3", valor: 48, meta: 50 },
    { dia: "Dia 4", valor: 61, meta: 50 },
    { dia: "Dia 5", valor: 55, meta: 50 },
    { dia: "Dia 6", valor: 58, meta: 50 },
    { dia: "Dia 7", valor: 63, meta: 50 },
  ];

  // Mock data - Métricas detalhadas por produto
  const metricasMarketing: Record<string, any> = {
    leads: {
      todos: {
        total: 4368,
        meta: 4368,
        percentual: 100,
        cpl: 85,
        custoTotal: 371280,
        taxaConversao: 34.9,
        leadsDia: 145.6,
        melhorDia: "Segunda",
        piorDia: "Domingo",
        crescimento: 12.5,
      },
      creatina: {
        total: 1800,
        meta: 2100,
        percentual: 85.7,
        cpl: 82,
        custoTotal: 147600,
        taxaConversao: 36,
        leadsDia: 60,
        melhorDia: "Segunda",
        piorDia: "Domingo",
        crescimento: 8.3,
      },
      upsell: {
        total: 1000,
        meta: 875,
        percentual: 114.3,
        cpl: 78,
        custoTotal: 78000,
        taxaConversao: 33.3,
        leadsDia: 33.3,
        melhorDia: "Terça",
        piorDia: "Sábado",
        crescimento: 22.1,
      },
      "outros-mkt": {
        total: 1568,
        meta: 1393,
        percentual: 112.6,
        cpl: 88,
        custoTotal: 137984,
        taxaConversao: 35.2,
        leadsDia: 52.3,
        melhorDia: "Quarta",
        piorDia: "Domingo",
        crescimento: 15.7,
      },
    },
    checkout: {
      todos: {
        total: 1200,
        meta: 1529,
        percentual: 78.5,
        taxaConversao: 27.5,
        checkoutsDia: 40,
        melhorDia: "Segunda",
        piorDia: "Domingo",
        crescimento: 5.2,
        abandonos: 329,
        taxaAbandono: 21.5,
      },
      creatina: {
        total: 500,
        meta: 735,
        percentual: 68,
        taxaConversao: 27.8,
        checkoutsDia: 16.7,
        melhorDia: "Segunda",
        piorDia: "Domingo",
        crescimento: 3.1,
        abandonos: 150,
        taxaAbandono: 23.1,
      },
      upsell: {
        total: 280,
        meta: 306,
        percentual: 91.5,
        taxaConversao: 28,
        checkoutsDia: 9.3,
        melhorDia: "Terça",
        piorDia: "Sábado",
        crescimento: 8.5,
        abandonos: 45,
        taxaAbandono: 13.8,
      },
      "outros-mkt": {
        total: 420,
        meta: 488,
        percentual: 86.1,
        taxaConversao: 26.8,
        checkoutsDia: 14,
        melhorDia: "Quarta",
        piorDia: "Domingo",
        crescimento: 4.9,
        abandonos: 134,
        taxaAbandono: 24.2,
      },
    },
    vendas: {
      todos: {
        total: 850,
        meta: 1092,
        percentual: 77.8,
        taxaConversao: 70.8,
        cpa: 430,
        custoTotal: 365500,
        receita: 1020300,
        ticketMedio: 1200,
        roi: 179.1,
        roas: 2.79,
        vendasDia: 28.3,
        melhorDia: "Segunda",
        melhorHora: "14h-16h",
        piorDia: "Domingo",
        crescimento: 11.2,
        // Métricas Financeiras
        ltv: 3600,
        cac: 430,
        paybackPeriod: "3.2 meses",
        margemContribuicao: 64.2,
        breakEven: 385,
        // Métricas de Qualidade
        taxaChargeback: 0.8,
        taxaReembolso: 2.3,
        // Métricas Temporais
        tempoMedioLeadVenda: "4.2 dias",
        velocidadeConversao: "23.8 leads/dia→vendas",
      },
      creatina: {
        total: 350,
        meta: 525,
        percentual: 66.7,
        taxaConversao: 70,
        cpa: 420,
        custoTotal: 147000,
        receita: 278950,
        ticketMedio: 797,
        roi: 89.7,
        roas: 1.90,
        vendasDia: 11.7,
        melhorDia: "Segunda",
        melhorHora: "15h-17h",
        piorDia: "Domingo",
        crescimento: 7.5,
        ltv: 2391,
        cac: 420,
        paybackPeriod: "2.8 meses",
        margemContribuicao: 52.8,
        breakEven: 280,
        taxaChargeback: 0.6,
        taxaReembolso: 1.9,
        tempoMedioLeadVenda: "3.8 dias",
        velocidadeConversao: "15.8 leads/dia→vendas",
      },
      upsell: {
        total: 200,
        meta: 218,
        percentual: 91.7,
        taxaConversao: 71.4,
        cpa: 390,
        custoTotal: 78000,
        receita: 49400,
        ticketMedio: 247,
        roi: -36.7,
        roas: 0.63,
        vendasDia: 6.7,
        melhorDia: "Terça",
        melhorHora: "10h-12h",
        piorDia: "Sábado",
        crescimento: 15.3,
        ltv: 741,
        cac: 390,
        paybackPeriod: "6.8 meses",
        margemContribuicao: 18.5,
        breakEven: 180,
        taxaChargeback: 1.2,
        taxaReembolso: 3.8,
        tempoMedioLeadVenda: "5.1 dias",
        velocidadeConversao: "6.5 leads/dia→vendas",
      },
      "outros-mkt": {
        total: 300,
        meta: 349,
        percentual: 86,
        taxaConversao: 71.4,
        cpa: 460,
        custoTotal: 138000,
        receita: 401700,
        ticketMedio: 1339,
        roi: 191.1,
        roas: 2.91,
        vendasDia: 10,
        melhorDia: "Quarta",
        melhorHora: "13h-15h",
        piorDia: "Domingo",
        crescimento: 12.8,
        ltv: 4017,
        cac: 460,
        paybackPeriod: "2.5 meses",
        margemContribuicao: 71.3,
        breakEven: 290,
        taxaChargeback: 0.7,
        taxaReembolso: 2.1,
        tempoMedioLeadVenda: "4.5 dias",
        velocidadeConversao: "10.2 leads/dia→vendas",
      },
    },
  };

  const metricasComercial: Record<string, any> = {
    agendadas: {
      todos: {
        total: 360,
        meta: 360,
        percentual: 100,
        taxaConversao: 80,
        agendamentosDia: 12,
        melhorDia: "Segunda",
        piorDia: "Sexta",
        crescimento: 6.8,
        tempoMedioAgendamento: "2.5 horas",
      },
      "high-ticket": {
        total: 240,
        meta: 240,
        percentual: 100,
        taxaConversao: 80,
        agendamentosDia: 8,
        melhorDia: "Segunda",
        piorDia: "Sexta",
        crescimento: 8.1,
        tempoMedioAgendamento: "2.3 horas",
      },
      creatina: {
        total: 80,
        meta: 80,
        percentual: 100,
        taxaConversao: 80,
        agendamentosDia: 2.7,
        melhorDia: "Terça",
        piorDia: "Sexta",
        crescimento: 4.5,
        tempoMedioAgendamento: "2.8 horas",
      },
      "outros-com": {
        total: 40,
        meta: 40,
        percentual: 100,
        taxaConversao: 80,
        agendamentosDia: 1.3,
        melhorDia: "Quarta",
        piorDia: "Sexta",
        crescimento: 6.2,
        tempoMedioAgendamento: "2.6 horas",
      },
    },
    realizadas: {
      todos: {
        total: 288,
        meta: 288,
        percentual: 100,
        taxaShowUp: 80,
        reunioesDia: 9.6,
        melhorDia: "Segunda",
        piorDia: "Sexta",
        crescimento: 5.5,
        duracaoMedia: "45 min",
        noShows: 72,
      },
      "high-ticket": {
        total: 192,
        meta: 192,
        percentual: 100,
        taxaShowUp: 80,
        reunioesDia: 6.4,
        melhorDia: "Segunda",
        piorDia: "Sexta",
        crescimento: 6.8,
        duracaoMedia: "52 min",
        noShows: 48,
      },
      creatina: {
        total: 64,
        meta: 64,
        percentual: 100,
        taxaShowUp: 80,
        reunioesDia: 2.1,
        melhorDia: "Terça",
        piorDia: "Sexta",
        crescimento: 3.2,
        duracaoMedia: "35 min",
        noShows: 16,
      },
      "outros-com": {
        total: 32,
        meta: 32,
        percentual: 100,
        taxaShowUp: 80,
        reunioesDia: 1.1,
        melhorDia: "Quarta",
        piorDia: "Sexta",
        crescimento: 5.1,
        duracaoMedia: "40 min",
        noShows: 8,
      },
    },
    propostas: {
      todos: {
        total: 230,
        meta: 231,
        percentual: 99.6,
        taxaConversao: 79.9,
        propostasDia: 7.7,
        melhorDia: "Segunda",
        piorDia: "Sexta",
        crescimento: 4.2,
        tempoMedioEnvio: "1.2 dias",
        valorMedioPropostas: 2150,
      },
      "high-ticket": {
        total: 154,
        meta: 154,
        percentual: 100,
        taxaConversao: 80.2,
        propostasDia: 5.1,
        melhorDia: "Segunda",
        piorDia: "Sexta",
        crescimento: 5.5,
        tempoMedioEnvio: "1.1 dias",
        valorMedioPropostas: 2500,
      },
      creatina: {
        total: 51,
        meta: 51,
        percentual: 100,
        taxaConversao: 79.7,
        propostasDia: 1.7,
        melhorDia: "Terça",
        piorDia: "Sexta",
        crescimento: 2.1,
        tempoMedioEnvio: "1.3 dias",
        valorMedioPropostas: 797,
      },
      "outros-com": {
        total: 25,
        meta: 26,
        percentual: 96.2,
        propostasDia: 0.8,
        melhorDia: "Quarta",
        piorDia: "Sexta",
        crescimento: 3.8,
        tempoMedioEnvio: "1.4 dias",
        valorMedioPropostas: 1800,
      },
    },
    vendas: {
      todos: {
        total: 200,
        meta: 203,
        percentual: 98.5,
        taxaFechamento: 87,
        vendasDia: 6.7,
        ticketMedio: 2030,
        receita: 406000,
        melhorDia: "Segunda",
        piorDia: "Sexta",
        crescimento: 9.2,
        cicloVendaMedio: "8.5 dias",
      },
      "high-ticket": {
        total: 140,
        meta: 135,
        percentual: 103.7,
        taxaFechamento: 90.9,
        vendasDia: 4.7,
        ticketMedio: 2500,
        receita: 350000,
        melhorDia: "Segunda",
        piorDia: "Sexta",
        crescimento: 12.5,
        cicloVendaMedio: "9.2 dias",
      },
      creatina: {
        total: 45,
        meta: 45,
        percentual: 100,
        taxaFechamento: 88.2,
        vendasDia: 1.5,
        ticketMedio: 797,
        receita: 35865,
        melhorDia: "Terça",
        piorDia: "Sexta",
        crescimento: 4.8,
        cicloVendaMedio: "7.1 dias",
      },
      "outros-com": {
        total: 15,
        meta: 23,
        percentual: 65.2,
        taxaFechamento: 60,
        vendasDia: 0.5,
        ticketMedio: 1339,
        receita: 20085,
        melhorDia: "Quarta",
        piorDia: "Sexta",
        crescimento: 2.1,
        cicloVendaMedio: "6.8 dias",
      },
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

  const renderMetricas = (metricas: any) => {
    if (!metricas) return null;

    // Categorizar métricas
    const categorias = {
      principais: ['taxaConversao', 'cpl', 'cpa', 'custoTotal', 'receita', 'ticketMedio', 'roi', 'roas'],
      performance: ['vendasDia', 'leadsDia', 'checkoutsDia', 'agendamentosDia', 'melhorDia', 'melhorHora', 'piorDia', 'crescimento'],
      financeiras: ['ltv', 'cac', 'paybackPeriod', 'margemContribuicao', 'breakEven'],
      qualidade: ['taxaChargeback', 'taxaReembolso', 'abandonos', 'taxaAbandono', 'showUpRate', 'taxaFechamento', 'qualificacao', 'noShows'],
      temporais: ['tempoMedioLeadVenda', 'velocidadeConversao', 'tempoMedioAgendamento', 'cicloVendaMedio']
    };

    const labelMap: Record<string, string> = {
      taxaConversao: 'Taxa Conversão',
      cpl: 'CPL',
      cpa: 'CPA',
      custoTotal: 'Custo Total',
      receita: 'Receita',
      ticketMedio: 'Ticket Médio',
      roi: 'ROI',
      roas: 'ROAS',
      vendasDia: 'Vendas/Dia',
      leadsDia: 'Leads/Dia',
      checkoutsDia: 'Checkouts/Dia',
      agendamentosDia: 'Agendamentos/Dia',
      melhorDia: 'Melhor Dia',
      melhorHora: 'Melhor Horário',
      piorDia: 'Pior Dia',
      crescimento: 'Crescimento',
      ltv: 'LTV (Lifetime Value)',
      cac: 'CAC',
      paybackPeriod: 'Payback Period',
      margemContribuicao: 'Margem Contribuição',
      breakEven: 'Break-even',
      taxaChargeback: 'Taxa Chargeback',
      taxaReembolso: 'Taxa Reembolso',
      abandonos: 'Abandonos',
      taxaAbandono: 'Taxa Abandono',
      showUpRate: 'Show-up Rate',
      taxaFechamento: 'Taxa Fechamento',
      qualificacao: 'Qualificação',
      noShows: 'No-shows',
      tempoMedioLeadVenda: 'Tempo Lead→Venda',
      velocidadeConversao: 'Velocidade Conversão',
      tempoMedioAgendamento: 'Tempo Médio Agendamento',
      cicloVendaMedio: 'Ciclo Venda Médio'
    };

    const formatValue = (key: string, value: any) => {
      if (typeof value === 'number') {
        if (key.includes('cpl') || key.includes('cpa') || key.includes('custo') || key.includes('receita') || key.includes('ticket') || key === 'ltv' || key === 'cac' || key === 'breakEven') {
          return formatCurrency(value);
        } else if (key.includes('taxa') || key.includes('roi') || key.includes('roas') || key.includes('crescimento') || key.includes('qualificacao') || key.includes('margem')) {
          return formatPercent(value);
        } else {
          return formatNumber(value);
        }
      }
      return String(value);
    };

    const renderCategoria = (titulo: string, keys: string[]) => {
      const metricasCategoria = keys.filter(key => metricas[key] !== undefined);
      if (metricasCategoria.length === 0) return null;

      return (
        <div key={titulo} className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{titulo}</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {metricasCategoria.map((key) => (
              <Card key={key} className="hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs">{labelMap[key] || key}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold">{formatValue(key, metricas[key])}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-6">
        {renderCategoria('📊 Métricas Principais', categorias.principais)}
        {renderCategoria('🚀 Performance', categorias.performance)}
        {renderCategoria('💰 Métricas Financeiras', categorias.financeiras)}
        {renderCategoria('✅ Qualidade', categorias.qualidade)}
        {renderCategoria('⏱️ Métricas Temporais', categorias.temporais)}
      </div>
    );
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
            <h2 className="text-2xl font-bold">Análise Detalhada por Produto</h2>
            <p className="text-sm text-muted-foreground">Selecione etapa e produto para ver métricas completas</p>
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
            {/* Seletor de Funil */}
            {config?.funis && config.funis.length > 0 && (
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">Funil</label>
                <div className="flex gap-2">
                  <Select value={selectedFunil || undefined} onValueChange={(value) => {
                    setSelectedFunil(value);
                    setShowFunilCompleto(false);
                  }}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione um funil" />
                    </SelectTrigger>
                    <SelectContent>
                      {config.funis.map((funil: any) => (
                        <SelectItem key={funil.id} value={funil.id}>
                          {funil.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedFunil && (
                    <Button
                      variant={showFunilCompleto ? "default" : "outline"}
                      onClick={() => setShowFunilCompleto(!showFunilCompleto)}
                    >
                      {showFunilCompleto ? "Ver por Etapa" : "Ver Funil Completo"}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Seletores */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Etapa do Funil</label>
                <Select value={selectedEtapaMarketing} onValueChange={setSelectedEtapaMarketing}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {etapasMarketing.map((etapa) => (
                      <SelectItem key={etapa.id} value={etapa.id}>
                        {etapa.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Produto</label>
                <Select value={selectedProdutoMarketing} onValueChange={setSelectedProdutoMarketing}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Produtos</SelectItem>
                    {produtosMarketing.map((produto) => (
                      <SelectItem key={produto.id} value={produto.id}>
                        {produto.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Visualização de Funil Completo */}
            {showFunilCompleto && selectedFunil && (() => {
              const funil = config?.funis?.find((f: any) => f.id === selectedFunil);
              if (!funil) return null;

              // Calcular métricas consolidadas do funil
              const ticketMedioReal = funil.produtos.reduce((acc: number, p: any) => {
                const produto = config?.produtos?.find((pr: any) => pr.id === p.produtoId);
                if (!produto) return acc;
                
                if (p.tipo === 'frontend') {
                  return acc + produto.valor;
                } else if (p.tipo === 'backend') {
                  return acc + (produto.valor * (p.taxaTake || 0) / 100);
                } else if (p.tipo === 'downsell') {
                  return acc + (produto.valor * (p.taxaTake || 0) / 100);
                }
                return acc;
              }, 0);

              return (
                <div className="space-y-6">
                  <Card className="border-l-4 border-l-purple-500">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Funil Completo: {funil.nome}</span>
                      </CardTitle>
                      <CardDescription>
                        Visão consolidada de todas as etapas do funil
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Produtos do Funil */}
                      <div>
                        <h4 className="text-sm font-medium mb-3">Produtos no Funil</h4>
                        <div className="space-y-2">
                          {funil.produtos.map((p: any) => {
                            const produto = config?.produtos?.find((pr: any) => pr.id === p.produtoId);
                            if (!produto) return null;
                            
                            const tipoLabel = p.tipo === 'frontend' ? 'Frontend' : p.tipo === 'backend' ? 'Backend (Upsell)' : 'Downsell';
                            const tipoColor = p.tipo === 'frontend' ? 'bg-green-500' : p.tipo === 'backend' ? 'bg-blue-500' : 'bg-orange-500';
                            
                            return (
                              <div key={p.produtoId} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div className={`w-2 h-2 rounded-full ${tipoColor}`} />
                                  <div>
                                    <div className="font-medium">{produto.nome}</div>
                                    <div className="text-xs text-muted-foreground">{tipoLabel}</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold">{formatCurrency(produto.valor)}</div>
                                  {p.tipo !== 'frontend' && (
                                    <div className="text-xs text-muted-foreground">Taxa: {p.taxaTake}%</div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Métricas Consolidadas */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardDescription>Ticket Médio Real</CardDescription>
                            <CardTitle className="text-2xl">{formatCurrency(ticketMedioReal)}</CardTitle>
                          </CardHeader>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardDescription>Conversão End-to-End</CardDescription>
                            <CardTitle className="text-2xl">28.3%</CardTitle>
                          </CardHeader>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardDescription>Receita Total</CardDescription>
                            <CardTitle className="text-2xl">{formatCurrency(2550000)}</CardTitle>
                          </CardHeader>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardDescription>Vendas Totais</CardDescription>
                            <CardTitle className="text-2xl">2.550</CardTitle>
                          </CardHeader>
                        </Card>
                      </div>

                      {/* Gráfico de Funil Visual */}
                      <div>
                        <h4 className="text-sm font-medium mb-3">Funil de Conversão</h4>
                        <div className="space-y-2">
                          {[
                            { etapa: 'Leads Gerados', valor: 9000, percentual: 100 },
                            { etapa: 'Checkout Iniciado', valor: 3600, percentual: 40 },
                            { etapa: 'Vendas Concluídas', valor: 2550, percentual: 28.3 },
                          ].map((item, index) => (
                            <div key={index}>
                              <div className="flex justify-between text-sm mb-1">
                                <span>{item.etapa}</span>
                                <span className="font-semibold">{formatNumber(item.valor)} ({formatPercent(item.percentual)})</span>
                              </div>
                              <div className="w-full bg-muted/30 rounded-full h-8 overflow-hidden">
                                <div 
                                  className="h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium"
                                  style={{ width: `${item.percentual}%` }}
                                >
                                  {item.percentual >= 20 && `${formatPercent(item.percentual)}`}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}

            {/* Card Principal com Resumo */}
            {!showFunilCompleto && (() => {
              const metricas = metricasMarketing[selectedEtapaMarketing]?.[selectedProdutoMarketing];
              if (!metricas) return null;

              return (
                <>
                  <Card className="border-l-4 border-l-green-500">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>
                          {etapasMarketing.find(e => e.id === selectedEtapaMarketing)?.nome}
                          {selectedProdutoMarketing !== "todos" && ` - ${produtosMarketing.find(p => p.id === selectedProdutoMarketing)?.nome}`}
                        </span>
                        <span className="text-3xl font-bold">{formatNumber(metricas.total)}</span>
                      </CardTitle>
                      <CardDescription className="flex gap-4 items-center">
                        <span>Meta: <strong>{formatNumber(metricas.meta)}</strong></span>
                        <span className={metricas.crescimento >= 0 ? "text-green-500" : "text-red-500"} >
                          {metricas.crescimento >= 0 ? <TrendingUp className="h-4 w-4 inline" /> : <TrendingDown className="h-4 w-4 inline" />}
                          {formatPercent(Math.abs(metricas.crescimento))} vs período anterior
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Barra de Progresso */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progresso</span>
                          <span className="font-bold">{formatPercent(metricas.percentual)}</span>
                        </div>
                        <div className="w-full bg-muted/30 rounded-full h-4 overflow-hidden">
                          <div 
                            className="h-4 rounded-full transition-all duration-500"
                            style={getProgressGradient(metricas.percentual)}
                          />
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

                  {/* Gráfico de Evolução */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Evolução nos Últimos 7 Dias</CardTitle>
                      <CardDescription>Acompanhe o desempenho diário</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={graficoEvol}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="dia" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="valor" stroke="#10b981" strokeWidth={2} name="Realizado" />
                          <Line type="monotone" dataKey="meta" stroke="#6b7280" strokeWidth={2} strokeDasharray="5 5" name="Meta Diária" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Grid de Métricas Detalhadas */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Métricas Detalhadas</h3>
                    {renderMetricas(metricas)}
                  </div>
                </>
              );
            })()}
          </TabsContent>

          {/* Tab Funil Comercial */}
          <TabsContent value="comercial" className="space-y-6 mt-6">
            {/* Seletores */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Etapa do Funil</label>
                <Select value={selectedEtapaComercial} onValueChange={setSelectedEtapaComercial}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {etapasComercial.map((etapa) => (
                      <SelectItem key={etapa.id} value={etapa.id}>
                        {etapa.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Produto</label>
                <Select value={selectedProdutoComercial} onValueChange={setSelectedProdutoComercial}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Produtos</SelectItem>
                    {produtosComercial.map((produto) => (
                      <SelectItem key={produto.id} value={produto.id}>
                        {produto.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Card Principal com Resumo */}
            {(() => {
              const metricas = metricasComercial[selectedEtapaComercial]?.[selectedProdutoComercial];
              if (!metricas) return null;

              return (
                <>
                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>
                          {etapasComercial.find(e => e.id === selectedEtapaComercial)?.nome}
                          {selectedProdutoComercial !== "todos" && ` - ${produtosComercial.find(p => p.id === selectedProdutoComercial)?.nome}`}
                        </span>
                        <span className="text-3xl font-bold">{formatNumber(metricas.total)}</span>
                      </CardTitle>
                      <CardDescription className="flex gap-4 items-center">
                        <span>Meta: <strong>{formatNumber(metricas.meta)}</strong></span>
                        <span className={metricas.crescimento >= 0 ? "text-green-500" : "text-red-500"}>
                          {metricas.crescimento >= 0 ? <TrendingUp className="h-4 w-4 inline" /> : <TrendingDown className="h-4 w-4 inline" />}
                          {formatPercent(Math.abs(metricas.crescimento))} vs período anterior
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Barra de Progresso */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progresso</span>
                          <span className="font-bold">{formatPercent(metricas.percentual)}</span>
                        </div>
                        <div className="w-full bg-muted/30 rounded-full h-4 overflow-hidden">
                          <div 
                            className="h-4 rounded-full transition-all duration-500"
                            style={getProgressGradient(metricas.percentual)}
                          />
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

                  {/* Gráfico de Evolução */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Evolução nos Últimos 7 Dias</CardTitle>
                      <CardDescription>Acompanhe o desempenho diário</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={graficoEvol}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="dia" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="valor" fill="#3b82f6" name="Realizado" />
                          <Bar dataKey="meta" fill="#9ca3af" name="Meta Diária" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Grid de Métricas Detalhadas */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Métricas Detalhadas</h3>
                    {renderMetricas(metricas)}
                  </div>
                </>
              );
            })()}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
