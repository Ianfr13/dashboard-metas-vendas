import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
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

    // 2. Identificar produtos por tipo
    const produtoFrontend = funil.produtos_funil?.find((p: ProdutoFunil) => p.tipo === 'frontend');
    const produtoBackend = funil.produtos_funil?.find((p: ProdutoFunil) => p.tipo === 'backend');
    const produtoDownsell = funil.produtos_funil?.find((p: ProdutoFunil) => p.tipo === 'downsell');

    if (!produtoFrontend) {
      return new Response(
        JSON.stringify({ error: 'Funnel must have a frontend product' }),
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

    // 5. Calcular métricas FRONTEND
    const visualizacoes = funnelEvents.filter((e: GTMEvent) => e.event_name === 'page_view').length;
    const leads = funnelEvents.filter((e: GTMEvent) => e.event_name === 'generate_lead').length;
    const checkouts = funnelEvents.filter((e: GTMEvent) => e.event_name === 'begin_checkout').length;

    // Vendas frontend: filtrar por nome do produto E URL do funil
    const vendasFrontendEvents = (events || []).filter((e: GTMEvent) => {
      if (e.event_name !== 'purchase') return false;
      
      const eventData = JSON.parse(e.event_data || '{}');
      const productName = eventData.product_name || eventData.item_name || '';
      
      // Matching por nome do produto E URL do funil
      const matchProduto = productName === produtoFrontend.products.name;
      const matchUrl = funil.url ? e.page_url?.includes(funil.url) : true;
      
      return matchProduto && matchUrl;
    });

    const vendasFrontend = vendasFrontendEvents.length;
    const receitaFrontend = vendasFrontendEvents.reduce((sum: number, e: GTMEvent) => {
      const eventData = JSON.parse(e.event_data || '{}');
      const value = parseFloat(eventData.value || eventData.transaction_value || '0');
      return sum + value;
    }, 0);

    const taxaConversaoFrontend = visualizacoes > 0 ? (vendasFrontend / visualizacoes) * 100 : 0;

    // 6. Calcular métricas BACKEND (se existir)
    let backendMetrics = null;
    if (produtoBackend) {
      // 30% das vendas frontend recebem oferta de backend
      const ofertasBackend = Math.round(vendasFrontend * 0.30);

      const vendasBackendEvents = (events || []).filter((e: GTMEvent) => {
        if (e.event_name !== 'purchase') return false;
        
        const eventData = JSON.parse(e.event_data || '{}');
        const productName = eventData.product_name || eventData.item_name || '';
        
        return productName === produtoBackend.products.name;
      });

      const vendasBackend = vendasBackendEvents.length;
      const receitaBackend = vendasBackendEvents.reduce((sum: number, e: GTMEvent) => {
        const eventData = JSON.parse(e.event_data || '{}');
        const value = parseFloat(eventData.value || eventData.transaction_value || '0');
        return sum + value;
      }, 0);

      const taxaTakeBackend = ofertasBackend > 0 ? (vendasBackend / ofertasBackend) * 100 : 0;

      backendMetrics = {
        produto: produtoBackend.products.name,
        ofertas: ofertasBackend,
        vendas: vendasBackend,
        receita: Math.round(receitaBackend * 100) / 100,
        taxaTake: Math.round(taxaTakeBackend * 100) / 100
      };
    }

    // 7. Calcular métricas DOWNSELL (se existir)
    let downsellMetrics = null;
    if (produtoDownsell && backendMetrics) {
      // 20% dos que não compraram backend recebem oferta de downsell
      const naoCompraramBackend = backendMetrics.ofertas - backendMetrics.vendas;
      const ofertasDownsell = Math.round(naoCompraramBackend * 0.20);

      const vendasDownsellEvents = (events || []).filter((e: GTMEvent) => {
        if (e.event_name !== 'purchase') return false;
        
        const eventData = JSON.parse(e.event_data || '{}');
        const productName = eventData.product_name || eventData.item_name || '';
        
        return productName === produtoDownsell.products.name;
      });

      const vendasDownsell = vendasDownsellEvents.length;
      const receitaDownsell = vendasDownsellEvents.reduce((sum: number, e: GTMEvent) => {
        const eventData = JSON.parse(e.event_data || '{}');
        const value = parseFloat(eventData.value || eventData.transaction_value || '0');
        return sum + value;
      }, 0);

      const taxaTakeDownsell = ofertasDownsell > 0 ? (vendasDownsell / ofertasDownsell) * 100 : 0;

      downsellMetrics = {
        produto: produtoDownsell.products.name,
        ofertas: ofertasDownsell,
        vendas: vendasDownsell,
        receita: Math.round(receitaDownsell * 100) / 100,
        taxaTake: Math.round(taxaTakeDownsell * 100) / 100
      };
    }

    // 8. Calcular totais
    const vendasTotais = vendasFrontend + (backendMetrics?.vendas || 0) + (downsellMetrics?.vendas || 0);
    const receitaTotal = receitaFrontend + (backendMetrics?.receita || 0) + (downsellMetrics?.receita || 0);
    const ticketMedio = vendasTotais > 0 ? receitaTotal / vendasTotais : 0;

    // 9. Retornar resposta
    const response = {
      funil: {
        id: funil.id,
        nome: funil.nome,
        url: funil.url
      },
      frontend: {
        produto: produtoFrontend.products.name,
        visualizacoes,
        leads,
        checkouts,
        vendas: vendasFrontend,
        receita: Math.round(receitaFrontend * 100) / 100,
        taxaConversao: Math.round(taxaConversaoFrontend * 100) / 100
      },
      backend: backendMetrics,
      downsell: downsellMetrics,
      totais: {
        vendasTotais,
        receitaTotal: Math.round(receitaTotal * 100) / 100,
        ticketMedio: Math.round(ticketMedio * 100) / 100
      }
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-funnel-by-id-metrics:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
