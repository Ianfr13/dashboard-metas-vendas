import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2, Save, Edit, X } from "lucide-react";
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
  grande_premio?: string;
  percentual_marketing?: number;
  percentual_comercial?: number;
}

interface SubMeta {
  id: number;
  meta_principal_id: number;
  valor: number;
  atingida: number;
  premio?: string;
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
    grande_premio: '',
    percentual_marketing: 85,
    percentual_comercial: 15,
  });

  // Formulário nova sub-meta
  const [novaSubMeta, setNovaSubMeta] = useState({
    valor: 0,
    premio: '',
  });

  const [metaSelecionada, setMetaSelecionada] = useState<number | null>(null);
  
  // Estados de edição
  const [editandoMeta, setEditandoMeta] = useState<number | null>(null);
  const [editandoSubMeta, setEditandoSubMeta] = useState<number | null>(null);
  const [metaEditada, setMetaEditada] = useState<Partial<Meta>>({});
  const [subMetaEditada, setSubMetaEditada] = useState<Partial<SubMeta>>({});

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
          grande_premio: novaMeta.grande_premio || null,
          percentual_marketing: novaMeta.percentual_marketing,
          percentual_comercial: novaMeta.percentual_comercial,
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Meta criada com sucesso!');
      setNovaMeta({
        mes: new Date().getMonth() + 1,
        ano: new Date().getFullYear(),
        valor_meta: 0,
        grande_premio: '',
        percentual_marketing: 85,
        percentual_comercial: 15,
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
          premio: novaSubMeta.premio || null,
        }]);

      if (error) throw error;

      toast.success('Sub-meta criada com sucesso!');
      setNovaSubMeta({ valor: 0, premio: '' });
      await loadSubMetas(metaSelecionada);
    } catch (error: any) {
      console.error('Erro ao criar sub-meta:', error);
      toast.error('Erro ao criar sub-meta: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function atualizarMeta() {
    if (!editandoMeta) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('metas_principais')
        .update({
          mes: metaEditada.mes,
          ano: metaEditada.ano,
          valor_meta: metaEditada.valor_meta,
          grande_premio: metaEditada.grande_premio || null,
          percentual_marketing: metaEditada.percentual_marketing,
          percentual_comercial: metaEditada.percentual_comercial,
        })
        .eq('id', editandoMeta);

      if (error) throw error;

      toast.success('Meta atualizada com sucesso!');
      setEditandoMeta(null);
      setMetaEditada({});
      await loadMetas();
    } catch (error: any) {
      console.error('Erro ao atualizar meta:', error);
      toast.error('Erro ao atualizar meta: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function atualizarSubMeta() {
    if (!editandoSubMeta) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('sub_metas')
        .update({
          valor: subMetaEditada.valor,
          premio: subMetaEditada.premio || null,
        })
        .eq('id', editandoSubMeta);

      if (error) throw error;

      toast.success('Sub-meta atualizada com sucesso!');
      setEditandoSubMeta(null);
      setSubMetaEditada({});
      if (metaSelecionada) {
        await loadSubMetas(metaSelecionada);
      }
    } catch (error: any) {
      console.error('Erro ao atualizar sub-meta:', error);
      toast.error('Erro ao atualizar sub-meta: ' + error.message);
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
              <div className="space-y-2">
                <Label>Grande Prêmio 🏆</Label>
                <Input
                  type="text"
                  placeholder="Ex: Viagem para Dubai"
                  value={novaMeta.grande_premio}
                  onChange={(e) => setNovaMeta({ ...novaMeta, grande_premio: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>% Marketing</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={novaMeta.percentual_marketing}
                    onChange={(e) => {
                      const parsed = parseInt(e.target.value, 10);
                      const marketing = isNaN(parsed) ? 0 : Math.max(0, Math.min(100, parsed));
                      const comercial = Math.max(0, Math.min(100, 100 - marketing));
                      setNovaMeta({ 
                        ...novaMeta, 
                        percentual_marketing: marketing,
                        percentual_comercial: comercial
                      });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>% Comercial</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={novaMeta.percentual_comercial}
                    onChange={(e) => {
                      const parsed = parseInt(e.target.value, 10);
                      const comercial = isNaN(parsed) ? 0 : Math.max(0, Math.min(100, parsed));
                      const marketing = Math.max(0, Math.min(100, 100 - comercial));
                      setNovaMeta({ 
                        ...novaMeta, 
                        percentual_comercial: comercial,
                        percentual_marketing: marketing
                      });
                    }}
                  />
                </div>
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
                      <div className="flex-1">
                        {editandoMeta === meta.id ? (
                          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                            <div className="grid grid-cols-2 gap-2">
                              <select
                                className="px-2 py-1 border rounded text-sm"
                                value={metaEditada.mes}
                                onChange={(e) => setMetaEditada({ ...metaEditada, mes: parseInt(e.target.value) })}
                              >
                                {mesesNomes.map((nome, idx) => (
                                  <option key={idx} value={idx + 1}>{nome}</option>
                                ))}
                              </select>
                              <Input
                                type="number"
                                className="text-sm"
                                value={metaEditada.ano}
                                onChange={(e) => setMetaEditada({ ...metaEditada, ano: parseInt(e.target.value) })}
                              />
                            </div>
                            <Input
                              type="number"
                              className="text-sm"
                              placeholder="Valor"
                              value={metaEditada.valor_meta}
                              onChange={(e) => setMetaEditada({ ...metaEditada, valor_meta: parseFloat(e.target.value) })}
                            />
                            <Input
                              type="text"
                              className="text-sm"
                              placeholder="Grande Prêmio"
                              value={metaEditada.grande_premio || ''}
                              onChange={(e) => setMetaEditada({ ...metaEditada, grande_premio: e.target.value })}
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                type="number"
                                className="text-sm"
                                placeholder="% Marketing"
                                min="0"
                                max="100"
                                value={metaEditada.percentual_marketing || 85}
                                onChange={(e) => {
                                  const parsed = parseInt(e.target.value, 10);
                                  const marketing = isNaN(parsed) ? 0 : Math.max(0, Math.min(100, parsed));
                                  const comercial = Math.max(0, Math.min(100, 100 - marketing));
                                  setMetaEditada({ 
                                    ...metaEditada, 
                                    percentual_marketing: marketing,
                                    percentual_comercial: comercial
                                  });
                                }}
                              />
                              <Input
                                type="number"
                                className="text-sm"
                                placeholder="% Comercial"
                                min="0"
                                max="100"
                                value={metaEditada.percentual_comercial || 15}
                                onChange={(e) => {
                                  const parsed = parseInt(e.target.value, 10);
                                  const comercial = isNaN(parsed) ? 0 : Math.max(0, Math.min(100, parsed));
                                  const marketing = Math.max(0, Math.min(100, 100 - comercial));
                                  setMetaEditada({ 
                                    ...metaEditada, 
                                    percentual_comercial: comercial,
                                    percentual_marketing: marketing
                                  });
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium">
                              {mesesNomes[meta.mes - 1]} {meta.ano}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(meta.valor_meta)}
                            </p>
                            {meta.grande_premio && (
                              <p className="text-xs text-muted-foreground">
                                🏆 {meta.grande_premio}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              📊 {meta.percentual_marketing || 85}% Marketing | {meta.percentual_comercial || 15}% Comercial
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {editandoMeta === meta.id ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                atualizarMeta();
                              }}
                              disabled={saving}
                            >
                              <Save className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditandoMeta(null);
                                setMetaEditada({});
                              }}
                              disabled={saving}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditandoMeta(meta.id);
                              setMetaEditada(meta);
                            }}
                            disabled={saving}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
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
                    onChange={(e) => setNovaSubMeta({ ...novaSubMeta, valor: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prêmio 🎁</Label>
                  <Input
                    type="text"
                    placeholder="Ex: Jantar no restaurante"
                    value={novaSubMeta.premio}
                    onChange={(e) => setNovaSubMeta({ ...novaSubMeta, premio: e.target.value })}
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
                        <div className="flex-1">
                          {editandoSubMeta === subMeta.id ? (
                            <div className="space-y-2">
                              <Input
                                type="number"
                                className="text-sm"
                                placeholder="Valor"
                                value={subMetaEditada.valor}
                                onChange={(e) => setSubMetaEditada({ ...subMetaEditada, valor: parseFloat(e.target.value) })}
                              />
                              <Input
                                type="text"
                                className="text-sm"
                                placeholder="Prêmio"
                                value={subMetaEditada.premio || ''}
                                onChange={(e) => setSubMetaEditada({ ...subMetaEditada, premio: e.target.value })}
                              />
                            </div>
                          ) : (
                            <div>
                              <p className="font-medium">
                                {formatCurrency(subMeta.valor)}
                              </p>
                              {subMeta.premio && (
                                <p className="text-xs text-muted-foreground">
                                  🎁 {subMeta.premio}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {subMeta.atingida ? '✓ Atingida' : 'Pendente'}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {editandoSubMeta === subMeta.id ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => atualizarSubMeta()}
                                disabled={saving}
                              >
                                <Save className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditandoSubMeta(null);
                                  setSubMetaEditada({});
                                }}
                                disabled={saving}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditandoSubMeta(subMeta.id);
                                setSubMetaEditada(subMeta);
                              }}
                              disabled={saving}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deletarSubMeta(subMeta.id)}
                            disabled={saving}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
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
