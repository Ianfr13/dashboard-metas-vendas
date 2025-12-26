import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingUp, Users, ShoppingCart, DollarSign, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Funil {
  id: number;
  nome: string;
  url: string | null;
  active: number;
}

interface FunnelMetrics {
  funil: {
    id: number;
    nome: string;
    url: string | null;
  };
  frontend: {
    produto: string;
    visualizacoes: number;
    leads: number;
    checkouts: number;
    vendas: number;
    receita: number;
    taxaConversao: number;
  };
  backend: {
    produto: string;
    ofertas: number;
    vendas: number;
    receita: number;
    taxaTake: number;
  } | null;
  downsell: {
    produto: string;
    ofertas: number;
    vendas: number;
    receita: number;
    taxaTake: number;
  } | null;
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
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-funnel-by-id-metrics?funnel_id=${selectedFunilId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
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

          {/* Métricas Frontend */}
          <Card>
            <CardHeader>
              <CardTitle>Frontend - {metrics.frontend.produto}</CardTitle>
              <CardDescription>Produto principal do funil</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Visualizações</p>
                  <p className="text-2xl font-bold">{metrics.frontend.visualizacoes.toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Leads</p>
                  <p className="text-2xl font-bold">{metrics.frontend.leads.toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Checkouts</p>
                  <p className="text-2xl font-bold">{metrics.frontend.checkouts.toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Vendas</p>
                  <p className="text-2xl font-bold text-green-600">{metrics.frontend.vendas}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Receita</p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {metrics.frontend.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Conversão</p>
                  <p className="text-2xl font-bold text-blue-600">{metrics.frontend.taxaConversao.toFixed(2)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Métricas Backend */}
          {metrics.backend && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRight className="h-5 w-5" />
                  Backend (Upsell) - {metrics.backend.produto}
                </CardTitle>
                <CardDescription>30% das vendas frontend recebem oferta de upsell</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Ofertas</p>
                    <p className="text-2xl font-bold">{metrics.backend.ofertas}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Vendas</p>
                    <p className="text-2xl font-bold text-green-600">{metrics.backend.vendas}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Receita</p>
                    <p className="text-2xl font-bold text-green-600">
                      R$ {metrics.backend.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Taxa de Take</p>
                    <p className="text-2xl font-bold text-blue-600">{metrics.backend.taxaTake.toFixed(2)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Métricas Downsell */}
          {metrics.downsell && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRight className="h-5 w-5" />
                  Downsell - {metrics.downsell.produto}
                </CardTitle>
                <CardDescription>20% dos que não compraram backend recebem oferta de downsell</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Ofertas</p>
                    <p className="text-2xl font-bold">{metrics.downsell.ofertas}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Vendas</p>
                    <p className="text-2xl font-bold text-green-600">{metrics.downsell.vendas}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Receita</p>
                    <p className="text-2xl font-bold text-green-600">
                      R$ {metrics.downsell.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Taxa de Take</p>
                    <p className="text-2xl font-bold text-blue-600">{metrics.downsell.taxaTake.toFixed(2)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fluxo Visual */}
          <Card>
            <CardHeader>
              <CardTitle>Fluxo de Conversão</CardTitle>
              <CardDescription>Visualização do caminho do cliente através do funil</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 py-6">
                <div className="text-center">
                  <div className="bg-blue-100 text-blue-700 rounded-lg p-4 mb-2">
                    <Users className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{metrics.frontend.visualizacoes.toLocaleString('pt-BR')}</p>
                    <p className="text-sm">Visualizações</p>
                  </div>
                </div>

                <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90 md:rotate-0" />

                <div className="text-center">
                  <div className="bg-green-100 text-green-700 rounded-lg p-4 mb-2">
                    <ShoppingCart className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{metrics.frontend.vendas}</p>
                    <p className="text-sm">Vendas Frontend</p>
                    <p className="text-xs text-muted-foreground mt-1">{metrics.frontend.taxaConversao.toFixed(2)}%</p>
                  </div>
                </div>

                {metrics.backend && (
                  <>
                    <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90 md:rotate-0" />
                    <div className="text-center">
                      <div className="bg-purple-100 text-purple-700 rounded-lg p-4 mb-2">
                        <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{metrics.backend.vendas}</p>
                        <p className="text-sm">Vendas Backend</p>
                        <p className="text-xs text-muted-foreground mt-1">{metrics.backend.taxaTake.toFixed(2)}%</p>
                      </div>
                    </div>
                  </>
                )}

                {metrics.downsell && (
                  <>
                    <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90 md:rotate-0" />
                    <div className="text-center">
                      <div className="bg-orange-100 text-orange-700 rounded-lg p-4 mb-2">
                        <DollarSign className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{metrics.downsell.vendas}</p>
                        <p className="text-sm">Vendas Downsell</p>
                        <p className="text-xs text-muted-foreground mt-1">{metrics.downsell.taxaTake.toFixed(2)}%</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
