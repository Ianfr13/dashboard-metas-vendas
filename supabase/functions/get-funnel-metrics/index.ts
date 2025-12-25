import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

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
    const monthParam = url.searchParams.get('month');
    const yearParam = url.searchParams.get('year');
    const funnel = url.searchParams.get('funnel') || 'comercial'; // 'comercial' ou 'marketing'

    // Validar month
    const month = parseInt(monthParam || '', 10);
    if (isNaN(month) || month < 1 || month > 12) {
      return new Response(
        JSON.stringify({ error: 'Month must be an integer between 1 and 12' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar year
    const year = parseInt(yearParam || '', 10);
    if (isNaN(year) || year < 2000 || year > 2100) {
      return new Response(
        JSON.stringify({ error: 'Year must be a valid integer between 2000 and 2100' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calcular período
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    if (funnel === 'comercial') {
      // FUNIL COMERCIAL
      
      // 1. Agendamentos (exceto cancelados)
      const { data: appointments, error: apptError } = await supabaseClient
        .from('ghl_appointments')
        .select('id, contact_id, status, start_time')
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
        .neq('status', 'cancelled');

      if (apptError) throw apptError;

      const totalAgendamentos = appointments?.length || 0;
      const noShows = appointments?.filter(a => a.status === 'no_show').length || 0;
      const presencas = totalAgendamentos - noShows;
      const taxaPresenca = totalAgendamentos > 0 ? (presencas / totalAgendamentos) * 100 : 0;

      // 2. Contatos únicos
      const contatosUnicos = new Set(appointments?.map(a => a.contact_id) || []).size;

      // 3. Vendas do comercial (via GTM events ou crm_gtm_sync)
      const { data: vendas, error: vendasError } = await supabaseClient
        .from('crm_gtm_sync')
        .select('purchase_value')
        .gte('purchase_date', startDate.toISOString())
        .lte('purchase_date', endDate.toISOString());

      if (vendasError) throw vendasError;

      const totalVendas = vendas?.length || 0;
      const receitaTotal = vendas?.reduce((sum, v) => sum + (parseFloat(v.purchase_value) || 0), 0) || 0;

      // 4. Taxas
      const taxaConversao = contatosUnicos > 0 ? (totalVendas / contatosUnicos) * 100 : 0;
      const taxaAgendamento = contatosUnicos > 0 ? (totalAgendamentos / contatosUnicos) * 100 : 0;

      return new Response(
        JSON.stringify({
          funnel: 'comercial',
          period: { month, year, startDate, endDate },
          metrics: {
            agendamentos: totalAgendamentos,
            contatos: contatosUnicos,
            vendas: totalVendas,
            receita: receitaTotal,
            taxaConversao: parseFloat(taxaConversao.toFixed(2)),
            taxaAgendamento: parseFloat(taxaAgendamento.toFixed(2)),
            noShow: noShows,
            taxaPresenca: parseFloat(taxaPresenca.toFixed(2))
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (funnel === 'marketing') {
      // FUNIL DE MARKETING

      // 1. Leads gerados (contacts com source = marketing ou tags específicas)
      const { data: leads, error: leadsError } = await supabaseClient
        .from('ghl_contacts')
        .select('id, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .or('source.eq.marketing,tags.cs.{marketing}');

      if (leadsError) throw leadsError;

      const totalLeads = leads?.length || 0;

      // 2. Custos do período
      const { data: custos, error: custosError } = await supabaseClient
        .from('custos')
        .select('valor, data')
        .gte('data', startDate.toISOString())
        .lte('data', endDate.toISOString())
        .eq('canal', 'marketing');

      if (custosError) throw custosError;

      const custoTotal = custos?.reduce((sum, c) => sum + (parseFloat(c.valor) || 0), 0) || 0;

      // 3. Vendas do marketing (GTM events com purchase)
      const { data: gtmEvents, error: gtmError } = await supabaseClient
        .from('gtm_events')
        .select('event_data')
        .eq('event_name', 'purchase')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      if (gtmError) throw gtmError;

      let totalVendas = 0;
      let receitaTotal = 0;

      gtmEvents?.forEach(event => {
        try {
          const data = typeof event.event_data === 'string' 
            ? JSON.parse(event.event_data) 
            : event.event_data;
          
          if (data.value) {
            totalVendas++;
            receitaTotal += parseFloat(data.value) || 0;
          }
        } catch (e) {
          console.error('Error parsing event_data:', e);
        }
      });

      // 4. Métricas calculadas
      const cpl = totalLeads > 0 ? custoTotal / totalLeads : 0;
      const cpa = totalVendas > 0 ? custoTotal / totalVendas : 0;
      const taxaConversao = totalLeads > 0 ? (totalVendas / totalLeads) * 100 : 0;

      return new Response(
        JSON.stringify({
          funnel: 'marketing',
          period: { month, year, startDate, endDate },
          metrics: {
            leads: totalLeads,
            vendas: totalVendas,
            receita: receitaTotal,
            custoTotal: custoTotal,
            cpl: parseFloat(cpl.toFixed(2)),
            cpa: parseFloat(cpa.toFixed(2)),
            taxaConversao: parseFloat(taxaConversao.toFixed(2))
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid funnel type. Use "comercial" or "marketing"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-funnel-metrics:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
