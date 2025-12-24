import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function AdminGoalsPanel() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
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

  const { data: goals, refetch } = trpc.goals.list.useQuery();
  const createGoal = trpc.goals.create.useMutation({
    onSuccess: () => {
      toast.success("Meta criada com sucesso!");
      refetch();
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao criar meta: ${error.message}`);
    },
  });

  const deleteGoal = trpc.goals.delete.useMutation({
    onSuccess: () => {
      toast.success("Meta excluída com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao excluir meta: ${error.message}`);
    },
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createGoal.mutate({
      name: formData.name,
      scenario: formData.scenario,
      period: formData.period,
      targetRevenue: formData.targetRevenue,
      targetSales: parseInt(formData.targetSales),
      targetMarketingSales: parseInt(formData.targetMarketingSales),
      targetCommercialSales: parseInt(formData.targetCommercialSales),
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta meta?")) {
      deleteGoal.mutate({ id });
    }
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(parseFloat(value));
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-[#00a67d]">Painel Administrativo</h2>
          <p className="text-muted-foreground mt-1">Configure e gerencie suas metas de vendas</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#00a67d] hover:bg-[#008f6c]">
              <Plus className="w-4 h-4 mr-2" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Nova Meta</DialogTitle>
              <DialogDescription>
                Configure uma nova meta de vendas com todos os detalhes
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
                    placeholder="Ex: Meta Janeiro 2025"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="scenario">Cenário</Label>
                  <Select
                    value={formData.scenario}
                    onValueChange={(value: "3M" | "4M" | "5M") => setFormData({ ...formData, scenario: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3M">R$ 3.000.000</SelectItem>
                      <SelectItem value="4M">R$ 4.000.000</SelectItem>
                      <SelectItem value="5M">R$ 5.000.000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="period">Período</Label>
                  <Select
                    value={formData.period}
                    onValueChange={(value: "monthly" | "weekly" | "daily") => setFormData({ ...formData, period: value })}
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
                    value={formData.targetRevenue}
                    onChange={(e) => setFormData({ ...formData, targetRevenue: e.target.value })}
                    placeholder="3000000"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetSales">Total de Vendas</Label>
                  <Input
                    id="targetSales"
                    type="number"
                    value={formData.targetSales}
                    onChange={(e) => setFormData({ ...formData, targetSales: e.target.value })}
                    placeholder="3000"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="targetMarketingSales">Vendas Marketing</Label>
                  <Input
                    id="targetMarketingSales"
                    type="number"
                    value={formData.targetMarketingSales}
                    onChange={(e) => setFormData({ ...formData, targetMarketingSales: e.target.value })}
                    placeholder="2550"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="targetCommercialSales">Vendas Comercial</Label>
                  <Input
                    id="targetCommercialSales"
                    type="number"
                    value={formData.targetCommercialSales}
                    onChange={(e) => setFormData({ ...formData, targetCommercialSales: e.target.value })}
                    placeholder="450"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-[#00a67d] hover:bg-[#008f6c]">
                  Criar Meta
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Metas */}
      <div className="grid gap-4">
        {goals?.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground text-center">
                Nenhuma meta configurada ainda.
                <br />
                Clique em "Nova Meta" para começar.
              </p>
            </CardContent>
          </Card>
        )}
        
        {goals?.map((goal) => (
          <Card key={goal.id} className="border-l-4 border-l-[#00a67d]">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{goal.name}</CardTitle>
                  <CardDescription>
                    {goal.period === "monthly" && "Meta Mensal"}
                    {goal.period === "weekly" && "Meta Semanal"}
                    {goal.period === "daily" && "Meta Diária"}
                    {" • "}
                    {formatDate(goal.startDate)} até {formatDate(goal.endDate)}
                  </CardDescription>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="text-[#418ecb] hover:text-[#3a7db5]">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => handleDelete(goal.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Receita Alvo</p>
                  <p className="text-lg font-semibold text-[#00a67d]">
                    {formatCurrency(goal.targetRevenue)}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Total Vendas</p>
                  <p className="text-lg font-semibold">{goal.targetSales}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Marketing</p>
                  <p className="text-lg font-semibold text-[#418ecb]">{goal.targetMarketingSales}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Comercial</p>
                  <p className="text-lg font-semibold text-[#5a4b99]">{goal.targetCommercialSales}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
