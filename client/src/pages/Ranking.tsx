import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { TopPerformerCard } from "@/components/Ranking/TopPerformerCard";
import { RankingTable } from "@/components/Ranking/RankingTable";
import { useCurrentMonthRanking } from "@/hooks/useTeamRanking";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function Ranking() {
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });

  const { data, isLoading, error, refetch } = useCurrentMonthRanking();

  const handleRefresh = () => {
    refetch();
  };

  if (error) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Erro ao carregar dados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : "Erro desconhecido"}
              </p>
              <Button onClick={handleRefresh} className="mt-4">
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ranking do Time</h1>
            <p className="text-muted-foreground">
              Desempenho dos vendedores e SDRs
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                        {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                    )
                  ) : (
                    <span>Selecione o período</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={{
                    from: dateRange?.from,
                    to: dateRange?.to,
                  }}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange({ from: range.from, to: range.to });
                    }
                  }}
                  numberOfMonths={2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-1/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-8 bg-muted rounded w-2/3"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Top Performers */}
        {!isLoading && data && (
          <>
            <div className="grid gap-6 md:grid-cols-2">
              <TopPerformerCard
                title="🏆 Melhor Closer"
                performer={data.best_closer}
                type="closer"
              />
              <TopPerformerCard
                title="📞 Melhor SDR"
                performer={data.best_sdr}
                type="sdr"
              />
            </div>

            {/* Rankings Tables */}
            <Tabs defaultValue="closers" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="closers">
                  Closers ({data.closers.length})
                </TabsTrigger>
                <TabsTrigger value="sdrs">
                  SDRs ({data.sdrs.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="closers" className="mt-6">
                <RankingTable
                  title="Ranking de Closers"
                  members={data.closers}
                  type="closer"
                />
              </TabsContent>

              <TabsContent value="sdrs" className="mt-6">
                <RankingTable
                  title="Ranking de SDRs"
                  members={data.sdrs}
                  type="sdr"
                />
              </TabsContent>
            </Tabs>

            {/* Period Info */}
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center">
                  Dados do período:{" "}
                  <span className="font-medium">
                    {format(new Date(data.period.start_date), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}{" "}
                    até{" "}
                    {format(new Date(data.period.end_date), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </span>
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
