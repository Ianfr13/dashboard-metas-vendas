import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

export default function Admin() {
  const [mainGoal, setMainGoal] = useState("5000000");
  const [subGoals, setSubGoals] = useState<string[]>([
    "100000",
    "200000",
    "300000",
    "500000",
    "1000000",
    "1500000",
    "2000000",
    "3000000",
  ]);
  const [newSubGoal, setNewSubGoal] = useState("");

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return "R$ 0";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const addSubGoal = () => {
    if (!newSubGoal || isNaN(parseFloat(newSubGoal))) {
      toast.error("Digite um valor válido");
      return;
    }
    
    const value = parseFloat(newSubGoal);
    if (subGoals.includes(newSubGoal)) {
      toast.error("Esta sub-meta já existe");
      return;
    }

    setSubGoals([...subGoals, newSubGoal].sort((a, b) => parseFloat(a) - parseFloat(b)));
    setNewSubGoal("");
    toast.success("Sub-meta adicionada!");
  };

  const removeSubGoal = (index: number) => {
    setSubGoals(subGoals.filter((_, i) => i !== index));
    toast.success("Sub-meta removida!");
  };

  const createGoal = trpc.goals.create.useMutation({
    onSuccess: () => {
      toast.success("Configuração salva com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar configuração");
      console.error(error);
    },
  });

  const saveConfiguration = async () => {
    try {
      await createGoal.mutateAsync({
        name: "Meta Principal",
        scenario: "3M",
        period: "monthly",
        targetRevenue: mainGoal,
        targetSales: 0,
        targetMarketingSales: 0,
        targetCommercialSales: 0,
        startDate: new Date(),
        endDate: new Date(new Date().getFullYear(), 11, 31),
        subGoals: JSON.stringify(subGoals.map(sg => ({ value: parseFloat(sg), completed: false }))),
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/logo-douravita.png"
                alt="DouraVita"
                className="h-10 w-auto drop-shadow-lg"
              />
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Configuração de Metas
                </h1>
                <p className="text-sm text-muted-foreground">
                  Defina sua meta principal e sub-metas
                </p>
              </div>
            </div>
            <Button asChild variant="outline">
              <a href="/">← Voltar ao Dashboard</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Meta Principal */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                Meta Principal
              </CardTitle>
              <CardDescription>
                Defina o valor total que deseja atingir no período
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mainGoal">Valor da Meta</Label>
                <div className="flex gap-2">
                  <Input
                    id="mainGoal"
                    type="number"
                    value={mainGoal}
                    onChange={(e) => setMainGoal(e.target.value)}
                    placeholder="5000000"
                    className="text-lg font-semibold"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(mainGoal)}
                </p>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-medium text-foreground">
                  Visualização
                </p>
                <p className="text-3xl font-bold text-primary mt-2">
                  {formatCurrency(mainGoal)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Este será o valor exibido no gauge do dashboard
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Sub-metas */}
          <Card className="border-2 border-secondary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                Sub-metas
              </CardTitle>
              <CardDescription>
                Crie marcos intermediários para acompanhar o progresso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newSubGoal">Adicionar Nova Sub-meta</Label>
                <div className="flex gap-2">
                  <Input
                    id="newSubGoal"
                    type="number"
                    value={newSubGoal}
                    onChange={(e) => setNewSubGoal(e.target.value)}
                    placeholder="100000"
                    onKeyDown={(e) => e.key === "Enter" && addSubGoal()}
                  />
                  <Button onClick={addSubGoal} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {subGoals.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhuma sub-meta configurada
                  </p>
                ) : (
                  subGoals.map((goal, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-border bg-card p-3 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-foreground">
                          {formatCurrency(goal)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSubGoal(index)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
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

        {/* Preview */}
        <Card className="mt-6 border-2 border-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">👁️</span>
              Pré-visualização
            </CardTitle>
            <CardDescription>
              Como as sub-metas aparecerão no dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {subGoals.map((goal, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card p-3"
                >
                  <div className="h-2 w-2 rounded-full bg-cyan-500" />
                  <span className="font-medium text-foreground">
                    {formatCurrency(goal)}
                  </span>
                </div>
              ))}
            </div>
            {subGoals.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Adicione sub-metas para ver a pré-visualização
              </p>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <Button
            onClick={saveConfiguration}
            size="lg"
            className="gap-2"
          >
            <Save className="h-5 w-5" />
            Salvar Configuração
          </Button>
        </div>
      </main>
    </div>
  );
}
