import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface MetricsCalculation {
  valorMeta: number;
  valorAtual: number;
  valorRestante: number;
  progressoReal: number;
  progressoEsperado: number;
  dias: {
    total: number;
    decorridos: number;
    restantes: number;
  };
  deficit: {
    valor: number;
    percentual: number;
  };
  ritmo: {
    atual: number;
    necessario: number;
    diferenca: number;
  };
}

export async function calculateMetrics(
  supabase: SupabaseClient,
  metaId: number,
  valorAtual: number,
  startDate: string,
  endDate: string
): Promise<MetricsCalculation | null> {
  // Buscar meta principal
  const { data: meta, error } = await supabase
    .from('metas_principais')
    .select('*')
    .eq('id', metaId)
    .single();

  if (error || !meta) {
    console.error('Error fetching meta for metrics:', error);
    return null;
  }

  const valorMeta = parseFloat(meta.valor_meta);
  
  // Calcular datas
  const hoje = new Date();
  const dataInicio = new Date(startDate);
  const dataFim = new Date(endDate);

  const totalDias = Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
  const diasDecorridos = Math.max(0, Math.ceil((hoje.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24)));
  const diasRestantes = Math.max(0, totalDias - diasDecorridos);

  // Calcular progressos
  const progressoEsperado = totalDias > 0 ? (diasDecorridos / totalDias) * 100 : 0;
  const valorEsperado = (valorMeta * diasDecorridos) / totalDias;
  const progressoReal = valorMeta > 0 ? (valorAtual / valorMeta) * 100 : 0;

  // Calcular déficit/superávit
  const deficit = valorAtual - valorEsperado;
  const deficitPercentual = valorEsperado > 0 ? (deficit / valorEsperado) * 100 : 0;

  // Calcular ritmo
  const valorRestante = Math.max(0, valorMeta - valorAtual);
  const ritmoNecessario = diasRestantes > 0 ? valorRestante / diasRestantes : 0;
  const ritmoAtual = diasDecorridos > 0 ? valorAtual / diasDecorridos : 0;

  return {
    valorMeta,
    valorAtual,
    valorRestante,
    progressoReal,
    progressoEsperado,
    dias: {
      total: totalDias,
      decorridos: diasDecorridos,
      restantes: diasRestantes,
    },
    deficit: {
      valor: deficit,
      percentual: deficitPercentual,
    },
    ritmo: {
      atual: ritmoAtual,
      necessario: ritmoNecessario,
      diferenca: ritmoNecessario - ritmoAtual,
    },
  };
}

// Função para atualizar sub-metas automaticamente
export async function updateSubMetas(
  supabase: SupabaseClient,
  metaId: number,
  valorAtual: number
): Promise<number> {
  // Buscar todas as sub-metas da meta principal
  const { data: subMetas, error } = await supabase
    .from('sub_metas')
    .select('*')
    .eq('meta_principal_id', metaId);

  if (error) {
    console.error('Error fetching sub-metas:', error);
    return 0;
  }

  let updatedCount = 0;

  // Marcar sub-metas como atingidas se necessário
  for (const subMeta of subMetas || []) {
    const valorSubMeta = parseFloat(subMeta.valor);
    
    // Se valor atual >= valor da sub-meta e ainda não foi marcada como atingida
    if (valorAtual >= valorSubMeta && subMeta.atingida === 0) {
      const { error: updateError } = await supabase
        .from('sub_metas')
        .update({
          atingida: 1,
          data_atingida: new Date().toISOString(),
        })
        .eq('id', subMeta.id);

      if (!updateError) {
        updatedCount++;
      } else {
        console.error('Error updating sub-meta:', updateError);
      }
    }
  }

  return updatedCount;
}
