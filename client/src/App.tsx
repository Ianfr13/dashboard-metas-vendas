import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Metricas from "./pages/Metricas";
import { LoginPage } from "./components/Auth/LoginPage";
import { ProtectedRoute } from "./components/Auth/ProtectedRoute";
import { AdminRoute } from "./components/Auth/AdminRoute";
import { Header } from "./components/Auth/Header";

function Router() {
  return (
    <Switch>
      {/* Rota pública de login */}
      <Route path="/login" component={LoginPage} />
      
      {/* Rotas protegidas (requer autenticação) */}
      <Route path="/">
        {() => (
          <ProtectedRoute>
            <Header />
            <Home />
          </ProtectedRoute>
        )}
      </Route>
      
      {/* Rota de admin (requer autenticação + role admin) */}
      <Route path="/admin">
        {() => (
          <ProtectedRoute>
            <AdminRoute>
              <Header />
              <Admin />
            </AdminRoute>
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/metricas">
        {() => (
          <ProtectedRoute>
            <Header />
            <Metricas />
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/404" component={NotFound} />
      
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
