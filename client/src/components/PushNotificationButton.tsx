import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export function PushNotificationButton() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Check if already subscribed
        if ("serviceWorker" in navigator && "PushManager" in window) {
            navigator.serviceWorker.ready.then((registration) => {
                registration.pushManager.getSubscription().then((subscription) => {
                    setIsSubscribed(!!subscription);
                });
            });
        }
    }, []);

    const urlBase64ToUint8Array = (base64String: string) => {
        const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const subscribeUser = async () => {
        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;

            // Public VAPID Key - needs to be generated and set in Env or Hardcoded for now
            // TODO: Replace with real public key from backend/env
            const response = await supabase.functions.invoke('get-vapid-key');
            const applicationServerKey = urlBase64ToUint8Array(response.data.publicKey);

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey,
            });

            // Send subscription to backend
            const { error } = await supabase
                .from("push_subscriptions")
                .insert({
                    subscription: subscription.toJSON(),
                });

            if (error) throw error;

            setIsSubscribed(true);
            toast.success("Notificações ativadas!");
        } catch (error) {
            console.error("Failed to subscribe", error);
            toast.error("Erro ao ativar notificações: " + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const unsubscribeUser = async () => {
        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();

                // Remove from backend (optional, or just logic to ignore invalid subs)
                // Here we ideally delete by some matching criteria, but simpler to just unsubscribe locally
                // and let backend handle 410s.
                // Or if we want to be clean:
                // await supabase.from('push_subscriptions').delete().match({ endpoints: subscription.endpoint }); 
            }

            setIsSubscribed(false);
            toast.success("Notificações desativadas.");
        } catch (error) {
            console.error("Failed to unsubscribe", error);
            toast.error("Erro ao desativar.");
        } finally {
            setLoading(false);
        }
    };

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        return null; // Not supported
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={isSubscribed ? unsubscribeUser : subscribeUser}
            disabled={loading}
            title={isSubscribed ? "Desativar notificações" : "Ativar notificações de vendas"}
        >
            {isSubscribed ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
        </Button>
    );
}
