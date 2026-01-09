import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { facebookAdsAPI } from "@/lib/edge-functions";

interface AdAccount {
    id: string;
    name: string;
    account_status: number;
    active: boolean; // Our database 'active' flag (visibility)
}

export default function AdminTraffic() {
    const [accounts, setAccounts] = useState<AdAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    const loadAccounts = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('facebook_ad_accounts')
                .select('*')
                .order('name');

            if (error) throw error;
            setAccounts(data || []);
        } catch (error) {
            console.error('Erro ao carregar contas:', error);
            toast.error('Erro ao carregar contas de anúncio');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAccounts();
    }, []);

    const toggleAccount = async (id: string, currentStatus: boolean) => {
        try {
            // Optimistic update
            setAccounts(accounts.map(acc =>
                acc.id === id ? { ...acc, active: !currentStatus } : acc
            ));

            const { error } = await supabase
                .from('facebook_ad_accounts')
                .update({ active: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            toast.success(`Conta ${!currentStatus ? 'ativada' : 'desativada'} com sucesso`);
        } catch (error) {
            console.error('Erro ao atualizar conta:', error);
            toast.error('Erro ao atualizar status da conta');
            loadAccounts(); // Revert on error
        }
    };

    const handleManualSync = async () => {
        try {
            setSyncing(true);
            // Trigger sync logic (we can use the syncData from edge-functions, 
            // but maybe we just want to re-fetch accounts from FB to update the list?)
            // The user wants "sync data" usually means metrics.
            // But here in admin, maybe "Refresh Accounts List"?
            // Use listAccounts from edge functions which calls the worker/DB?
            // Actually facebookAdsAPI.listAccounts calls Supabase DB.
            // To "Refresh List from Facebook", we need the worker to run 'sync_all' or similar, 
            // OR we add a specific function to fetch accounts from FB and update DB.
            // The current worker 'sync_all' does fetch accounts from FB.

            const today = new Date().toISOString().split('T')[0];
            await facebookAdsAPI.syncData(today, today); // This triggers the worker to sync everything

            toast.success('Sincronização iniciada. A lista de contas será atualizada em breve.');
            // Wait a bit then reload DB list
            setTimeout(loadAccounts, 5000);
        } catch (error) {
            toast.error('Erro ao iniciar sincronização');
        } finally {
            setSyncing(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-5xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Gestão de Tráfego</h2>
                        <p className="text-muted-foreground">
                            Selecione quais contas de anúncio devem aparecer no dashboard e serem sincronizadas.
                        </p>
                    </div>
                    <Button onClick={handleManualSync} disabled={syncing}>
                        {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Atualizar Lista do Facebook
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Contas de Anúncio</CardTitle>
                        <CardDescription>
                            Contas desativadas aqui não aparecerão nas métricas e não terão dados atualizados.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {accounts.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        Nenhuma conta encontrada. Clique em "Atualizar Lista" para buscar do Facebook.
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {accounts.map((account) => (
                                            <div
                                                key={account.id}
                                                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-full ${account.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                        {account.active ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold">{account.name}</h4>
                                                        <p className="text-sm text-muted-foreground">ID: {account.id}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-muted-foreground mr-2">
                                                        {account.active ? 'Visível' : 'Oculta'}
                                                    </span>
                                                    <Switch
                                                        checked={account.active}
                                                        onCheckedChange={() => toggleAccount(account.id, account.active)}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
