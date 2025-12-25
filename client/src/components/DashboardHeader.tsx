import { Calendar, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface DashboardHeaderProps {
  // Filtros opcionais
  showFilters?: boolean;
  selectedMonth?: number;
  selectedYear?: number;
  viewMode?: string;
  onMonthChange?: (month: number) => void;
  onYearChange?: (year: number) => void;
  onViewModeChange?: (mode: string) => void;
  onRefresh?: () => void;
  // Título da página
  pageTitle?: string;
  // Mobile
  isMobile?: boolean;
}

export default function DashboardHeader({
  showFilters = false,
  selectedMonth,
  selectedYear,
  viewMode,
  onMonthChange,
  onYearChange,
  onViewModeChange,
  onRefresh,
  pageTitle,
  isMobile = false,
}: DashboardHeaderProps) {
  return (
    <div className="flex border-b h-auto min-h-14 items-center justify-between bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
      {/* Left side: Logo + Trigger (mobile) */}
      <div className="flex items-center gap-3">
        {isMobile && <SidebarTrigger className="h-9 w-9 rounded-lg bg-background flex-shrink-0" />}
        
        {/* Logo */}
        <img 
          src="/douravita-logo.png" 
          alt="Douravita" 
          className={`${isMobile ? 'h-8' : 'h-10'} w-auto object-contain`}
        />
        
        {/* Page title (mobile only) */}
        {isMobile && pageTitle && (
          <span className="text-sm font-medium text-foreground truncate">
            {pageTitle}
          </span>
        )}
      </div>

      {/* Right side: Filters */}
      {showFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mês */}
          {selectedMonth !== undefined && onMonthChange && (
            <Select value={selectedMonth.toString()} onValueChange={(val) => onMonthChange(parseInt(val))}>
              <SelectTrigger className={`${isMobile ? 'w-[90px] h-9 text-xs' : 'w-[120px]'}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Jan</SelectItem>
                <SelectItem value="2">Fev</SelectItem>
                <SelectItem value="3">Mar</SelectItem>
                <SelectItem value="4">Abr</SelectItem>
                <SelectItem value="5">Mai</SelectItem>
                <SelectItem value="6">Jun</SelectItem>
                <SelectItem value="7">Jul</SelectItem>
                <SelectItem value="8">Ago</SelectItem>
                <SelectItem value="9">Set</SelectItem>
                <SelectItem value="10">Out</SelectItem>
                <SelectItem value="11">Nov</SelectItem>
                <SelectItem value="12">Dez</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Ano */}
          {selectedYear !== undefined && onYearChange && (
            <Select value={selectedYear.toString()} onValueChange={(val) => onYearChange(parseInt(val))}>
              <SelectTrigger className={`${isMobile ? 'w-[80px] h-9 text-xs' : 'w-[100px]'}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Visualização (apenas desktop) */}
          {!isMobile && viewMode !== undefined && onViewModeChange && (
            <Select value={viewMode} onValueChange={onViewModeChange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mensal">Mensal</SelectItem>
                <SelectItem value="semanal">Semanal</SelectItem>
                <SelectItem value="diario">Diário</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Botão Atualizar */}
          {onRefresh && (
            <Button 
              onClick={onRefresh} 
              variant="outline" 
              size={isMobile ? "sm" : "default"}
              className={isMobile ? 'h-9 px-3' : ''}
            >
              <RefreshCw className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
              {!isMobile && <span className="ml-2">Atualizar</span>}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
