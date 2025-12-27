import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, RefreshCw, Save, Users as UsersIcon } from "lucide-react";
import { rankingAPI } from "@/lib/ranking-api";
import { toast } from "sonner";

export default function Usuarios() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar usuários
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await rankingAPI.listUsers();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar usuários');
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Atualizar função de usuário
  const handleRoleChange = async (userId: string, role: string) => {
    try {
      setSaving(userId);

      await rankingAPI.setUserRole({
        user_id: userId,
        role: role as any,
        active: true
      });

      toast.success('Função atualizada com sucesso!');
      
      // Recarregar lista
      await loadUsers();
    } catch (err) {
      console.error('Erro ao atualizar função:', err);
      toast.error('Erro ao atualizar função');
    } finally {
      setSaving(null);
    }
  };

  // Recalcular rankings
  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      
      await rankingAPI.recalculateRankings();
      
      toast.success('Rankings recalculados com sucesso!');
    } catch (err) {
      console.error('Erro ao recalcular rankings:', err);
      toast.error('Erro ao recalcular rankings');
    } finally {
      setRecalculating(false);
    }
  };

  const getRoleLabel = (role: string | null) => {
    if (!role) return 'Sem função';
    if (role === 'sdr') return 'SDR';
    if (role === 'closer') return 'Closer';
    if (role === 'auto_prospeccao') return 'Auto Prospecção';
    return role;
  };

  const getRoleBadgeVariant = (role: string | null) => {
    if (!role) return 'outline';
    if (role === 'sdr') return 'default';
    if (role === 'closer') return 'secondary';
    if (role === 'auto_prospeccao') return 'destructive';
    return 'outline';
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <UsersIcon className="h-8 w-8" />
              Gerenciar Usuários
            </h1>
            <p className="text-muted-foreground">
              Atribua funções aos usuários do GoHighLevel
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={loadUsers}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>

            <Button
              onClick={handleRecalculate}
              disabled={recalculating}
            >
              {recalculating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Recalcular Rankings
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
              <Button onClick={loadUsers} className="mt-4">
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

        {/* Users Table */}
        {!loading && !error && (
          <Card>
            <CardHeader>
              <CardTitle>Usuários do GoHighLevel</CardTitle>
              <CardDescription>
                Total de {users.length} usuários • Atribua funções para incluí-los no sistema de ranking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Função Atual</TableHead>
                      <TableHead>Atribuir Função</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhum usuário encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {user.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{user.name || 'Sem nome'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{user.email || '-'}</TableCell>
                          <TableCell>
                            {user.active ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Ativo
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                Inativo
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(user.role) as any}>
                              {getRoleLabel(user.role)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={user.role || 'none'}
                              onValueChange={(value) => {
                                if (value !== 'none') {
                                  handleRoleChange(user.id, value);
                                }
                              }}
                              disabled={saving === user.id}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Sem função</SelectItem>
                                <SelectItem value="sdr">SDR</SelectItem>
                                <SelectItem value="closer">Closer</SelectItem>
                                <SelectItem value="auto_prospeccao">Auto Prospecção</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {saving === user.id && (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>ℹ️ Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>SDR (Sales Development Representative):</strong> Responsável por agendamentos e qualificação de leads.
            </p>
            <p>
              <strong>Closer:</strong> Responsável por fechar vendas e converter oportunidades.
            </p>
            <p>
              <strong>Auto Prospecção:</strong> Responsável por todo o ciclo de vendas, desde o agendamento até o fechamento.
            </p>
            <p className="mt-4">
              Após atribuir funções, clique em <strong>"Recalcular Rankings"</strong> para atualizar as métricas e posições.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
