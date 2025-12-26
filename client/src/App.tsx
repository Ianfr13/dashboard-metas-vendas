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
import AdminProdutos from "./pages/admin/Produtos";
import AdminFunis from "./pages/admin/Funis";
import AdminConfiguracoes from "./pages/admin/Configuracoes";
import AdminUsuarios from "./pages/admin/Usuarios";
import Metricas from "./pages/Metricas";
import Ranking from "./pages/Ranking";
import HallOfFame from "./pages/HallOfFame";
import { LoginPage } from "./components/Auth/LoginPage";
import { ProtectedRoute } from "./components/Auth/ProtectedRoute";
import { AdminRoute } from "./components/Auth/AdminRoute";


// Export routes for testing
export const routes = [
  { path: '/', component: 'Home' },
  { path: '/login', component: 'LoginPage' },
  { path: '/dashboard', component: 'Dashboard' },
  { path: '/admin', component: 'AdminDashboard' },
  { path: '/admin/metas', component: 'AdminMetas' },
  { path: '/admin/produtos', component: 'AdminProdutos' },
  { path: '/admin/funis', component: 'AdminFunis' },
  { path: '/admin/configuracoes', component: 'AdminConfiguracoes' },
  { path: '/admin/usuarios', component: 'AdminUsuarios' },
  { path: '/metricas', component: 'Metricas' },
  { path: '/ranking', component: 'Ranking' },
  { path: '/ranking/hall-of-fame', component: 'HallOfFame' },
  { path: '/404', component: 'NotFound' },
  { path: undefined, component: 'NotFound' }, // Fallback
] as const;

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
      
      <Route path="/admin/produtos">
        {() => (
          <ProtectedRoute>
            <AdminProdutos />
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/admin/funis">
        {() => (
          <ProtectedRoute>
            <AdminFunis />
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
      
      <Route path="/admin/usuarios">
        {() => (
          <ProtectedRoute>
            <AdminUsuarios />
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
      
      <Route path="/ranking/hall-of-fame">
        {() => (
          <ProtectedRoute>
            <HallOfFame />
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
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
