import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

interface Goal {
  id: number;
  user_id: number;
  name: string;
  scenario: "3M" | "4M" | "5M";
  period: "monthly" | "weekly" | "daily";
  target_revenue: string;
  target_sales: number;
  target_marketing_sales: number;
  target_commercial_sales: number;
  start_date: string;
  end_date: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export default function AdminGoalsPanel() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    scenario: "3M" as "3M" | "4M" | "5M",
    period: "monthly" as "monthly" | "weekly" | "daily",
    targetRevenue: "",
    targetSales: "",
    targetMarketingSales: "",
    targetCommercialSales: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar metas:', error);
      toast.error(`Erro ao carregar metas: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      scenario: "3M",
      period: "monthly",
      targetRevenue: "",
      targetSales: "",
      targetMarketingSales: "",
      targetCommercialSales: "",
      startDate: "",
      endDate: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      const { error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          name: formData.name,
          scenario: formData.scenario,
          period: formData.period,
          target_revenue: formData.targetRevenue,
          target_sales: parseInt(formData.targetSales),
          target_marketing_sales: parseInt(formData.targetMarketingSales),
          target_commercial_sales: parseInt(formData.targetCommercialSales),
          start_date: new Date(formData.startDate).toISOString(),
          end_date: new Date(formData.endDate).toISOString(),
        });

      if (error) throw error;

      toast.success("Meta criada com sucesso!");
      await loadGoals();
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Erro ao criar meta:', error);
      toast.error(`Erro ao criar meta: ${error.message}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta meta?")) {
      return;
    }

    try {
      // Deletar sub-metas primeiro
      const { error: subGoalsError } = await supabase
        .from('sub_goals')
        .delete()
        .eq('goal_id', id);

      if (subGoalsError) throw subGoalsError;

      // Deletar meta
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Meta excluída com sucesso!");
      await loadGoals();
    } catch (error: any) {
      console.error('Erro ao excluir meta:', error);
      toast.error(`Erro ao excluir meta: ${error.message}`);
    }
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(parseFloat(value));
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-[#00a67d]">Painel Administrativo</h2>
          <p className="text-muted-foreground mt-1">Gerencie suas metas e objetivos</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Nova Meta</DialogTitle>
              <DialogDescription>
                Preencha os dados da nova meta de vendas
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Meta</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scenario">Cenário</Label>
                  <Select
                    value={formData.scenario}
                    onValueChange={(value: "3M" | "4M" | "5M") =>
                      setFormData({ ...formData, scenario: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3M">3 Milhões</SelectItem>
                      <SelectItem value="4M">4 Milhões</SelectItem>
                      <SelectItem value="5M">5 Milhões</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="period">Período</Label>
                  <Select
                    value={formData.period}
                    onValueChange={(value: "monthly" | "weekly" | "daily") =>
                      setFormData({ ...formData, period: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="daily">Diário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetRevenue">Receita Alvo (R$)</Label>
                  <Input
                    id="targetRevenue"
                    type="number"
                    step="0.01"
                    value={formData.targetRevenue}
                    onChange={(e) => setFormData({ ...formData, targetRevenue: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetSales">Vendas Alvo</Label>
                  <Input
                    id="targetSales"
                    type="number"
                    value={formData.targetSales}
                    onChange={(e) => setFormData({ ...formData, targetSales: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetMarketingSales">Vendas Marketing</Label>
                  <Input
                    id="targetMarketingSales"
                    type="number"
                    value={formData.targetMarketingSales}
                    onChange={(e) =>
                      setFormData({ ...formData, targetMarketingSales: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetCommercialSales">Vendas Comercial</Label>
                  <Input
                    id="targetCommercialSales"
                    type="number"
                    value={formData.targetCommercialSales}
                    onChange={(e) =>
                      setFormData({ ...formData, targetCommercialSales: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Data Início</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Data Fim</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Criar Meta</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Nenhuma meta cadastrada. Clique em "Nova Meta" para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {goals.map((goal) => (
            <Card key={goal.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{goal.name}</CardTitle>
                    <CardDescription>
                      {goal.scenario} • {goal.period === "monthly" ? "Mensal" : goal.period === "weekly" ? "Semanal" : "Diário"}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(goal.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Receita Alvo</p>
                    <p className="text-lg font-semibold">{formatCurrency(goal.target_revenue)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vendas Alvo</p>
                    <p className="text-lg font-semibold">{goal.target_sales}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Período</p>
                    <p className="text-lg font-semibold">
                      {formatDate(goal.start_date)} - {formatDate(goal.end_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="text-lg font-semibold">
                      {goal.is_active ? "Ativa" : "Inativa"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
