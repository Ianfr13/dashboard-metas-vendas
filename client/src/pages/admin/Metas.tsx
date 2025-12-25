import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";

interface Meta {
  id: number;
  mes: number;
  ano: number;
  valor_meta: number;
  valor_atual: number;
  active: number;
}

interface SubMeta {
  id: number;
  meta_principal_id: number;
  valor: number;
  atingida: number;
}

export default function AdminMetas() {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [subMetas, setSubMetas] = useState<SubMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Formulário nova meta
  const [novaMeta, setNovaMeta] = useState({
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    valor_meta: 0,
  });

  // Formulário nova sub-meta
  const [novaSubMeta, setNovaSubMeta] = useState({
    valor: 0,
  });

  const [metaSelecionada, setMetaSelecionada] = useState<number | null>(null);

  // Carregar metas
  useEffect(() => {
    loadMetas();
  }, []);

  // Carregar sub-metas quando selecionar uma meta
  useEffect(() => {
    if (metaSelecionada) {
      loadSubMetas(metaSelecionada);
    }
  }, [metaSelecionada]);

  async function loadMetas() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('metas_principais')
        .select('*')
        .eq('active', 1)
        .order('ano', { ascending: false })
        .order('mes', { ascending: false });

      if (error) throw error;

      setMetas(data || []);
      
      // Selecionar a primeira meta automaticamente
      if (data && data.length > 0 && !metaSelecionada) {
        setMetaSelecionada(data[0].id);
      }
    } catch (error: any) {
      console.error('Erro ao carregar metas:', error);
      toast.error('Erro ao carregar metas: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadSubMetas(metaId: number) {
    try {
      const { data, error } = await supabase
        .from('sub_metas')
        .select('*')
        .eq('meta_principal_id', metaId)
        .order('valor', { ascending: true });

      if (error) throw error;

      setSubMetas(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar sub-metas:', error);
      toast.error('Erro ao carregar sub-metas: ' + error.message);
    }
  }

  async function criarMeta() {
    if (novaMeta.valor_meta <= 0) {
      toast.error('Valor da meta deve ser maior que zero');
      return;
    }

    try {
      setSaving(true);

      const { data, error } = await supabase
        .from('metas_principais')
        .insert([{
          mes: novaMeta.mes,
          ano: novaMeta.ano,
          valor_meta: novaMeta.valor_meta,
          valor_atual: 0,
          active: 1,
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Meta criada com sucesso!');
      setNovaMeta({
        mes: new Date().getMonth() + 1,
        ano: new Date().getFullYear(),
        valor_meta: 0,
      });
      
      await loadMetas();
      setMetaSelecionada(data.id);
    } catch (error: any) {
      console.error('Erro ao criar meta:', error);
      toast.error('Erro ao criar meta: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function deletarMeta(id: number) {
    if (!confirm('Tem certeza que deseja deletar esta meta?')) return;

    try {
      setSaving(true);

      // Deletar sub-metas primeiro
      await supabase.from('sub_metas').delete().eq('meta_principal_id', id);

      // Deletar meta
      const { error } = await supabase
        .from('metas_principais')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Meta deletada com sucesso!');
      
      if (metaSelecionada === id) {
        setMetaSelecionada(null);
        setSubMetas([]);
      }
      
      await loadMetas();
    } catch (error: any) {
      console.error('Erro ao deletar meta:', error);
      toast.error('Erro ao deletar meta: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function criarSubMeta() {
    if (!metaSelecionada) {
      toast.error('Selecione uma meta primeiro');
      return;
    }

    if (novaSubMeta.valor <= 0) {
      toast.error('Valor da sub-meta deve ser maior que zero');
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('sub_metas')
        .insert([{
          meta_principal_id: metaSelecionada,
          valor: novaSubMeta.valor,
          atingida: 0,
        }]);

      if (error) throw error;

      toast.success('Sub-meta criada com sucesso!');
      setNovaSubMeta({ valor: 0 });
      await loadSubMetas(metaSelecionada);
    } catch (error: any) {
      console.error('Erro ao criar sub-meta:', error);
      toast.error('Erro ao criar sub-meta: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function deletarSubMeta(id: number) {
    if (!confirm('Tem certeza que deseja deletar esta sub-meta?')) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('sub_metas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Sub-meta deletada com sucesso!');
      
      if (metaSelecionada) {
        await loadSubMetas(metaSelecionada);
      }
    } catch (error: any) {
      console.error('Erro ao deletar sub-meta:', error);
      toast.error('Erro ao deletar sub-meta: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const mesesNomes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gerenciar Metas</h2>
          <p className="text-muted-foreground">
            Configure metas mensais e sub-metas de progresso
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Criar Nova Meta */}
          <Card>
            <CardHeader>
              <CardTitle>Nova Meta Mensal</CardTitle>
              <CardDescription>
                Crie uma meta para um mês específico
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mês</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={novaMeta.mes}
                    onChange={(e) => setNovaMeta({ ...novaMeta, mes: parseInt(e.target.value) })}
                  >
                    {mesesNomes.map((nome, idx) => (
                      <option key={idx} value={idx + 1}>{nome}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Ano</Label>
                  <Input
                    type="number"
                    value={novaMeta.ano}
                    onChange={(e) => setNovaMeta({ ...novaMeta, ano: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Valor da Meta (R$)</Label>
                <Input
                  type="number"
                  placeholder="Ex: 3000000"
                  value={novaMeta.valor_meta || ''}
                  onChange={(e) => setNovaMeta({ ...novaMeta, valor_meta: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <Button onClick={criarMeta} disabled={saving} className="w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Criar Meta
              </Button>
            </CardContent>
          </Card>

          {/* Lista de Metas */}
          <Card>
            <CardHeader>
              <CardTitle>Metas Cadastradas</CardTitle>
              <CardDescription>
                {metas.length} meta(s) ativa(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {metas.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhuma meta cadastrada
                  </p>
                ) : (
                  metas.map((meta) => (
                    <div
                      key={meta.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        metaSelecionada === meta.id ? 'bg-accent border-primary' : 'hover:bg-accent'
                      }`}
                      onClick={() => setMetaSelecionada(meta.id)}
                    >
                      <div>
                        <p className="font-medium">
                          {mesesNomes[meta.mes - 1]} {meta.ano}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(meta.valor_meta)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          deletarMeta(meta.id);
                        }}
                        disabled={saving}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sub-Metas */}
        {metaSelecionada && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Criar Nova Sub-Meta */}
            <Card>
              <CardHeader>
                <CardTitle>Nova Sub-Meta</CardTitle>
                <CardDescription>
                  Adicione marcos de progresso para a meta selecionada
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Valor da Sub-Meta (R$)</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 100000"
                    value={novaSubMeta.valor || ''}
                    onChange={(e) => setNovaSubMeta({ valor: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <Button onClick={criarSubMeta} disabled={saving} className="w-full">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Adicionar Sub-Meta
                </Button>
              </CardContent>
            </Card>

            {/* Lista de Sub-Metas */}
            <Card>
              <CardHeader>
                <CardTitle>Sub-Metas</CardTitle>
                <CardDescription>
                  {subMetas.length} sub-meta(s) cadastrada(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {subMetas.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhuma sub-meta cadastrada
                    </p>
                  ) : (
                    subMetas.map((subMeta) => (
                      <div
                        key={subMeta.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div>
                          <p className="font-medium">
                            {formatCurrency(subMeta.valor)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {subMeta.atingida ? '✓ Atingida' : 'Pendente'}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deletarSubMeta(subMeta.id)}
                          disabled={saving}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
