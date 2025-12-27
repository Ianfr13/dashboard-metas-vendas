import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Crown, Trophy, Loader2 } from "lucide-react";
import { rankingAPI } from "@/lib/ranking-api";
import BadgeIcon from "@/components/ranking/BadgeIcon";
import { Link } from "wouter";

export default function HallOfFame() {
  const [champions, setChampions] = useState<any>(null);
  const [history, setHistory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHallOfFame() {
      try {
        setLoading(true);
        setError(null);

        // Buscar campeões do mês atual
        const currentMonth = new Date().toISOString().slice(0, 7);
        const championsData = await rankingAPI.getRankings({
          role: 'all',
          month: currentMonth
        });

        // Buscar histórico dos últimos 6 meses
        const historyData = await rankingAPI.getRankings({
          role: 'all',
          months: 6
        });

        setChampions(championsData);
        setHistory(historyData);
      } catch (err) {
        console.error('Erro ao carregar Hall of Fame:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    }

    loadHallOfFame();
  }, []);

  const getRoleLabel = (role: string) => {
    if (role === 'sdr') return 'SDR';
    if (role === 'closer') return 'Closer';
    if (role === 'auto_prospeccao') return 'Auto Prospecção';
    return role;
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link to="/ranking">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Trophy className="h-8 w-8 text-yellow-500" />
              Hall of Fame
            </h1>
            <p className="text-muted-foreground">
              Os maiores campeões do time
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Erro ao carregar dados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Campeões do Mês Atual */}
        {!loading && !error && champions && champions.champions && (
          <>
            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 border-2 border-yellow-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Crown className="h-6 w-6 text-yellow-500" />
                  Campeões do Mês Atual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.entries(champions.champions).map(([role, champion]: [string, any]) => (
                    <Card key={role} className="border-2">
                      <CardHeader>
                        <CardTitle className="text-lg">{getRoleLabel(role)}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col items-center text-center gap-3">
                          <Avatar className="h-20 w-20 border-4 border-yellow-500">
                            <AvatarImage src={champion.user.avatar} />
                            <AvatarFallback className="text-2xl">
                              {champion.user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div>
                            <h3 className="font-bold text-lg">{champion.user.name}</h3>
                            <p className="text-sm text-muted-foreground">{champion.user.email}</p>
                          </div>

                          <div className="flex items-center gap-2 text-xl font-bold text-yellow-600">
                            <Trophy className="h-5 w-5" />
                            {champion.score.toFixed(2)} pts
                          </div>

                          {champion.badges && champion.badges.length > 0 && (
                            <div className="flex gap-2">
                              {champion.badges.map((badge: any, idx: number) => (
                                <BadgeIcon key={idx} type={badge.type} size="md" />
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Histórico */}
            {history && history.history && history.history.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Campeões</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {history.history.map((item: any, idx: number) => {
                      if (idx === 0) return null; // Pular o mês atual (já mostrado acima)
                      
                      const monthLabel = new Date(item.month + '-01').toLocaleDateString('pt-BR', {
                        month: 'long',
                        year: 'numeric'
                      });

                      return (
                        <div key={item.month} className="border-b pb-4 last:border-b-0">
                          <h3 className="font-semibold text-lg mb-3">
                            {monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}
                          </h3>
                          
                          {item.champions && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {Object.entries(item.champions).map(([role, champion]: [string, any]) => (
                                <div key={role} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                                  <Avatar className="h-12 w-12">
                                    <AvatarImage src={champion.user.avatar} />
                                    <AvatarFallback>
                                      {champion.user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  
                                  <div className="flex-1">
                                    <div className="text-xs text-muted-foreground">{getRoleLabel(role)}</div>
                                    <div className="font-medium">{champion.user.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {champion.score.toFixed(2)} pts
                                    </div>
                                  </div>

                                  <Crown className="h-5 w-5 text-yellow-500" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
