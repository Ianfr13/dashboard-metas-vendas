import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./index.css";
import "./lib/webVitalsInline"; // Performance monitoring inline

// PWA Auto-Update Registration
const updateSW = registerSW({
  onNeedRefresh() {
    // Nova versão disponível - atualiza automaticamente
    console.log("[PWA] Nova versão disponível. Atualizando...");
    updateSW(true);
  },
  onOfflineReady() {
    console.log("[PWA] App pronto para uso offline");
  },
  onRegisteredSW(swUrl, registration) {
    console.log("[PWA] Service Worker registrado:", swUrl);

    // Verifica atualizações periodicamente (a cada 1 hora)
    if (registration) {
      setInterval(() => {
        console.log("[PWA] Verificando atualizações...");
        registration.update();
      }, 60 * 60 * 1000); // 1 hora
    }
  },
  onRegisterError(error) {
    console.error("[PWA] Erro ao registrar Service Worker:", error);
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
