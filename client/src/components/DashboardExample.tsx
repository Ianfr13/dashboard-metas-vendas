import { useDashboardData } from '@/hooks/useDashboardData';
import { useState } from 'react';

/**
 * Componente de exemplo mostrando como usar o hook useDashboardData
 * 
 * Este componente demonstra:
 * - Loading state
 * - Error handling
 * - Mudança de mês/ano
 * - Refetch manual
 * - Cache automático
 */
export function DashboardExample() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const { data, isLoading, error, refetch, isFetching } = useDashboardData({ month, year });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-500 mb-4">
          <p className="font-semibold">Erro ao carregar dados</p>
          <p className="text-sm">{error.message}</p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Nenhum dado disponível
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header com controles */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard de Metas</h1>
        
        <div className="flex items-center gap-4">
          {/* Seletor de mês/ano */}
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="px-3 py-2 border rounded-md"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {new Date(2025, m - 1).toLocaleString('pt-BR', { month: 'long' })}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2 border rounded-md"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Botão de refresh */}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {isFetching ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 border rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">Total de Vendas</p>
          <p className="text-3xl font-bold">{data.totals.sales}</p>
        </div>

        <div className="p-6 border rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">Receita Total</p>
          <p className="text-3xl font-bold">
            R$ {data.totals.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="p-6 border rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">Progresso da Meta</p>
          <p className="text-3xl font-bold">{data.totals.progress.toFixed(1)}%</p>
        </div>
      </div>

      {/* Meta principal */}
      {data.meta && (
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Meta do Mês</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Meta:</span>
              <span className="font-semibold">
                R$ {data.meta.valor_meta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Atual:</span>
              <span className="font-semibold">
                R$ {data.meta.valor_atual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Sub-metas */}
      {data.subMetas.length > 0 && (
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Sub-Metas</h2>
          <div className="space-y-3">
            {data.subMetas.map((subMeta) => (
              <div key={subMeta.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                <span>{subMeta.nome}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    R$ {subMeta.valor_meta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  {subMeta.atingida && (
                    <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">
                      Atingida
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info de cache */}
      <div className="text-xs text-muted-foreground text-center">
        💾 Dados em cache por 5 minutos • Última atualização: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}
