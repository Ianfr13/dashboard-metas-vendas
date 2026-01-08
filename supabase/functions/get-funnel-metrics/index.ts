import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface ProdutoFunil {
  id: number;
  funil_id: number;
  produto_id: number;
  tipo: 'frontend' | 'backend' | 'downsell';
  ordem: number;
  products: {
    id: number;
    name: string;
    price: number;
    channel: string;
    url: string | null;
  };
}

interface Funil {
  id: number;
  nome: string;
  url: string | null;
  ticket_medio: number | null;
  active: number;
  created_at: string;
  produtos_funil: ProdutoFunil[];
}

interface GTMEvent {
  event_name: string;
  event_data: string;
  timestamp: string;
  page_url: string | null;
}

interface ProdutoMetrics {
  produto: string;
  tipo: string;
  ordem: number;
  vendas: number;
  receita: number;
  taxaConversao: number; // Em relação ao produto anterior
}


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const funnelIdParam = url.searchParams.get('funnel_id');
    const startDateParam = url.searchParams.get('startDate');
    const endDateParam = url.searchParams.get('endDate');

    // Validações
    if (!funnelIdParam) {
      return new Response(
        JSON.stringify({ error: 'funnel_id parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const funnelId = parseInt(funnelIdParam);
    if (isNaN(funnelId)) {
      return new Response(
        JSON.stringify({ error: 'funnel_id must be a valid number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!startDateParam || !endDateParam) {
      return new Response(
        JSON.stringify({ error: 'startDate and endDate parameters are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return new Response(
        JSON.stringify({ error: 'Invalid date format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Buscar funil com produtos
    const { data: funil, error: funilError } = await supabaseClient
      .from('funis')
      .select(`
        *,
        produtos_funil (
          *,
          products (*)
        )
      `)
      .eq('id', funnelId)
      .single();

    if (funilError) {
      throw new Error(`Error fetching funnel: ${funilError.message}`);
    }

    if (!funil) {
      return new Response(
        JSON.stringify({ error: 'Funnel not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Ordenar produtos por ordem
    const produtosOrdenados = (funil.produtos_funil || []).sort((a: ProdutoFunil, b: ProdutoFunil) => a.ordem - b.ordem);

    if (produtosOrdenados.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Funnel must have at least one product' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Buscar eventos do GTM no período
    const { data: events, error: eventsError } = await supabaseClient
      .from('gtm_events')
      .select('event_name, event_data, timestamp, page_url')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());

    if (eventsError) {
      throw new Error(`Error fetching GTM events: ${eventsError.message}`);
    }

    // 4. Filtrar eventos relacionados ao funil (por URL)
    const funnelEvents = (events || []).filter((e: GTMEvent) => {
      if (!funil.url) return false;
      return e.page_url?.includes(funil.url);
    });

    // 5. Calcular métricas do produto FRONTEND (ordem 1)
    const produtoFrontend = produtosOrdenados[0];

    const visualizacoes = funnelEvents.filter((e: GTMEvent) => e.event_name === 'page_view').length;
    const leads = funnelEvents.filter((e: GTMEvent) => e.event_name === 'generate_lead').length;
    const checkouts = funnelEvents.filter((e: GTMEvent) => e.event_name === 'begin_checkout').length;

    // 6. Calcular vendas de TODOS os produtos (em ordem)
    const produtosMetrics: ProdutoMetrics[] = [];
    let vendasAnterior = 0;

    for (let i = 0; i < produtosOrdenados.length; i++) {
      const produto = produtosOrdenados[i];

      // Buscar vendas do produto (por nome E URL do funil)
      const vendasProdutoEvents = (events || []).filter((e: GTMEvent) => {
        if (e.event_name !== 'purchase') return false;

        const eventData = JSON.parse(e.event_data || '{}');
        const productName = eventData.product_name || eventData.item_name || '';

        // Matching por nome do produto E URL do funil
        const matchProduto = productName === produto.products.name;
        const matchUrl = funil.url ? e.page_url?.includes(funil.url) : true;

        return matchProduto && matchUrl;
      });

      const vendas = vendasProdutoEvents.length;
      const receita = vendasProdutoEvents.reduce((sum: number, e: GTMEvent) => {
        const eventData = JSON.parse(e.event_data || '{}');
        const value = parseFloat(eventData.value || eventData.transaction_value || '0');
        return sum + value;
      }, 0);

      // Calcular taxa de conversão
      let taxaConversao = 0;

      if (i === 0) {
        // Primeiro produto (frontend): conversão baseada em visualizações
        taxaConversao = visualizacoes > 0 ? (vendas / visualizacoes) * 100 : 0;
      } else {
        // Produtos seguintes: conversão baseada nas vendas do produto ANTERIOR
        taxaConversao = vendasAnterior > 0 ? (vendas / vendasAnterior) * 100 : 0;
      }

      produtosMetrics.push({
        produto: produto.products.name,
        tipo: produto.tipo,
        ordem: produto.ordem,
        vendas,
        receita: Math.round(receita * 100) / 100,
        taxaConversao: Math.round(taxaConversao * 100) / 100
      });

      // Atualizar vendas anterior para próxima iteração
      vendasAnterior = vendas;
    }

    // 7. Calcular totais
    const vendasTotais = produtosMetrics.reduce((sum, p) => sum + p.vendas, 0);
    const receitaTotal = produtosMetrics.reduce((sum, p) => sum + p.receita, 0);
    const ticketMedio = vendasTotais > 0 ? receitaTotal / vendasTotais : 0;

    // 8. Retornar resposta
    const responseBody = {
      funil: {
        id: funil.id,
        nome: funil.nome,
        url: funil.url
      },
      metricas_gerais: {
        visualizacoes,
        leads,
        checkouts
      },
      produtos: produtosMetrics,
      totais: {
        vendasTotais,
        receitaTotal: Math.round(receitaTotal * 100) / 100,
        ticketMedio: Math.round(ticketMedio * 100) / 100
      }
    };

    return new Response(
      JSON.stringify(responseBody),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-funnel-metrics:', error);
    const isAuthError = error.message.includes('Autenticação') || error.message.includes('Token') || error.message.includes('Falha na autenticação')
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: isAuthError ? 401 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
