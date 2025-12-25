import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2, Edit2, Check, X } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "./AdminLayout";
import { supabase } from "@/lib/supabase";

interface Funil {
  id: number;
  nome: string;
  url?: string;
  ticket_medio?: number;
  active: number;
  created_at: string;
}

export default function AdminFunis() {
  const [funis, setFunis] = useState<Funil[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editando, setEditando] = useState<number | null>(null);
  
  // Formulário novo funil
  const [novoFunil, setNovoFunil] = useState({
    nome: '',
    url: '',
    ticket_medio: 0,
  });

  // Formulário edição
  const [funilEditado, setFunilEditado] = useState({
    nome: '',
    url: '',
    ticket_medio: 0,
  });

  useEffect(() => {
    loadFunis();
  }, []);

  async function loadFunis() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('funis')
        .select('*')
        .eq('active', 1)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFunis(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar funis:', error);
      toast.error('Erro ao carregar funis: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function criarFunil() {
    if (!novoFunil.nome.trim()) {
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
          ticket_medio: novoFunil.ticket_medio || null,
          active: 1,
        }]);

      if (error) throw error;

      toast.success('Funil criado com sucesso!');
      setNovoFunil({ nome: '', url: '', ticket_medio: 0 });
      await loadFunis();
    } catch (error: any) {
      console.error('Erro ao criar funil:', error);
      toast.error('Erro ao criar funil: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function iniciarEdicao(funil: Funil) {
    setEditando(funil.id);
    setFunilEditado({
      nome: funil.nome,
      url: funil.url || '',
      ticket_medio: funil.ticket_medio || 0,
    });
  }

  async function salvarEdicao(id: number) {
    if (!funilEditado.nome.trim()) {
      toast.error('Nome do funil é obrigatório');
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('funis')
        .update({
          nome: funilEditado.nome,
          url: funilEditado.url || null,
          ticket_medio: funilEditado.ticket_medio || null,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Funil atualizado com sucesso!');
      setEditando(null);
      await loadFunis();
    } catch (error: any) {
      console.error('Erro ao atualizar funil:', error);
      toast.error('Erro ao atualizar funil: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  function cancelarEdicao() {
    setEditando(null);
    setFunilEditado({ nome: '', url: '', ticket_medio: 0 });
  }

  async function deletarFunil(id: number) {
    if (!confirm('Tem certeza que deseja deletar este funil?')) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('funis')
        .update({ active: 0 })
        .eq('id', id);

      if (error) throw error;

      toast.success('Funil deletado com sucesso!');
      await loadFunis();
    } catch (error: any) {
      console.error('Erro ao deletar funil:', error);
      toast.error('Erro ao deletar funil: ' + error.message);
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
          <h2 className="text-3xl font-bold tracking-tight">Gerenciar Funis</h2>
          <p className="text-muted-foreground">
            Configure funis de venda e seus tickets médios
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Criar Novo Funil */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Novo Funil</CardTitle>
              <CardDescription>
                Adicione um novo funil de vendas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Funil *</Label>
                <Input
                  placeholder="Ex: Funil Creatina"
                  value={novoFunil.nome}
                  onChange={(e) => setNovoFunil({ ...novoFunil, nome: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>URL (opcional)</Label>
                <Input
                  placeholder="https://..."
                  value={novoFunil.url}
                  onChange={(e) => setNovoFunil({ ...novoFunil, url: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Ticket Médio (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 1200.00"
                  value={novoFunil.ticket_medio || ''}
                  onChange={(e) => setNovoFunil({ ...novoFunil, ticket_medio: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <Button onClick={criarFunil} disabled={saving} className="w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Criar Funil
              </Button>
            </CardContent>
          </Card>

          {/* Lista de Funis */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Funis Cadastrados</CardTitle>
              <CardDescription>
                {funis.length} funil(is) ativo(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {funis.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum funil cadastrado
                  </p>
                ) : (
                  funis.map((funil) => (
                    <div
                      key={funil.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      {editando === funil.id ? (
                        // Modo Edição
                        <div className="flex-1 space-y-2">
                          <Input
                            value={funilEditado.nome}
                            onChange={(e) => setFunilEditado({ ...funilEditado, nome: e.target.value })}
                            placeholder="Nome do funil"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              value={funilEditado.url}
                              onChange={(e) => setFunilEditado({ ...funilEditado, url: e.target.value })}
                              placeholder="URL"
                            />
                            <Input
                              type="number"
                              step="0.01"
                              value={funilEditado.ticket_medio || ''}
                              onChange={(e) => setFunilEditado({ ...funilEditado, ticket_medio: parseFloat(e.target.value) || 0 })}
                              placeholder="Ticket Médio"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => salvarEdicao(funil.id)}
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
                            <p className="font-medium">{funil.nome}</p>
                            {funil.ticket_medio && (
                              <p className="text-sm text-muted-foreground">
                                Ticket Médio: {formatCurrency(funil.ticket_medio)}
                              </p>
                            )}
                            {funil.url && (
                              <p className="text-xs text-muted-foreground mt-1 truncate">
                                {funil.url}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => iniciarEdicao(funil)}
                              disabled={saving}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deletarFunil(funil.id)}
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
