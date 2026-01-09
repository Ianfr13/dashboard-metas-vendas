import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, GitBranch, TrendingUp, Loader2 } from "lucide-react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    metas: 0,
    produtos: 0,
    funis: 0,
    vendas: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);

        // Buscar estatísticas
        const [metasRes, produtosRes, funisRes, vendasRes] = await Promise.all([
          supabase.from('metas_principais').select('id', { count: 'exact', head: true }),
          supabase.from('products').select('id', { count: 'exact', head: true }),
          supabase.from('funis').select('id', { count: 'exact', head: true }),
          supabase.from('gtm_events').select('id', { count: 'exact', head: true }).eq('event_name', 'purchase'),
        ]);

        setStats({
          metas: metasRes.count || 0,
          produtos: produtosRes.count || 0,
          funis: funisRes.count || 0,
          vendas: vendasRes.count || 0,
        });
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

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
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Administrativo</h2>
          <p className="text-muted-foreground">
            Gerencie metas, produtos e configurações do sistema
          </p>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/admin/metas">
            <Card className="cursor-pointer hover:bg-accent transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Metas Cadastradas</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.metas}</div>
                <p className="text-xs text-muted-foreground">
                  Clique para gerenciar
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/funis">
            <Card className="cursor-pointer hover:bg-accent transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Funis de Venda</CardTitle>
                <GitBranch className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.funis}</div>
                <p className="text-xs text-muted-foreground">
                  Clique para gerenciar
                </p>
              </CardContent>
            </Card>
          </Link>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendas Totais</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.vendas}</div>
              <p className="text-xs text-muted-foreground">
                Eventos de compra registrados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Cards de Ações Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/admin/metas">
                <button className="w-full text-left px-4 py-2 rounded-md hover:bg-accent transition-colors">
                  → Criar nova meta mensal
                </button>
              </Link>
              <Link href="/admin/funis">
                <button className="w-full text-left px-4 py-2 rounded-md hover:bg-accent transition-colors">
                  → Configurar funil de vendas
                </button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>✓ Backend: Supabase Edge Functions</p>
              <p>✓ Banco de dados: PostgreSQL</p>
              <p>✓ Autenticação: Supabase Auth</p>
              <p>✓ Analytics: GTM Events</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
