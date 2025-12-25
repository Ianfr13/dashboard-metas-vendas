import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { Settings, Database, Shield, Zap } from "lucide-react";

export default function AdminConfiguracoes() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
          <p className="text-muted-foreground">
            Configurações avançadas do sistema
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Banco de Dados
              </CardTitle>
              <CardDescription>
                Informações sobre o banco de dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo:</span>
                <span className="font-medium">PostgreSQL (Supabase)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Região:</span>
                <span className="font-medium">South America</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium text-green-600">✓ Conectado</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Autenticação
              </CardTitle>
              <CardDescription>
                Configurações de segurança
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Provider:</span>
                <span className="font-medium">Supabase Auth</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">OAuth:</span>
                <span className="font-medium">Google</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">JWT:</span>
                <span className="font-medium text-yellow-600">⚠️ Desabilitado (Dev)</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Edge Functions
              </CardTitle>
              <CardDescription>
                Funções serverless ativas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">get-dashboard-data:</span>
                <span className="font-medium text-green-600">✓ Ativa</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">gtm-analytics:</span>
                <span className="font-medium text-green-600">✓ Ativa</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Região:</span>
                <span className="font-medium">Global</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Sistema
              </CardTitle>
              <CardDescription>
                Informações do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Versão:</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Framework:</span>
                <span className="font-medium">React + Vite</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deploy:</span>
                <span className="font-medium">Cloudflare Workers</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Notas Importantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              ⚠️ <strong>JWT Desabilitado:</strong> As Edge Functions estão configuradas sem verificação JWT para facilitar o desenvolvimento. 
              Antes de ir para produção, reabilite o JWT seguindo o guia de segurança.
            </p>
            <p>
              ✓ <strong>Dados Reais:</strong> Todas as páginas admin agora buscam dados diretamente do Supabase via cliente ou Edge Functions.
            </p>
            <p>
              ✓ <strong>Backup:</strong> Os arquivos antigos do servidor Node.js/tRPC foram movidos para a pasta `.backup/` e podem ser restaurados se necessário.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
