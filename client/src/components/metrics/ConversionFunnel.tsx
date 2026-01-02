import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown } from "lucide-react";

interface FunnelStage {
  name: string;
  value: number;
  percentage: number;
  conversionFromPrevious?: number;
}

interface ConversionFunnelProps {
  data: FunnelStage[];
}

export default function ConversionFunnel({ data }: ConversionFunnelProps) {
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("pt-BR").format(value);
  };

  const maxValue = data[0]?.value || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funil de Conversão</CardTitle>
        <CardDescription>Jornada completa do cliente</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((stage, index) => {
            const widthPercentage = (stage.value / maxValue) * 100;

            return (
              <div key={index} className="space-y-2">
                {/* Etapa do Funil */}
                <div className="relative">
                  <div
                    className="mx-auto rounded-lg p-4 transition-all hover:scale-[1.02]"
                    style={{
                      width: `${Math.max(widthPercentage, 30)}%`,
                      background: `linear-gradient(135deg, 
                        hsl(${160 - index * 30}, 70%, ${50 + index * 5}%), 
                        hsl(${180 - index * 30}, 65%, ${45 + index * 5}%))`,
                    }}
                  >
                    <div className="flex items-center justify-between text-white">
                      <div>
                        <p className="font-semibold text-sm">{stage.name}</p>
                        <p className="text-xs opacity-90">
                          {formatNumber(stage.value)} ({(stage.percentage || 0).toFixed(1)}% do total)
                        </p>
                      </div>
                      {stage.conversionFromPrevious && (
                        <div className="text-right">
                          <p className="text-lg font-bold">{(stage.conversionFromPrevious || 0).toFixed(1)}%</p>
                          <p className="text-xs opacity-90">conversão</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Seta de Transição */}
                {index < data.length - 1 && (
                  <div className="flex flex-col items-center py-1">
                    <ArrowDown className="h-5 w-5 text-muted-foreground" />
                    {data[index + 1]?.conversionFromPrevious && (
                      <span className="text-xs text-muted-foreground font-medium mt-1">
                        {(data[index + 1]?.conversionFromPrevious || 0).toFixed(1)}% avançam
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Resumo de Conversão */}
        <div className="mt-6 pt-6 border-t border-border">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Conversão Geral</p>
              <p className="text-2xl font-bold text-green-500">
                {data.length > 0 ? ((data[data.length - 1]?.value / data[0]?.value) * 100).toFixed(2) : '0.00'}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatNumber(data[0]?.value || 0)} → {formatNumber(data[data.length - 1]?.value || 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Maior Gargalo</p>
              <p className="text-2xl font-bold text-orange-500">
                {(Math.min(...data.filter(s => s.conversionFromPrevious).map(s => s.conversionFromPrevious!)) || 0).toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {data.find(s => s.conversionFromPrevious === Math.min(...data.filter(s => s.conversionFromPrevious).map(s => s.conversionFromPrevious!)))?.name || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
