import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Home as HomeIcon, BarChart3, Settings, Moon, Sun, Save, RotateCcw, Plus, Trash2, Calculator, Edit2, Check, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import MobileNav from "@/components/MobileNav";

interface Produto {
  id: string;
  nome: string;
  valor: number;
  canal: "marketing" | "comercial" | "ambos";
}

interface ProdutoNoFunil {
  produtoId: string;
  tipo: "frontend" | "backend" | "downsell";
  taxaTake: number; // % para backend/downsell
}

interface Funil {
  id: string;
  nome: string;
  produtos: ProdutoNoFunil[];
}

interface SubMeta {
  id: string;
  valor: number;
  cor: string;
}

interface Configuracao {
  metaMensal: number;
  produtos: Produto[];
  funis: Funil[];
  subMetas: SubMeta[];
  distribuicao: {
    marketing: number;
    comercial: number;
  };
  custos: {
    cplMarketing: number;
    cpaMarketing: number;
  };
  cenarios: {
    conservador: number;
    realista: number;
    otimista: number;
  };
  periodo: {
    mes: number;
    ano: number;
    diasUteis: number;
  };
}

const CONFIG_STORAGE_KEY = "dashboard-config";

export default function Admin() {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();

  // Estado da configuração
  const [config, setConfig] = useState<Configuracao>({
    metaMensal: 3000000,
    produtos: [
      { id: "1", nome: "Creatina Pro 797", valor: 797, canal: "marketing" },
      { id: "2", nome: "Creatina Pro + Whey Combo", valor: 1200, canal: "marketing" },
      { id: "3", nome: "Creatina Basic", valor: 397, canal: "marketing" },
      { id: "4", nome: "Ômega-3 Ultra", valor: 180, canal: "comercial" },
    ],
    funis: [
      {
        id: "f1",
        nome: "Funil Creatina",
        produtos: [
          { produtoId: "1", tipo: "frontend", taxaTake: 100 },
          { produtoId: "2", tipo: "backend", taxaTake: 30 },
          { produtoId: "3", tipo: "downsell", taxaTake: 20 },
        ],
      },
    ],
    distribuicao: {
      marketing: 85,
      comercial: 15,
    },
    custos: {
      cplMarketing: 85,
      cpaMarketing: 430,
    },
    cenarios: {
      conservador: 70,
      realista: 100,
      otimista: 130,
    },
    periodo: {
      mes: 1,
      ano: 2025,
      diasUteis: 22,
    },
    subMetas: [
      { id: "1", valor: 100000, cor: "#10b981" },
      { id: "2", valor: 250000, cor: "#10b981" },
      { id: "3", valor: 500000, cor: "#10b981" },
      { id: "4", valor: 1000000, cor: "#3b82f6" },
      { id: "5", valor: 1500000, cor: "#3b82f6" },
      { id: "6", valor: 2000000, cor: "#3b82f6" },
      { id: "7", valor: 3000000, cor: "#3b82f6" },
    ],
  });

  // Estados para formulários
  const [novoProduto, setNovoProduto] = useState({ nome: "", valor: "", canal: "ambos" as const });
  const [novoFunil, setNovoFunil] = useState({ nome: "" });
  const [editandoFunil, setEditandoFunil] = useState<string | null>(null);
  const [nomeEditado, setNomeEditado] = useState("");

  // Carregar configuração do localStorage
  useEffect(() => {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {
        console.error("Erro ao carregar configuração:", e);
      }
    }
  }, []);

  // Calcular ticket médio de um funil
  const calcularTicketMedioFunil = (funil: Funil): number => {
    const frontend = funil.produtos.find(p => p.tipo === "frontend");
    if (!frontend) return 0;

    const produtoFrontend = config.produtos.find(p => p.id === frontend.produtoId);
    if (!produtoFrontend) return 0;

    let ticketMedio = produtoFrontend.valor;

    // Adicionar backends
    funil.produtos
      .filter(p => p.tipo === "backend")
      .forEach(backend => {
        const produtoBackend = config.produtos.find(p => p.id === backend.produtoId);
        if (produtoBackend) {
          ticketMedio += (produtoBackend.valor - produtoFrontend.valor) * backend.taxaTake / 100;
        }
      });

    // Adicionar downsells
    funil.produtos
      .filter(p => p.tipo === "downsell")
      .forEach(downsell => {
        const produtoDownsell = config.produtos.find(p => p.id === downsell.produtoId);
        if (produtoDownsell) {
          ticketMedio += (produtoDownsell.valor - produtoFrontend.valor) * downsell.taxaTake / 100;
        }
      });

    return ticketMedio;
  };

  // Calcular ticket médio geral (média de todos os funis)
  const ticketMedioGeral = config.funis.length > 0
    ? config.funis.reduce((acc, f) => acc + calcularTicketMedioFunil(f), 0) / config.funis.length
    : 1;

  // Salvar configuração
  const salvarConfiguracao = () => {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    toast.success("Configurações salvas com sucesso!");
  };

  // Resetar para valores padrão
  const resetarConfiguracao = () => {
    if (confirm("Tem certeza que deseja resetar todas as configurações?")) {
      localStorage.removeItem(CONFIG_STORAGE_KEY);
      window.location.reload();
    }
  };

  // Cálculos automáticos
  const calculos = {
    metaDiaria: config.metaMensal / 30,
    metaSemanal: config.metaMensal / 4,
    metaMarketing: (config.metaMensal * config.distribuicao.marketing) / 100,
    metaComercial: (config.metaMensal * config.distribuicao.comercial) / 100,
    vendasNecessarias: Math.ceil(config.metaMensal / ticketMedioGeral),
    orcamentoMarketing: function() {
      const vendasMkt = Math.ceil(this.metaMarketing / ticketMedioGeral);
      return vendasMkt * config.custos.cpaMarketing;
    },
    roiEsperado: function() {
      const orcamento = this.orcamentoMarketing();
      return orcamento > 0 ? ((this.metaMarketing - orcamento) / orcamento) * 100 : 0;
    },
  };

  // ===== PRODUTOS =====
  const adicionarProduto = () => {
    if (!novoProduto.nome || !novoProduto.valor) {
      toast.error("Preencha todos os campos");
      return;
    }

    const novo: Produto = {
      id: Date.now().toString(),
      nome: novoProduto.nome,
      valor: parseFloat(novoProduto.valor),
      canal: novoProduto.canal,
    };

    setConfig({ ...config, produtos: [...config.produtos, novo] });
    setNovoProduto({ nome: "", valor: "", canal: "ambos" });
    toast.success("Produto adicionado!");
  };

  const removerProduto = (id: string) => {
    // Verificar se produto está em algum funil
    const emUso = config.funis.some(f => f.produtos.some(p => p.produtoId === id));
    if (emUso) {
      toast.error("Remova o produto dos funis antes de deletá-lo");
      return;
    }

    if (confirm("Tem certeza que deseja remover este produto?")) {
      setConfig({ ...config, produtos: config.produtos.filter(p => p.id !== id) });
      toast.success("Produto removido!");
    }
  };

  const atualizarProduto = (id: string, campo: keyof Produto, valor: any) => {
    setConfig({
      ...config,
      produtos: config.produtos.map(p => (p.id === id ? { ...p, [campo]: valor } : p)),
    });
  };

  // ===== FUNIS =====
  const adicionarFunil = () => {
    if (!novoFunil.nome) {
      toast.error("Digite o nome do funil");
      return;
    }

    const novo: Funil = {
      id: Date.now().toString(),
      nome: novoFunil.nome,
      produtos: [],
    };

    setConfig({ ...config, funis: [...config.funis, novo] });
    setNovoFunil({ nome: "" });
    toast.success("Funil criado!");
  };

  const removerFunil = (id: string) => {
    if (confirm("Tem certeza que deseja remover este funil?")) {
      setConfig({ ...config, funis: config.funis.filter(f => f.id !== id) });
      toast.success("Funil removido!");
    }
  };

  const editarNomeFunil = (id: string) => {
    if (!nomeEditado.trim()) {
      toast.error("Nome não pode ser vazio");
      return;
    }

    setConfig({
      ...config,
      funis: config.funis.map(f => (f.id === id ? { ...f, nome: nomeEditado } : f)),
    });
    setEditandoFunil(null);
    setNomeEditado("");
    toast.success("Nome atualizado!");
  };

  const adicionarProdutoAoFunil = (funilId: string, produtoId: string, tipo: "frontend" | "backend" | "downsell", taxaTake: number) => {
    // Verificar se produto já está no funil
    const funil = config.funis.find(f => f.id === funilId);
    if (funil?.produtos.some(p => p.produtoId === produtoId)) {
      toast.error("Produto já está neste funil");
      return;
    }

    // Se é frontend, verificar se já existe um frontend
    if (tipo === "frontend" && funil?.produtos.some(p => p.tipo === "frontend")) {
      toast.error("Funil já tem um produto frontend");
      return;
    }

    setConfig({
      ...config,
      funis: config.funis.map(f =>
        f.id === funilId
          ? { ...f, produtos: [...f.produtos, { produtoId, tipo, taxaTake }] }
          : f
      ),
    });
    toast.success("Produto adicionado ao funil!");
  };

  const removerProdutoDoFunil = (funilId: string, produtoId: string) => {
    setConfig({
      ...config,
      funis: config.funis.map(f =>
        f.id === funilId
          ? { ...f, produtos: f.produtos.filter(p => p.produtoId !== produtoId) }
          : f
      ),
    });
    toast.success("Produto removido do funil!");
  };

  const atualizarProdutoNoFunil = (funilId: string, produtoId: string, campo: keyof ProdutoNoFunil, valor: any) => {
    setConfig({
      ...config,
      funis: config.funis.map(f =>
        f.id === funilId
          ? {
              ...f,
              produtos: f.produtos.map(p =>
                p.produtoId === produtoId ? { ...p, [campo]: valor } : p
              ),
            }
          : f
      ),
    });
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
    return new Intl.NumberFormat("pt-BR").format(Math.round(value));
  };

  const getTipoLabel = (tipo: string) => {
    const labels = {
      frontend: "Frontend",
      backend: "Backend (Upsell)",
      downsell: "Downsell",
    };
    return labels[tipo as keyof typeof labels] || tipo;
  };

  const getTipoColor = (tipo: string) => {
    const colors = {
      frontend: "bg-green-500/20 text-green-500",
      backend: "bg-orange-500/20 text-orange-500",
      downsell: "bg-yellow-500/20 text-yellow-500",
    };
    return colors[tipo as keyof typeof colors] || "";
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
                <p className="text-xs text-muted-foreground font-medium">Janeiro 2025</p>
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
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold">Configurações do Dashboard</h2>
            <p className="text-sm text-muted-foreground">Gerencie produtos, funis, metas e custos</p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={resetarConfiguracao} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Resetar
            </Button>
            <Button onClick={salvarConfiguracao} className="gap-2">
              <Save className="h-4 w-4" />
              Salvar Configurações
            </Button>
          </div>
        </div>

        <Tabs defaultValue="metas" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="metas">Metas</TabsTrigger>
            <TabsTrigger value="submetas">Sub-Metas</TabsTrigger>
            <TabsTrigger value="produtos">Produtos</TabsTrigger>
            <TabsTrigger value="funis">Funis</TabsTrigger>
            <TabsTrigger value="distribuicao">Distribuição</TabsTrigger>
            <TabsTrigger value="custos">Custos</TabsTrigger>
            <TabsTrigger value="cenarios">Cenários</TabsTrigger>
          </TabsList>

          {/* Tab Metas */}
          <TabsContent value="metas" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Meta Mensal Total</CardTitle>
                <CardDescription>Defina a meta de receita para o mês</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Meta Mensal (R$)</Label>
                  <Input
                    type="number"
                    value={config.metaMensal}
                    onChange={(e) => setConfig({ ...config, metaMensal: parseFloat(e.target.value) || 0 })}
                    className="text-lg font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Meta Diária</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(calculos.metaDiaria)}</p>
                    <p className="text-xs text-muted-foreground">Meta mensal ÷ 30 dias</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Meta Semanal</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(calculos.metaSemanal)}</p>
                    <p className="text-xs text-muted-foreground">Meta mensal ÷ 4 semanas</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Vendas Necessárias</p>
                    <p className="text-2xl font-bold text-primary">{formatNumber(calculos.vendasNecessarias)}</p>
                    <p className="text-xs text-muted-foreground">Ticket médio: {formatCurrency(ticketMedioGeral)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Período</CardTitle>
                <CardDescription>Configure o mês e ano do dashboard</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Mês</Label>
                    <Select
                      value={config.periodo.mes.toString()}
                      onValueChange={(v) => setConfig({ ...config, periodo: { ...config.periodo, mes: parseInt(v) } })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {new Date(2025, i).toLocaleDateString("pt-BR", { month: "long" })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Ano</Label>
                    <Input
                      type="number"
                      value={config.periodo.ano}
                      onChange={(e) => setConfig({ ...config, periodo: { ...config.periodo, ano: parseInt(e.target.value) || 2025 } })}
                    />
                  </div>
                  <div>
                    <Label>Dias Úteis</Label>
                    <Input
                      type="number"
                      value={config.periodo.diasUteis}
                      onChange={(e) => setConfig({ ...config, periodo: { ...config.periodo, diasUteis: parseInt(e.target.value) || 22 } })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Sub-Metas */}
          <TabsContent value="submetas" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Sub-Meta</CardTitle>
                <CardDescription>Crie marcos de progresso para motivar a equipe</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Valor (R$)</Label>
                    <Input
                      type="number"
                      placeholder="100000"
                      id="novaSubMetaValor"
                    />
                  </div>
                  <div>
                    <Label>Cor</Label>
                    <Input
                      type="color"
                      defaultValue="#10b981"
                      id="novaSubMetaCor"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={() => {
                        const valorInput = document.getElementById("novaSubMetaValor") as HTMLInputElement;
                        const corInput = document.getElementById("novaSubMetaCor") as HTMLInputElement;
                        const valor = parseFloat(valorInput.value);
                        if (!valor) {
                          toast.error("Digite o valor da sub-meta");
                          return;
                        }
                        const nova: SubMeta = {
                          id: Date.now().toString(),
                          valor,
                          cor: corInput.value,
                        };
                        setConfig({ ...config, subMetas: [...config.subMetas, nova].sort((a, b) => a.valor - b.valor) });
                        valorInput.value = "";
                        corInput.value = "#10b981";
                        toast.success("Sub-meta adicionada!");
                      }}
                      className="gap-2 w-full"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sub-Metas Configuradas</CardTitle>
                <CardDescription>{config.subMetas.length} sub-metas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {config.subMetas.map((subMeta) => (
                    <div key={subMeta.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div
                        className="w-8 h-8 rounded-full border-2"
                        style={{ backgroundColor: subMeta.cor }}
                      />
                      <div className="flex-1">
                        <Label className="text-xs">Valor</Label>
                        <Input
                          type="number"
                          value={subMeta.valor}
                          onChange={(e) => {
                            const novoValor = parseFloat(e.target.value) || 0;
                            setConfig({
                              ...config,
                              subMetas: config.subMetas
                                .map(sm => (sm.id === subMeta.id ? { ...sm, valor: novoValor } : sm))
                                .sort((a, b) => a.valor - b.valor),
                            });
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs">Cor</Label>
                        <Input
                          type="color"
                          value={subMeta.cor}
                          onChange={(e) => {
                            setConfig({
                              ...config,
                              subMetas: config.subMetas.map(sm =>
                                sm.id === subMeta.id ? { ...sm, cor: e.target.value } : sm
                              ),
                            });
                          }}
                        />
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Valor</p>
                        <p className="text-lg font-bold">{formatCurrency(subMeta.valor)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Remover esta sub-meta?")) {
                            setConfig({ ...config, subMetas: config.subMetas.filter(sm => sm.id !== subMeta.id) });
                            toast.success("Sub-meta removida!");
                          }
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Produtos */}
          <TabsContent value="produtos" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Produto</CardTitle>
                <CardDescription>Cadastre produtos simples (nome + valor + canal)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Nome do Produto</Label>
                    <Input
                      value={novoProduto.nome}
                      onChange={(e) => setNovoProduto({ ...novoProduto, nome: e.target.value })}
                      placeholder="Ex: Creatina Pro 797"
                    />
                  </div>
                  <div>
                    <Label>Valor (R$)</Label>
                    <Input
                      type="number"
                      value={novoProduto.valor}
                      onChange={(e) => setNovoProduto({ ...novoProduto, valor: e.target.value })}
                      placeholder="797"
                    />
                  </div>
                  <div>
                    <Label>Canal</Label>
                    <Select
                      value={novoProduto.canal}
                      onValueChange={(v: any) => setNovoProduto({ ...novoProduto, canal: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="comercial">Comercial</SelectItem>
                        <SelectItem value="ambos">Ambos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={adicionarProduto} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Produto
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Produtos Cadastrados</CardTitle>
                <CardDescription>{config.produtos.length} produtos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {config.produtos.map((produto) => (
                    <div key={produto.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-xs">Nome</Label>
                          <Input
                            value={produto.nome}
                            onChange={(e) => atualizarProduto(produto.id, "nome", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Valor</Label>
                          <Input
                            type="number"
                            value={produto.valor}
                            onChange={(e) => atualizarProduto(produto.id, "valor", parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Canal</Label>
                          <Select
                            value={produto.canal}
                            onValueChange={(v: any) => atualizarProduto(produto.id, "canal", v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="marketing">Marketing</SelectItem>
                              <SelectItem value="comercial">Comercial</SelectItem>
                              <SelectItem value="ambos">Ambos</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removerProduto(produto.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Funis */}
          <TabsContent value="funis" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Criar Novo Funil</CardTitle>
                <CardDescription>Dê um nome ao funil e adicione produtos depois</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label>Nome do Funil</Label>
                    <Input
                      value={novoFunil.nome}
                      onChange={(e) => setNovoFunil({ nome: e.target.value })}
                      placeholder="Ex: Funil Creatina"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={adicionarFunil} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Criar Funil
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {config.funis.map((funil) => (
              <Card key={funil.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {editandoFunil === funil.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={nomeEditado}
                            onChange={(e) => setNomeEditado(e.target.value)}
                            className="w-64"
                            autoFocus
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => editarNomeFunil(funil.id)}
                            className="text-green-500"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditandoFunil(null);
                              setNomeEditado("");
                            }}
                            className="text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <CardTitle>{funil.nome}</CardTitle>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditandoFunil(funil.id);
                              setNomeEditado(funil.nome);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Ticket Médio</p>
                        <p className="text-lg font-bold text-primary">
                          {formatCurrency(calcularTicketMedioFunil(funil))}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removerFunil(funil.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>{funil.produtos.length} produtos no funil</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Adicionar Produto ao Funil */}
                  <div className="border-t pt-4">
                    <Label className="mb-2 block">Adicionar Produto ao Funil</Label>
                    <AdicionarProdutoForm
                      funil={funil}
                      produtos={config.produtos}
                      onAdicionar={(produtoId, tipo, taxaTake) =>
                        adicionarProdutoAoFunil(funil.id, produtoId, tipo, taxaTake)
                      }
                    />
                  </div>

                  {/* Produtos no Funil */}
                  {funil.produtos.length > 0 && (
                    <div className="space-y-3">
                      {funil.produtos
                        .sort((a, b) => {
                          const ordem = { frontend: 0, backend: 1, downsell: 2 };
                          return ordem[a.tipo] - ordem[b.tipo];
                        })
                        .map((produtoNoFunil) => {
                          const produto = config.produtos.find(p => p.id === produtoNoFunil.produtoId);
                          if (!produto) return null;

                          return (
                            <div key={produtoNoFunil.produtoId} className="flex items-start gap-4 p-4 border rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`text-xs font-semibold px-2 py-1 rounded ${getTipoColor(produtoNoFunil.tipo)}`}>
                                    {getTipoLabel(produtoNoFunil.tipo).toUpperCase()}
                                  </span>
                                  <span className="text-sm font-medium">{produto.nome}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {formatCurrency(produto.valor)}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-xs">Tipo no Funil</Label>
                                    <Select
                                      value={produtoNoFunil.tipo}
                                      onValueChange={(v: any) =>
                                        atualizarProdutoNoFunil(funil.id, produtoNoFunil.produtoId, "tipo", v)
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="frontend">Frontend</SelectItem>
                                        <SelectItem value="backend">Backend (Upsell)</SelectItem>
                                        <SelectItem value="downsell">Downsell</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {produtoNoFunil.tipo !== "frontend" && (
                                    <div>
                                      <Label className="text-xs">Taxa de Take (%)</Label>
                                      <Input
                                        type="number"
                                        value={produtoNoFunil.taxaTake}
                                        onChange={(e) =>
                                          atualizarProdutoNoFunil(
                                            funil.id,
                                            produtoNoFunil.produtoId,
                                            "taxaTake",
                                            parseFloat(e.target.value) || 0
                                          )
                                        }
                                        max={100}
                                        min={0}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removerProdutoDoFunil(funil.id, produtoNoFunil.produtoId)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {/* Cálculo do Funil */}
                  {funil.produtos.length > 0 && (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calculator className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold">Cálculo do Ticket Médio</span>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        {funil.produtos
                          .sort((a, b) => {
                            const ordem = { frontend: 0, backend: 1, downsell: 2 };
                            return ordem[a.tipo] - ordem[b.tipo];
                          })
                          .map((pf) => {
                            const produto = config.produtos.find(p => p.id === pf.produtoId);
                            if (!produto) return null;

                            const frontend = funil.produtos.find(p => p.tipo === "frontend");
                            const produtoFrontend = frontend ? config.produtos.find(p => p.id === frontend.produtoId) : null;

                            if (pf.tipo === "frontend") {
                              return <p key={pf.produtoId}>• Valor base: {formatCurrency(produto.valor)}</p>;
                            } else {
                              const diferenca = produtoFrontend ? produto.valor - produtoFrontend.valor : 0;
                              const contribuicao = diferenca * pf.taxaTake / 100;
                              return (
                                <p key={pf.produtoId}>
                                  • {produto.nome}: {formatCurrency(contribuicao)} ({pf.taxaTake}% de take)
                                </p>
                              );
                            }
                          })}
                        <p className="font-semibold text-primary pt-2 border-t">
                          = Ticket Médio: {formatCurrency(calcularTicketMedioFunil(funil))}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Tab Distribuição */}
          <TabsContent value="distribuicao" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição Marketing vs Comercial</CardTitle>
                <CardDescription>Defina o percentual de meta para cada canal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Marketing (%)</Label>
                    <Input
                      type="number"
                      value={config.distribuicao.marketing}
                      onChange={(e) => {
                        const mkt = parseFloat(e.target.value) || 0;
                        setConfig({
                          ...config,
                          distribuicao: { marketing: mkt, comercial: 100 - mkt },
                        });
                      }}
                      max={100}
                      min={0}
                    />
                  </div>
                  <div>
                    <Label>Comercial (%)</Label>
                    <Input
                      type="number"
                      value={config.distribuicao.comercial}
                      onChange={(e) => {
                        const com = parseFloat(e.target.value) || 0;
                        setConfig({
                          ...config,
                          distribuicao: { marketing: 100 - com, comercial: com },
                        });
                      }}
                      max={100}
                      min={0}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Meta Marketing</p>
                    <p className="text-2xl font-bold text-blue-500">{formatCurrency(calculos.metaMarketing)}</p>
                    <p className="text-xs text-muted-foreground">{config.distribuicao.marketing}% da meta total</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Meta Comercial</p>
                    <p className="text-2xl font-bold text-purple-500">{formatCurrency(calculos.metaComercial)}</p>
                    <p className="text-xs text-muted-foreground">{config.distribuicao.comercial}% da meta total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Custos */}
          <TabsContent value="custos" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Custos de Aquisição - Marketing</CardTitle>
                <CardDescription>Configure CPL e CPA para cálculo de orçamento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>CPL - Custo por Lead (R$)</Label>
                    <Input
                      type="number"
                      value={config.custos.cplMarketing}
                      onChange={(e) => setConfig({ ...config, custos: { ...config.custos, cplMarketing: parseFloat(e.target.value) || 0 } })}
                    />
                  </div>
                  <div>
                    <Label>CPA - Custo por Aquisição (R$)</Label>
                    <Input
                      type="number"
                      value={config.custos.cpaMarketing}
                      onChange={(e) => setConfig({ ...config, custos: { ...config.custos, cpaMarketing: parseFloat(e.target.value) || 0 } })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Orçamento Necessário
                    </p>
                    <p className="text-2xl font-bold text-orange-500">{formatCurrency(calculos.orcamentoMarketing())}</p>
                    <p className="text-xs text-muted-foreground">Vendas × CPA</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      ROI Esperado
                    </p>
                    <p className="text-2xl font-bold text-green-500">{calculos.roiEsperado().toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">(Receita - Custo) / Custo</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Lucro Esperado
                    </p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(calculos.metaMarketing - calculos.orcamentoMarketing())}</p>
                    <p className="text-xs text-muted-foreground">Receita - Orçamento</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Cenários */}
          <TabsContent value="cenarios" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Cenários de Projeção</CardTitle>
                <CardDescription>Defina percentuais para diferentes cenários</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label>Conservador (%)</Label>
                    <Input
                      type="number"
                      value={config.cenarios.conservador}
                      onChange={(e) => setConfig({ ...config, cenarios: { ...config.cenarios, conservador: parseFloat(e.target.value) || 0 } })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatCurrency((config.metaMensal * config.cenarios.conservador) / 100)}
                    </p>
                  </div>
                  <div>
                    <Label>Realista (%)</Label>
                    <Input
                      type="number"
                      value={config.cenarios.realista}
                      onChange={(e) => setConfig({ ...config, cenarios: { ...config.cenarios, realista: parseFloat(e.target.value) || 0 } })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatCurrency((config.metaMensal * config.cenarios.realista) / 100)}
                    </p>
                  </div>
                  <div>
                    <Label>Otimista (%)</Label>
                    <Input
                      type="number"
                      value={config.cenarios.otimista}
                      onChange={(e) => setConfig({ ...config, cenarios: { ...config.cenarios, otimista: parseFloat(e.target.value) || 0 } })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatCurrency((config.metaMensal * config.cenarios.otimista) / 100)}
                    </p>
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

// Componente auxiliar para adicionar produto ao funil
function AdicionarProdutoForm({
  funil,
  produtos,
  onAdicionar,
}: {
  funil: Funil;
  produtos: Produto[];
  onAdicionar: (produtoId: string, tipo: "frontend" | "backend" | "downsell", taxaTake: number) => void;
}) {
  const [produtoId, setProdutoId] = useState("");
  const [tipo, setTipo] = useState<"frontend" | "backend" | "downsell">("frontend");
  const [taxaTake, setTaxaTake] = useState("100");

  const handleAdicionar = () => {
    if (!produtoId) {
      toast.error("Selecione um produto");
      return;
    }

    onAdicionar(produtoId, tipo, parseFloat(taxaTake) || 100);
    setProdutoId("");
    setTipo("frontend");
    setTaxaTake("100");
  };

  // Produtos disponíveis (não estão no funil)
  const produtosDisponiveis = produtos.filter(
    p => !funil.produtos.some(fp => fp.produtoId === p.id)
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <Label className="text-xs">Produto</Label>
        <Select value={produtoId} onValueChange={setProdutoId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {produtosDisponiveis.map(p => (
              <SelectItem key={p.id} value={p.id}>
                {p.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs">Tipo</Label>
        <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="frontend">Frontend</SelectItem>
            <SelectItem value="backend">Backend (Upsell)</SelectItem>
            <SelectItem value="downsell">Downsell</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {tipo !== "frontend" && (
        <div>
          <Label className="text-xs">Taxa de Take (%)</Label>
          <Input
            type="number"
            value={taxaTake}
            onChange={(e) => setTaxaTake(e.target.value)}
            max={100}
            min={0}
          />
        </div>
      )}

      <div className="flex items-end">
        <Button onClick={handleAdicionar} className="gap-2 w-full">
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </div>
    </div>
  );
}
