import { Shield } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";

export function AccessDenied({
    message,
    requiredRole,
    feature
}: {
    message?: string,
    requiredRole?: string,
    feature?: string
}) {
    const displayMessage = message || (feature
        ? `Você não tem permissão para acessar o módulo ${feature}.`
        : "Apenas usuários autorizados podem acessar esta página.");

    const displayRole = requiredRole || (feature
        ? `permissão '${feature.toLowerCase().replace(/ /g, '_')}.read' ou master`
        : "admin ou master");
    const { userRole } = useUserRole();

    return (
        <DashboardLayout>
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <Shield className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-xl font-bold">Acesso Restrito</h2>
                <p className="text-muted-foreground mb-4">{displayMessage}</p>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 max-w-md w-full mb-6 text-left">
                    <p className="text-sm text-yellow-800 font-medium">Informações:</p>
                    <p className="text-xs text-yellow-700 mt-1">Email atual: <b>{userRole?.email || "Não detectado"}</b></p>
                    <p className="text-xs text-yellow-700">Role atual: <b>{userRole?.role || "Nenhum"}</b></p>
                    <p className="text-xs text-yellow-700 font-mono mt-2">Necessário: {displayRole}</p>
                </div>

                <Button variant="outline" onClick={() => window.history.back()}>
                    Voltar
                </Button>
            </div>
        </DashboardLayout>
    );
}
