import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { 
  Home as HomeIcon, 
  BarChart3, 
  Settings, 
  Moon, 
  Sun, 
  Target,
  Package,
  GitBranch,
  Sliders,
  TrendingUp
} from "lucide-react";
import MobileNav from "@/components/MobileNav";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      {/* Header Principal */}
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/douravita-logo.png"
              alt="DouraVita"
              className="h-10 w-auto transition-all filter drop-shadow-md"
            />
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Administração</h1>
              <p className="text-xs font-medium text-muted-foreground">
                Gerenciar metas, produtos e configurações
              </p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <HomeIcon className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
            <Link href="/metricas">
              <Button variant="ghost" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Métricas
              </Button>
            </Link>
            <Link href="/ranking">
              <Button variant="ghost" size="sm">
                <TrendingUp className="h-4 w-4 mr-2" />
                Ranking
              </Button>
            </Link>
            <Link href="/admin">
              <Button variant="default" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Sub-navegação Admin */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-2">
            <Link href="/admin">
              <Button 
                variant={location === "/admin" ? "default" : "ghost"} 
                size="sm"
                className="whitespace-nowrap"
              >
                <Settings className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link href="/admin/metas">
              <Button 
                variant={location === "/admin/metas" ? "default" : "ghost"} 
                size="sm"
                className="whitespace-nowrap"
              >
                <Target className="h-4 w-4 mr-2" />
                Metas
              </Button>
            </Link>
            <Link href="/admin/produtos">
              <Button 
                variant={location === "/admin/produtos" ? "default" : "ghost"} 
                size="sm"
                className="whitespace-nowrap"
              >
                <Package className="h-4 w-4 mr-2" />
                Produtos
              </Button>
            </Link>
            <Link href="/admin/funis">
              <Button 
                variant={location === "/admin/funis" ? "default" : "ghost"} 
                size="sm"
                className="whitespace-nowrap"
              >
                <GitBranch className="h-4 w-4 mr-2" />
                Funis
              </Button>
            </Link>
            <Link href="/admin/configuracoes">
              <Button 
                variant={location === "/admin/configuracoes" ? "default" : "ghost"} 
                size="sm"
                className="whitespace-nowrap"
              >
                <Sliders className="h-4 w-4 mr-2" />
                Configurações
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        {children}
      </div>

      <MobileNav />
    </div>
  );
}
