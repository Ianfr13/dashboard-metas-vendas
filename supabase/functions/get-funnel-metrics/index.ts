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
    const startDateParam = url.searchParams.get('startDate');
    const endDateParam = url.searchParams.get('endDate');
    const funnel = url.searchParams.get('funnel') || 'comercial'; // 'comercial' ou 'marketing'

    // Validar startDate
    if (!startDateParam) {
      return new Response(
        JSON.stringify({ error: 'startDate parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const startDate = new Date(startDateParam);
    if (isNaN(startDate.getTime())) {
      return new Response(
        JSON.stringify({ error: 'startDate must be a valid ISO date string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar endDate
    if (!endDateParam) {
      return new Response(
        JSON.stringify({ error: 'endDate parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const endDate = new Date(endDateParam);
    if (isNaN(endDate.getTime())) {
      return new Response(
        JSON.stringify({ error: 'endDate must be a valid ISO date string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar que endDate >= startDate
    if (endDate < startDate) {
      return new Response(
        JSON.stringify({ error: 'endDate must be greater than or equal to startDate' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

      // 5. Evolution Data (por semana)
      const diasNoPeriodo = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const weeksInPeriod = Math.ceil(diasNoPeriodo / 7);
      const evolutionData = [];
      for (let week = 1; week <= weeksInPeriod; week++) {
        const weekStart = new Date(startDate.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(Math.min(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1, endDate.getTime()));
        
        const { data: weekAppointments } = await supabaseClient
          .from('ghl_appointments')
          .select('id, status, contact_id')
          .gte('start_time', weekStart.toISOString())
          .lte('start_time', weekEnd.toISOString())
          .neq('status', 'cancelled');
        
        const { data: weekSales } = await supabaseClient
          .from('crm_gtm_sync')
          .select('id')
          .gte('purchase_date', weekStart.toISOString())
          .lte('purchase_date', weekEnd.toISOString());
        
        evolutionData.push({
          periodo: `Sem ${week}`,
          agendamentos: weekAppointments?.length || 0,
          contatos: new Set(weekAppointments?.map(a => a.contact_id) || []).size,
          vendas: weekSales?.length || 0
        });
      }

      return new Response(
        JSON.stringify({
          funnel: 'comercial',
          period: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
          metrics: {
            agendamentos: totalAgendamentos,
            contatos: contatosUnicos,
            vendas: totalVendas,
            receita: receitaTotal,
            taxaConversao: parseFloat(taxaConversao.toFixed(2)),
            taxaAgendamento: parseFloat(taxaAgendamento.toFixed(2)),
            noShow: noShows,
            taxaPresenca: parseFloat(taxaPresenca.toFixed(2))
          },
          evolutionData
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
      // Calcular range de mês/ano
      const startMonth = startDate.getMonth() + 1;
      const startYear = startDate.getFullYear();
      const endMonth = endDate.getMonth() + 1;
      const endYear = endDate.getFullYear();

      // Buscar custos e filtrar no código para maior robustez
      let query = supabaseClient
        .from('custos')
        .select('valor_mensal, mes, ano')
        .eq('canal', 'marketing');

      // Se mesmo ano, filtrar por mês
      if (startYear === endYear) {
        query = query.eq('ano', startYear).gte('mes', startMonth).lte('mes', endMonth);
      } else {
        // Range multi-ano: (ano > startYear OR (ano = startYear AND mes >= startMonth)) AND (ano < endYear OR (ano = endYear AND mes <= endMonth))
        query = query.gte('ano', startYear).lte('ano', endYear);
      }

      const { data: custosData, error: custosError } = await query;

      if (custosError) throw custosError;

      // Filtrar manualmente para garantir range correto em casos multi-ano
      const custos = custosData?.filter(c => {
        if (c.ano > startYear && c.ano < endYear) return true;
        if (c.ano === startYear && c.mes >= startMonth) return true;
        if (c.ano === endYear && c.mes <= endMonth) return true;
        return false;
      }) || [];

      const custoTotal = custos.reduce((sum, c) => sum + (parseFloat(c.valor_mensal || '0') || 0), 0);

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

      // 5. Evolution Data (por semana)
      const diasNoPeriodo = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const weeksInPeriod = Math.ceil(diasNoPeriodo / 7);
      const evolutionData = [];
      for (let week = 1; week <= weeksInPeriod; week++) {
        const weekStart = new Date(startDate.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(Math.min(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1, endDate.getTime()));
        
        const { data: weekLeads } = await supabaseClient
          .from('ghl_contacts')
          .select('id')
          .gte('date_added', weekStart.toISOString())
          .lte('date_added', weekEnd.toISOString());
        
        const { data: weekSales } = await supabaseClient
          .from('gtm_events')
          .select('event_data')
          .eq('event_name', 'purchase')
          .gte('timestamp', weekStart.toISOString())
          .lte('timestamp', weekEnd.toISOString());
        
        let weekReceita = 0;
        weekSales?.forEach(event => {
          try {
            const data = typeof event.event_data === 'string' ? JSON.parse(event.event_data) : event.event_data;
            if (data.value) weekReceita += parseFloat(data.value) || 0;
          } catch (e) {}
        });
        
        evolutionData.push({
          periodo: `Sem ${week}`,
          leads: weekLeads?.length || 0,
          vendas: weekSales?.length || 0,
          receita: weekReceita
        });
      }

      return new Response(
        JSON.stringify({
          funnel: 'marketing',
          period: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
          metrics: {
            leads: totalLeads,
            vendas: totalVendas,
            receita: receitaTotal,
            custoTotal: custoTotal,
            cpl: parseFloat(cpl.toFixed(2)),
            cpa: parseFloat(cpa.toFixed(2)),
            taxaConversao: parseFloat(taxaConversao.toFixed(2))
          },
          evolutionData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid funnel type. Use "comercial" or "marketing"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // Type narrowing para acessar error.message com segurança
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in get-funnel-metrics:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
