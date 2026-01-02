import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Check } from "lucide-react";

interface SubGoal {
  value: number;
  completed: boolean;
}

interface GoalManagerProps {
  mainGoal: number;
  subGoals: SubGoal[];
  onSave: (mainGoal: number, subGoals: SubGoal[]) => void;
}

export function GoalManager({ mainGoal: initialMainGoal, subGoals: initialSubGoals, onSave }: GoalManagerProps) {
  const [mainGoal, setMainGoal] = useState(initialMainGoal);
  const [subGoals, setSubGoals] = useState<SubGoal[]>(initialSubGoals);
  const [newSubGoalValue, setNewSubGoalValue] = useState("");

  const addSubGoal = () => {
    const value = parseFloat(newSubGoalValue);
    if (isNaN(value) || value <= 0) return;

    setSubGoals([...subGoals, { value, completed: false }].sort((a, b) => a.value - b.value));
    setNewSubGoalValue("");
  };

  const removeSubGoal = (index: number) => {
    setSubGoals(subGoals.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave(mainGoal, subGoals);
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000 || 0).toFixed(1)}M`;
    }
    return `R$ ${(value / 1000 || 0).toFixed(0)}k`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Meta Principal e Sub-metas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Meta Principal */}
        <div className="space-y-2">
          <Label htmlFor="mainGoal">Meta Principal (R$)</Label>
          <Input
            id="mainGoal"
            type="number"
            value={mainGoal}
            onChange={(e) => setMainGoal(parseFloat(e.target.value) || 0)}
            placeholder="Ex: 5000000"
          />
          <p className="text-sm text-muted-foreground">
            {formatCurrency(mainGoal)}
          </p>
        </div>

        {/* Sub-metas */}
        <div className="space-y-4">
          <div>
            <Label>Sub-metas</Label>
            <p className="text-sm text-muted-foreground">
              Defina marcos intermediários para acompanhar o progresso
            </p>
          </div>

          {/* Lista de Sub-metas */}
          <div className="space-y-2">
            {subGoals.map((subGoal, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {subGoal.completed ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-primary" />
                  )}
                  <span className={subGoal.completed ? "line-through text-muted-foreground" : ""}>
                    {formatCurrency(subGoal.value)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSubGoal(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Adicionar Nova Sub-meta */}
          <div className="flex gap-2">
            <Input
              type="number"
              value={newSubGoalValue}
              onChange={(e) => setNewSubGoalValue(e.target.value)}
              placeholder="Ex: 100000"
            />
            <Button onClick={addSubGoal}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </div>

        {/* Botão Salvar */}
        <Button onClick={handleSave} className="w-full">
          Salvar Configurações
        </Button>
      </CardContent>
    </Card>
  );
}
