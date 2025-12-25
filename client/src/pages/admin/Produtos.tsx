import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2, Edit2, Check, X } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "./AdminLayout";
import { supabase } from "@/lib/supabase";

interface Produto {
  id: number;
  name: string;
  price: number;
  type: string;
  channel: string;
  url?: string;
  active: number;
  created_at: string;
}

export default function AdminProdutos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editando, setEditando] = useState<number | null>(null);
  
  // Formulário novo produto
  const [novoProduto, setNovoProduto] = useState({
    name: '',
    price: 0,
    type: 'produto',
    channel: 'marketing',
    url: '',
  });

  // Formulário edição
  const [produtoEditado, setProdutoEditado] = useState({
    name: '',
    price: 0,
    type: 'produto',
    channel: 'marketing',
    url: '',
  });

  useEffect(() => {
    loadProdutos();
  }, []);

  async function loadProdutos() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', 1)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProdutos(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function criarProduto() {
    if (!novoProduto.name.trim()) {
      toast.error('Nome do produto é obrigatório');
      return;
    }

    if (novoProduto.price <= 0) {
      toast.error('Preço deve ser maior que zero');
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('products')
        .insert([{
          name: novoProduto.name,
          price: novoProduto.price,
          type: novoProduto.type,
          channel: novoProduto.channel,
          url: novoProduto.url || null,
          active: 1,
        }]);

      if (error) throw error;

      toast.success('Produto criado com sucesso!');
      setNovoProduto({ name: '', price: 0, type: 'produto', channel: 'marketing', url: '' });
      await loadProdutos();
    } catch (error: any) {
      console.error('Erro ao criar produto:', error);
      toast.error('Erro ao criar produto: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function iniciarEdicao(produto: Produto) {
    setEditando(produto.id);
    setProdutoEditado({
      name: produto.name,
      price: produto.price,
      type: produto.type,
      channel: produto.channel,
      url: produto.url || '',
    });
  }

  async function salvarEdicao(id: number) {
    if (!produtoEditado.name.trim()) {
      toast.error('Nome do produto é obrigatório');
      return;
    }

    if (produtoEditado.price <= 0) {
      toast.error('Preço deve ser maior que zero');
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('products')
        .update({
          name: produtoEditado.name,
          price: produtoEditado.price,
          type: produtoEditado.type,
          channel: produtoEditado.channel,
          url: produtoEditado.url || null,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Produto atualizado com sucesso!');
      setEditando(null);
      await loadProdutos();
    } catch (error: any) {
      console.error('Erro ao atualizar produto:', error);
      toast.error('Erro ao atualizar produto: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  function cancelarEdicao() {
    setEditando(null);
    setProdutoEditado({ name: '', price: 0, type: 'produto', channel: 'marketing', url: '' });
  }

  async function deletarProduto(id: number) {
    if (!confirm('Tem certeza que deseja deletar este produto?')) return;

    try {
      setSaving(true);

      // Soft delete
      const { error } = await supabase
        .from('products')
        .update({ active: 0 })
        .eq('id', id);

      if (error) throw error;

      toast.success('Produto deletado com sucesso!');
      await loadProdutos();
    } catch (error: any) {
      console.error('Erro ao deletar produto:', error);
      toast.error('Erro ao deletar produto: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gerenciar Produtos</h2>
          <p className="text-muted-foreground">
            Cadastre e gerencie produtos do catálogo
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Criar Novo Produto */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Novo Produto</CardTitle>
              <CardDescription>
                Adicione um novo produto ao catálogo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Produto *</Label>
                <Input
                  placeholder="Ex: Creatina Pro 797"
                  value={novoProduto.name}
                  onChange={(e) => setNovoProduto({ ...novoProduto, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Preço (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 797.00"
                  value={novoProduto.price || ''}
                  onChange={(e) => setNovoProduto({ ...novoProduto, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={novoProduto.type}
                  onChange={(e) => setNovoProduto({ ...novoProduto, type: e.target.value })}
                >
                  <option value="produto">Produto</option>
                  <option value="servico">Serviço</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Canal</Label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={novoProduto.channel}
                  onChange={(e) => setNovoProduto({ ...novoProduto, channel: e.target.value })}
                >
                  <option value="marketing">Marketing</option>
                  <option value="comercial">Comercial</option>
                  <option value="ambos">Ambos</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>URL (opcional)</Label>
                <Input
                  placeholder="https://..."
                  value={novoProduto.url}
                  onChange={(e) => setNovoProduto({ ...novoProduto, url: e.target.value })}
                />
              </div>
              <Button onClick={criarProduto} disabled={saving} className="w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Criar Produto
              </Button>
            </CardContent>
          </Card>

          {/* Lista de Produtos */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Produtos Cadastrados</CardTitle>
              <CardDescription>
                {produtos.length} produto(s) ativo(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {produtos.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum produto cadastrado
                  </p>
                ) : (
                  produtos.map((produto) => (
                    <div
                      key={produto.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      {editando === produto.id ? (
                        // Modo Edição
                        <div className="flex-1 space-y-2">
                          <Input
                            value={produtoEditado.name}
                            onChange={(e) => setProdutoEditado({ ...produtoEditado, name: e.target.value })}
                            placeholder="Nome do produto"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={produtoEditado.price || ''}
                              onChange={(e) => setProdutoEditado({ ...produtoEditado, price: parseFloat(e.target.value) || 0 })}
                              placeholder="Preço"
                            />
                            <Input
                              value={produtoEditado.description}
                              onChange={(e) => setProdutoEditado({ ...produtoEditado, description: e.target.value })}
                              placeholder="Descrição"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => salvarEdicao(produto.id)}
                              disabled={saving}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Salvar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelarEdicao}
                              disabled={saving}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // Modo Visualização
                        <>
                          <div className="flex-1">
                            <p className="font-medium">{produto.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(produto.price)}
                            </p>
                            {produto.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {produto.description}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => iniciarEdicao(produto)}
                              disabled={saving}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deletarProduto(produto.id)}
                              disabled={saving}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
