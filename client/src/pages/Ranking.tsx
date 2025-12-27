import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Trophy, Loader2 } from "lucide-react";
import { rankingAPI } from "@/lib/ranking-api";
import TopThreeCards from "@/components/ranking/TopThreeCards";
import RankingTable from "@/components/ranking/RankingTable";
import { Link } from "wouter";

export default function Ranking() {
  const [selectedRole, setSelectedRole] = useState<'sdr' | 'closer' | 'auto_prospeccao'>('sdr');
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [rankings, setRankings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gerar lista de meses (últimos 6 meses)
  const getMonthOptions = () => {
    const months = [];
    const today = new Date();
    for (let i = 0; i < 6; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const value = date.toISOString().slice(0, 7);
      const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      months.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
    return months;
  };

  const monthOptions = getMonthOptions();

  // Carregar rankings
  const loadRankings = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await rankingAPI.getRankings({
        role: selectedRole,
        month: selectedMonth
      });

      setRankings(data);
    } catch (err) {
      console.error('Erro ao carregar rankings:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar rankings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRankings();
  }, [selectedRole, selectedMonth]);

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ranking do Time</h1>
            <p className="text-muted-foreground">
              Desempenho dos SDRs, Closers e Auto Prospecção
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={loadRankings}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>

            <Button variant="outline" asChild>
              <Link to="/ranking/hall-of-fame">
                <Trophy className="mr-2 h-4 w-4" />
                Hall of Fame
              </Link>
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Erro ao carregar dados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button onClick={loadRankings} className="mt-4">
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}

        {/* Rankings */}
        {!loading && !error && rankings && (
          <>
            {/* Tabs */}
            <Tabs value={selectedRole} onValueChange={(value) => setSelectedRole(value as any)}>
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="sdr">SDRs</TabsTrigger>
                <TabsTrigger value="closer">Closers</TabsTrigger>
                <TabsTrigger value="auto_prospeccao">Auto Prospecção</TabsTrigger>
              </TabsList>

              <TabsContent value={selectedRole} className="space-y-6 mt-6">
                {/* Top 3 Cards */}
                {rankings.rankings && rankings.rankings.length > 0 && (
                  <TopThreeCards rankings={rankings.rankings} />
                )}

                {/* Ranking Table */}
                {rankings.rankings && rankings.rankings.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        Ranking Completo - {selectedRole === 'sdr' ? 'SDRs' : selectedRole === 'closer' ? 'Closers' : 'Auto Prospecção'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RankingTable rankings={rankings.rankings} role={selectedRole} />
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      Nenhum ranking disponível para este período
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            {/* Period Info */}
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center">
                  Dados do mês:{" "}
                  <span className="font-medium">
                    {monthOptions.find(m => m.value === selectedMonth)?.label}
                  </span>
                  {" • "}
                  Total de {rankings.total} {selectedRole === 'sdr' ? 'SDRs' : selectedRole === 'closer' ? 'Closers' : 'Auto Prospecção'}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
