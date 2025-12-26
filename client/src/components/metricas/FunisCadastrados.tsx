import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingUp, Users, ShoppingCart, DollarSign, ArrowRight, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";

interface Funil {
  id: number;
  nome: string;
  url: string | null;
  active: number;
}

interface ProdutoMetrics {
  produto: string;
  tipo: string;
  ordem: number;
  vendas: number;
  receita: number;
  taxaConversao: number;
}

interface FunnelMetrics {
  funil: {
    id: number;
    nome: string;
    url: string | null;
  };
  metricas_gerais: {
    visualizacoes: number;
    leads: number;
    checkouts: number;
  };
  produtos: ProdutoMetrics[];
  totais: {
    vendasTotais: number;
    receitaTotal: number;
    ticketMedio: number;
  };
}

interface FunisCadastradosProps {
  startDate: Date;
  endDate: Date;
}

export default function FunisCadastrados({ startDate, endDate }: FunisCadastradosProps) {
  const [funis, setFunis] = useState<Funil[]>([]);
  const [selectedFunilId, setSelectedFunilId] = useState<number | null>(null);
  const [metrics, setMetrics] = useState<FunnelMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingFunis, setLoadingFunis] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar lista de funis
  useEffect(() => {
    async function loadFunis() {
      try {
        setLoadingFunis(true);
        const { data, error } = await supabase
          .from('funis')
          .select('id, nome, url, active')
          .eq('active', 1)
          .order('nome');

        if (error) throw error;

        setFunis(data || []);
        
        // Selecionar primeiro funil automaticamente
        if (data && data.length > 0) {
          setSelectedFunilId(data[0].id);
        }
      } catch (err) {
        console.error('Erro ao carregar funis:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar funis');
      } finally {
        setLoadingFunis(false);
      }
    }

    loadFunis();
  }, []);

  // Carregar métricas do funil selecionado
  useEffect(() => {
    async function loadMetrics() {
      if (!selectedFunilId) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-funnel-metrics?funnel_id=${selectedFunilId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
          {
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            }
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao carregar métricas');
        }

        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        console.error('Erro ao carregar métricas do funil:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar métricas');
      } finally {
        setLoading(false);
      }
    }

    loadMetrics();
  }, [selectedFunilId, startDate, endDate]);

  if (loadingFunis) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando funis...</p>
        </div>
      </div>
    );
  }

  if (funis.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nenhum funil cadastrado</CardTitle>
          <CardDescription>
            Cadastre funis na página de administração para visualizar métricas detalhadas.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Explicação da Lógica */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Como funciona o cálculo de conversão</AlertTitle>
        <AlertDescription>
          <p className="mb-2">
            <strong>Lógica em Cascata:</strong> Cada produto do funil calcula sua taxa de conversão baseado no produto IMEDIATAMENTE ANTERIOR.
          </p>
          <p className="text-sm">
            <strong>Exemplo:</strong> Frontend (100 vendas) → Upsell 1 (30 vendas = 30%) → Upsell 2 (15 vendas = 50% dos 30) → Downsell (10 vendas = 66.67% dos 15 que não compraram Upsell 2)
          </p>
          <p className="text-sm mt-2 text-muted-foreground">
            💡 O funil pode ter quantos produtos quiser, sempre seguindo essa lógica de cascata.
          </p>
        </AlertDescription>
      </Alert>

      {/* Seletor de Funil */}
      <Card>
        <CardHeader>
          <CardTitle>Selecionar Funil</CardTitle>
          <CardDescription>
            Escolha um funil para visualizar métricas detalhadas de conversão por etapa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedFunilId?.toString() || ''}
            onValueChange={(value) => setSelectedFunilId(parseInt(value))}
          >
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Selecione um funil" />
            </SelectTrigger>
            <SelectContent>
              {funis.map((funil) => (
                <SelectItem key={funil.id} value={funil.id.toString()}>
                  {funil.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Carregando métricas...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Erro ao carregar métricas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Métricas */}
      {metrics && !loading && !error && (
        <>
          {/* Cards de Totais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Vendas Totais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  <span className="text-3xl font-bold">{metrics.totais.vendasTotais}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Receita Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="text-3xl font-bold">
                    R$ {metrics.totais.receitaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ticket Médio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span className="text-3xl font-bold">
                    R$ {metrics.totais.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Métricas Gerais (Frontend) */}
          <Card>
            <CardHeader>
              <CardTitle>Métricas Gerais do Funil</CardTitle>
              <CardDescription>Dados de entrada do funil</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Visualizações</p>
                  <p className="text-2xl font-bold">{metrics.metricas_gerais.visualizacoes.toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Leads</p>
                  <p className="text-2xl font-bold">{metrics.metricas_gerais.leads.toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Checkouts</p>
                  <p className="text-2xl font-bold">{metrics.metricas_gerais.checkouts.toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Produtos do Funil (Dinâmico) */}
          {metrics.produtos.map((produto, index) => {
            const isFirst = index === 0;
            const produtoAnterior = index > 0 ? metrics.produtos[index - 1] : null;
            
            return (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {!isFirst && <ArrowRight className="h-5 w-5" />}
                    Etapa {produto.ordem}: {produto.produto}
                  </CardTitle>
                  <CardDescription>
                    {isFirst 
                      ? 'Produto principal (frontend) - Base do funil'
                      : `Conversão baseada em ${produtoAnterior?.vendas} vendas de "${produtoAnterior?.produto}"`
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Vendas</p>
                      <p className="text-2xl font-bold text-green-600">{produto.vendas}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Receita</p>
                      <p className="text-2xl font-bold text-green-600">
                        R$ {produto.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {isFirst ? 'Taxa de Conversão' : 'Taxa de Take'}
                      </p>
                      <p className="text-2xl font-bold text-blue-600">{produto.taxaConversao.toFixed(2)}%</p>
                      {!isFirst && produtoAnterior && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {produto.vendas} de {produtoAnterior.vendas} compraram
                        </p>
                      )}
                      {isFirst && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {produto.vendas} de {metrics.metricas_gerais.visualizacoes} visualizações
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Fluxo Visual */}
          <Card>
            <CardHeader>
              <CardTitle>Fluxo de Conversão</CardTitle>
              <CardDescription>Visualização do caminho do cliente através do funil</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 py-6 flex-wrap">
                {/* Visualizações */}
                <div className="text-center">
                  <div className="bg-blue-100 text-blue-700 rounded-lg p-4 mb-2">
                    <Users className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{metrics.metricas_gerais.visualizacoes.toLocaleString('pt-BR')}</p>
                    <p className="text-sm">Visualizações</p>
                  </div>
                </div>

                {/* Produtos (Dinâmico) */}
                {metrics.produtos.map((produto, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90 md:rotate-0" />
                    <div className="text-center">
                      <div className={`rounded-lg p-4 mb-2 ${
                        index === 0 ? 'bg-green-100 text-green-700' :
                        index % 3 === 1 ? 'bg-purple-100 text-purple-700' :
                        index % 3 === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-pink-100 text-pink-700'
                      }`}>
                        <ShoppingCart className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{produto.vendas}</p>
                        <p className="text-sm">{produto.produto}</p>
                        <p className="text-xs text-muted-foreground mt-1">{produto.taxaConversao.toFixed(2)}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
