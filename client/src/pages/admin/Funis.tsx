import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit2, Check, X, Calculator } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";

interface Produto {
  id: number;
  name: string;
  price: number;
  channel: string;
}

interface ProdutoNoFunil {
  id: number;
  funil_id: number;
  produto_id: number;
  tipo: 'frontend' | 'backend' | 'downsell';
  ordem: number;
  produto?: Produto;
}

interface Funil {
  id: number;
  nome: string;
  url?: string;
  ticket_medio?: number;
  active: number;
  created_at: string;
  produtos?: ProdutoNoFunil[];
}

// Taxas de take padrão (calculadas automaticamente)
const TAXAS_PADRAO = {
  backend: 30, // 30% dos clientes fazem upsell
  downsell: 20, // 20% dos clientes fazem downsell
};

export default function AdminFunis() {
  const [funis, setFunis] = useState<Funil[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editandoFunil, setEditandoFunil] = useState<number | null>(null);
  const [nomeEditado, setNomeEditado] = useState("");
  
  // Formulário novo funil
  const [novoFunil, setNovoFunil] = useState({
    nome: '',
    url: '',
  });

  // Formulário adicionar produto ao funil
  const [adicionandoProduto, setAdicionandoProduto] = useState<number | null>(null);
  const [novoProdutoFunil, setNovoProdutoFunil] = useState({
    produto_id: '',
    tipo: 'frontend' as 'frontend' | 'backend' | 'downsell',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      
      // Carregar produtos
      const { data: produtosData, error: produtosError } = await supabase
        .from('products')
        .select('*')
        .eq('active', 1)
        .order('name');

      if (produtosError) throw produtosError;
      setProdutos(produtosData || []);

      // Carregar funis
      await loadFunis();
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadFunis() {
    try {
      const { data: funisData, error: funisError } = await supabase
        .from('funis')
        .select('*')
        .eq('active', 1)
        .order('created_at', { ascending: false });

      if (funisError) throw funisError;

      // Para cada funil, carregar seus produtos
      const funisComProdutos = await Promise.all(
        (funisData || []).map(async (funil) => {
          const { data: produtosFunil, error } = await supabase
            .from('produtos_funil')
            .select(`
              *,
              produto:products(*)
            `)
            .eq('funil_id', funil.id)
            .order('ordem');

          if (error) {
            console.error('Erro ao carregar produtos do funil:', error);
            return { ...funil, produtos: [] };
          }

          return {
            ...funil,
            produtos: produtosFunil || [],
          };
        })
      );

      setFunis(funisComProdutos);
    } catch (error: any) {
      console.error('Erro ao carregar funis:', error);
      toast.error('Erro ao carregar funis: ' + error.message);
    }
  }

  async function adicionarFunil() {
    if (!novoFunil.nome) {
      toast.error('Nome do funil é obrigatório');
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('funis')
        .insert([{
          nome: novoFunil.nome,
          url: novoFunil.url || null,
          ticket_medio: 0,
          active: 1,
        }]);

      if (error) throw error;

      toast.success('Funil criado!');
      setNovoFunil({ nome: '', url: '' });
      await loadFunis();
    } catch (error: any) {
      console.error('Erro ao criar funil:', error);
      toast.error('Erro ao criar funil: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function editarNomeFunil(id: number) {
    if (!nomeEditado.trim()) {
      toast.error('Nome não pode ser vazio');
      return;
    }

    try {
      const { error } = await supabase
        .from('funis')
        .update({ nome: nomeEditado })
        .eq('id', id);

      if (error) throw error;

      toast.success('Nome atualizado!');
      setEditandoFunil(null);
      setNomeEditado('');
      await loadFunis();
    } catch (error: any) {
      console.error('Erro ao atualizar funil:', error);
      toast.error('Erro ao atualizar funil: ' + error.message);
    }
  }

  async function atualizarUrlFunil(id: number, url: string) {
    try {
      const { error } = await supabase
        .from('funis')
        .update({ url: url || null })
        .eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      console.error('Erro ao atualizar URL:', error);
      toast.error('Erro ao atualizar URL: ' + error.message);
    }
  }

  async function removerFunil(id: number) {
    if (!confirm('Tem certeza que deseja remover este funil?')) {
      return;
    }

    try {
      // Soft delete (CASCADE vai remover produtos_funil automaticamente)
      const { error } = await supabase
        .from('funis')
        .update({ active: 0 })
        .eq('id', id);

      if (error) throw error;

      toast.success('Funil removido!');
      await loadFunis();
    } catch (error: any) {
      console.error('Erro ao remover funil:', error);
      toast.error('Erro ao remover funil: ' + error.message);
    }
  }

  async function adicionarProdutoAoFunil(funilId: number) {
    if (!novoProdutoFunil.produto_id) {
      toast.error('Selecione um produto');
      return;
    }

    try {
      setSaving(true);

      // Verificar se já existe frontend
      const funil = funis.find(f => f.id === funilId);
      const jaTemFrontend = funil?.produtos?.some(p => p.tipo === 'frontend');

      if (novoProdutoFunil.tipo === 'frontend' && jaTemFrontend) {
        toast.error('Funil já tem um produto frontend');
        return;
      }

      // Calcular ordem
      const ordem = funil?.produtos?.length || 0;

      const { error } = await supabase
        .from('produtos_funil')
        .insert([{
          funil_id: funilId,
          produto_id: parseInt(novoProdutoFunil.produto_id),
          tipo: novoProdutoFunil.tipo,
          ordem,
        }]);

      if (error) throw error;

      toast.success('Produto adicionado ao funil!');
      setAdicionandoProduto(null);
      setNovoProdutoFunil({ produto_id: '', tipo: 'frontend' });
      await loadFunis();
      await atualizarTicketMedio(funilId);
    } catch (error: any) {
      console.error('Erro ao adicionar produto:', error);
      toast.error('Erro ao adicionar produto: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function removerProdutoDoFunil(funilId: number, produtoFunilId: number) {
    try {
      const { error } = await supabase
        .from('produtos_funil')
        .delete()
        .eq('id', produtoFunilId);

      if (error) throw error;

      toast.success('Produto removido do funil!');
      await loadFunis();
      await atualizarTicketMedio(funilId);
    } catch (error: any) {
      console.error('Erro ao remover produto:', error);
      toast.error('Erro ao remover produto: ' + error.message);
    }
  }

  async function atualizarTipoProduto(funilId: number, produtoFunilId: number, novoTipo: string) {
    try {
      const { error } = await supabase
        .from('produtos_funil')
        .update({ tipo: novoTipo })
        .eq('id', produtoFunilId);

      if (error) throw error;

      toast.success('Tipo atualizado!');
      await loadFunis();
      await atualizarTicketMedio(funilId);
    } catch (error: any) {
      console.error('Erro ao atualizar tipo:', error);
      toast.error('Erro ao atualizar tipo: ' + error.message);
    }
  }

  async function atualizarTicketMedio(funilId: number) {
    const funil = funis.find(f => f.id === funilId);
    if (!funil || !funil.produtos) return;

    const ticketMedio = calcularTicketMedioFunil(funil);

    try {
      const { error } = await supabase
        .from('funis')
        .update({ ticket_medio: ticketMedio })
        .eq('id', funilId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Erro ao atualizar ticket médio:', error);
    }
  }

  function calcularTicketMedioFunil(funil: Funil): number {
    if (!funil.produtos || funil.produtos.length === 0) return 0;

    const frontend = funil.produtos.find(p => p.tipo === 'frontend');
    if (!frontend || !frontend.produto) return 0;

    let ticketMedio = frontend.produto.price;

    // Adicionar backends (upsells)
    funil.produtos
      .filter(p => p.tipo === 'backend' && p.produto)
      .forEach(backend => {
        if (backend.produto) {
          ticketMedio += backend.produto.price * (TAXAS_PADRAO.backend / 100);
        }
      });

    // Adicionar downsells
    funil.produtos
      .filter(p => p.tipo === 'downsell' && p.produto)
      .forEach(downsell => {
        if (downsell.produto) {
          ticketMedio += downsell.produto.price * (TAXAS_PADRAO.downsell / 100);
        }
      });

    return Math.round(ticketMedio * 100) / 100;
  }

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  function getTipoLabel(tipo: string): string {
    const labels: Record<string, string> = {
      frontend: 'Frontend',
      backend: 'Backend (Upsell)',
      downsell: 'Downsell',
    };
    return labels[tipo] || tipo;
  }

  function getTipoColor(tipo: string): string {
    const colors: Record<string, string> = {
      frontend: 'bg-blue-100 text-blue-800',
      backend: 'bg-green-100 text-green-800',
      downsell: 'bg-yellow-100 text-yellow-800',
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando funis...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Funis de Venda</h2>
          <p className="text-muted-foreground">
            Gerencie funis com produtos frontend, backend (upsell) e downsell
          </p>
        </div>

        {/* Criar Novo Funil */}
        <Card>
          <CardHeader>
            <CardTitle>Criar Novo Funil</CardTitle>
            <CardDescription>Dê um nome ao funil e adicione produtos depois</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nome do Funil</Label>
                <Input
                  value={novoFunil.nome}
                  onChange={(e) => setNovoFunil({ ...novoFunil, nome: e.target.value })}
                  placeholder="Ex: Funil Creatina"
                />
              </div>
              <div>
                <Label>URL da Página de Checkout</Label>
                <Input
                  value={novoFunil.url}
                  onChange={(e) => setNovoFunil({ ...novoFunil, url: e.target.value })}
                  placeholder="Ex: /checkout/creatina ou https://..."
                />
              </div>
            </div>
            <Button onClick={adicionarFunil} disabled={saving} className="gap-2">
              <Plus className="h-4 w-4" />
              Criar Funil
            </Button>
          </CardContent>
        </Card>

        {/* Lista de Funis */}
        {funis.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                Nenhum funil cadastrado ainda
              </p>
            </CardContent>
          </Card>
        ) : (
          funis.map((funil) => (
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
                <CardDescription>
                  {funil.produtos?.length || 0} produtos no funil
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* URL do Funil */}
                <div>
                  <Label className="text-xs">URL da Página de Checkout</Label>
                  <Input
                    value={funil.url || ""}
                    onChange={(e) => atualizarUrlFunil(funil.id, e.target.value)}
                    onBlur={() => toast.success('URL atualizada!')}
                    placeholder="Ex: /checkout/creatina ou https://..."
                  />
                </div>

                {/* Produtos no Funil */}
                {funil.produtos && funil.produtos.length > 0 && (
                  <div className="space-y-3">
                    {funil.produtos
                      .sort((a, b) => a.ordem - b.ordem)
                      .map((produtoNoFunil) => {
                        if (!produtoNoFunil.produto) return null;

                        return (
                          <div key={produtoNoFunil.id} className="flex items-start gap-4 p-4 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs font-semibold px-2 py-1 rounded ${getTipoColor(produtoNoFunil.tipo)}`}>
                                  {getTipoLabel(produtoNoFunil.tipo).toUpperCase()}
                                </span>
                                <span className="text-sm font-medium">{produtoNoFunil.produto.name}</span>
                                <span className="text-sm text-muted-foreground">
                                  {formatCurrency(produtoNoFunil.produto.price)}
                                </span>
                              </div>

                              <div>
                                <Label className="text-xs">Tipo no Funil</Label>
                                <Select
                                  value={produtoNoFunil.tipo}
                                  onValueChange={(v) => atualizarTipoProduto(funil.id, produtoNoFunil.id, v)}
                                >
                                  <SelectTrigger className="w-48">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="frontend">Frontend</SelectItem>
                                    <SelectItem value="backend">Backend (Upsell)</SelectItem>
                                    <SelectItem value="downsell">Downsell</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removerProdutoDoFunil(funil.id, produtoNoFunil.id)}
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
                {funil.produtos && funil.produtos.length > 0 && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calculator className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">Cálculo do Ticket Médio (Automático)</span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      {funil.produtos
                        .sort((a, b) => a.ordem - b.ordem)
                        .map((pf) => {
                          if (!pf.produto) return null;

                          if (pf.tipo === 'frontend') {
                            return (
                              <p key={pf.id}>
                                • Frontend: {formatCurrency(pf.produto.price)} (100%)
                              </p>
                            );
                          } else if (pf.tipo === 'backend') {
                            return (
                              <p key={pf.id}>
                                • Backend: {formatCurrency(pf.produto.price)} × {TAXAS_PADRAO.backend}% = {formatCurrency(pf.produto.price * TAXAS_PADRAO.backend / 100)}
                              </p>
                            );
                          } else if (pf.tipo === 'downsell') {
                            return (
                              <p key={pf.id}>
                                • Downsell: {formatCurrency(pf.produto.price)} × {TAXAS_PADRAO.downsell}% = {formatCurrency(pf.produto.price * TAXAS_PADRAO.downsell / 100)}
                              </p>
                            );
                          }
                          return null;
                        })}
                      <p className="font-semibold text-primary pt-2">
                        = Ticket Médio: {formatCurrency(calcularTicketMedioFunil(funil))}
                      </p>
                    </div>
                  </div>
                )}

                {/* Adicionar Produto ao Funil */}
                <div className="border-t pt-4">
                  {adicionandoProduto === funil.id ? (
                    <div className="space-y-4">
                      <Label>Adicionar Produto ao Funil</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs">Produto</Label>
                          <Select
                            value={novoProdutoFunil.produto_id}
                            onValueChange={(v) => setNovoProdutoFunil({ ...novoProdutoFunil, produto_id: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um produto" />
                            </SelectTrigger>
                            <SelectContent>
                              {produtos
                                .filter(p => !funil.produtos?.some(fp => fp.produto_id === p.id))
                                .map(produto => (
                                  <SelectItem key={produto.id} value={produto.id.toString()}>
                                    {produto.name} - {formatCurrency(produto.price)}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Tipo</Label>
                          <Select
                            value={novoProdutoFunil.tipo}
                            onValueChange={(v: any) => setNovoProdutoFunil({ ...novoProdutoFunil, tipo: v })}
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
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => adicionarProdutoAoFunil(funil.id)} disabled={saving}>
                          Adicionar
                        </Button>
                        <Button variant="outline" onClick={() => {
                          setAdicionandoProduto(null);
                          setNovoProdutoFunil({ produto_id: '', tipo: 'frontend' });
                        }}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setAdicionandoProduto(funil.id)}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar Produto
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
