import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/admin/index";
import AdminMetas from "./pages/admin/Metas";
import AdminConfiguracoes from "./pages/admin/Configuracoes";
import AdminTraffic from "./pages/admin/Trafego";
import ABTests from "./pages/admin/ABTests";
import UrlGeneratorPage from "./pages/admin/UrlGeneratorPage";
import Metricas from "./pages/Metricas";
import Ranking from "./pages/Ranking";
import { LoginPage } from "./components/Auth/LoginPage";
import { ProtectedRoute } from "./components/Auth/ProtectedRoute";
import { AdminRoute } from "./components/Auth/AdminRoute";


import { PushNotificationButton } from "./components/PushNotificationButton";

function Router() {
  return (
    <Switch>
      {/* Rota pública de landing/login */}
      <Route path="/" component={Home} />
      <Route path="/login" component={LoginPage} />

      {/* Rotas protegidas (requer autenticação) */}
      <Route path="/dashboard">
        {() => (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        )}
      </Route>

      {/* Rotas de admin (requer autenticação) */}
      <Route path="/admin">
        {() => (
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/admin/metas">
        {() => (
          <ProtectedRoute>
            <AdminMetas />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/admin/configuracoes">
        {() => (
          <ProtectedRoute>
            <AdminConfiguracoes />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/admin/trafego">
        {() => (
          <ProtectedRoute>
            <AdminTraffic />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/admin/url-generator">
        {() => (
          <ProtectedRoute>
            <UrlGeneratorPage />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/admin/ab-tests">
        {() => (
          <ProtectedRoute>
            <ABTests />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/metricas">
        {() => (
          <ProtectedRoute>
            <Metricas />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/ranking">
        {() => (
          <ProtectedRoute>
            <Ranking />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/404" component={NotFound} />

      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PLAY_SOUND') {
        const audio = new Audio(event.data.sound);
        audio.play().catch(e => console.error("Error playing sound:", e));
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          defaultTheme="light"
          switchable={false}
        >
          <TooltipProvider>
            <Toaster />
            <Router />
            <div className="fixed bottom-4 right-4 z-50">
              <PushNotificationButton />
            </div>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
