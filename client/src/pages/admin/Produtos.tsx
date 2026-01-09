import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";

interface Produto {
  id: number;
  name: string;
  price: number;
  channel: string;
  active: number;
  created_at: string;
}

export default function AdminProdutos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Formulário novo produto
  const [novoProduto, setNovoProduto] = useState({
    name: '',
    price: '',
    channel: 'both',
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

  async function adicionarProduto() {
    if (!novoProduto.name || !novoProduto.price) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('products')
        .insert([{
          name: novoProduto.name,
          price: parseFloat(novoProduto.price),
          channel: novoProduto.channel,
          type: 'produto', // Campo obrigatório
          url: null,
          active: 1,
        }]);

      if (error) throw error;

      toast.success('Produto adicionado!');
      setNovoProduto({ name: '', price: '', channel: 'both' });
      await loadProdutos();
    } catch (error: any) {
      console.error('Erro ao criar produto:', error);
      toast.error('Erro ao criar produto: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function atualizarProduto(id: number, campo: keyof Produto, valor: any) {
    try {
      const { error } = await supabase
        .from('products')
        .update({ [campo]: valor })
        .eq('id', id);

      if (error) throw error;

      // Atualizar estado local
      setProdutos(produtos.map(p => p.id === id ? { ...p, [campo]: valor } : p));
    } catch (error: any) {
      console.error('Erro ao atualizar produto:', error);
      toast.error('Erro ao atualizar produto: ' + error.message);
    }
  }

  async function removerProduto(id: number) {
    // TODO: Verificar se produto está em algum funil antes de remover

    if (!confirm('Tem certeza que deseja remover este produto?')) {
      return;
    }

    try {
      // Soft delete
      const { error } = await supabase
        .from('products')
        .update({ active: 0 })
        .eq('id', id);

      if (error) throw error;

      toast.success('Produto removido!');
      await loadProdutos();
    } catch (error: any) {
      console.error('Erro ao remover produto:', error);
      toast.error('Erro ao remover produto: ' + error.message);
    }
  }

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando produtos...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Produtos</h2>
          <p className="text-muted-foreground">
            Gerencie o catálogo de produtos
          </p>
        </div>

        {/* Adicionar Produto */}
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
                  value={novoProduto.name}
                  onChange={(e) => setNovoProduto({ ...novoProduto, name: e.target.value })}
                  placeholder="Ex: Creatina Pro 797"
                />
              </div>
              <div>
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  value={novoProduto.price}
                  onChange={(e) => setNovoProduto({ ...novoProduto, price: e.target.value })}
                  placeholder="797"
                />
              </div>
              <div>
                <Label>Canal</Label>
                <Select
                  value={novoProduto.channel}
                  onValueChange={(v) => setNovoProduto({ ...novoProduto, channel: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="comercial">Comercial</SelectItem>
                    <SelectItem value="both">Ambos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={adicionarProduto} disabled={saving} className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Produto
            </Button>
          </CardContent>
        </Card>

        {/* Lista de Produtos */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos Cadastrados</CardTitle>
            <CardDescription>{produtos.length} produtos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {produtos.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum produto cadastrado ainda
                </p>
              ) : (
                produtos.map((produto) => (
                  <div key={produto.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs">Nome</Label>
                        <Input
                          value={produto.name}
                          onChange={(e) => atualizarProduto(produto.id, "name", e.target.value)}
                          onBlur={() => toast.success('Produto atualizado!')}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Valor</Label>
                        <Input
                          type="number"
                          value={produto.price}
                          onChange={(e) => atualizarProduto(produto.id, "price", parseFloat(e.target.value) || 0)}
                          onBlur={() => toast.success('Produto atualizado!')}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Canal</Label>
                        <Select
                          value={produto.channel}
                          onValueChange={(v) => {
                            atualizarProduto(produto.id, "channel", v);
                            toast.success('Produto atualizado!');
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="comercial">Comercial</SelectItem>
                            <SelectItem value="both">Ambos</SelectItem>
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
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
