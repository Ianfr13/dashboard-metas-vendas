import { Shield, Bug } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

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

    async function handleDebugJwt() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return toast.error("Não ha sessão ativa");

            const response = await fetch("https://auvvrewlbpyymekonilv.supabase.co/functions/v1/debug-jwt", {
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            });
            const data = await response.json();
            console.log("JWT Debug Info:", data);

            if (response.ok) {
                alert(JSON.stringify(data, null, 2));
            } else {
                toast.error("Erro ao depurar JWT: " + (data.error || response.statusText));
            }
        } catch (e: any) {
            toast.error("Erro desconhecido: " + e.message);
        }
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <Shield className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-xl font-bold">Acesso Restrito</h2>
                <p className="text-muted-foreground mb-4">{displayMessage}</p>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 max-w-md w-full mb-6 text-left">
                    <p className="text-sm text-yellow-800 font-medium">Diagnóstico:</p>
                    <p className="text-xs text-yellow-700 mt-1">Email atual: <b>{userRole?.email || "Não detectado"}</b></p>
                    <p className="text-xs text-yellow-700">Role atual: <b>{userRole?.role || "Nenhum"}</b></p>
                    <p className="text-xs text-yellow-700 font-mono mt-2">Necessário: {displayRole}</p>
                    <p className="text-xs text-yellow-700 mt-1">
                        Permissões: {userRole?.permissions ? "Carregadas" : "Nenhuma"}
                    </p>
                </div>

                <Button variant="outline" onClick={handleDebugJwt}>
                    <Bug className="h-4 w-4 mr-2" /> Debugar Auth / JWT
                </Button>
            </div>
        </DashboardLayout>
    );
}
