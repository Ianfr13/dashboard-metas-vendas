import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from './_shared/cors.ts';
import { getMetaPrincipal, getSubMetas } from './handlers/meta.ts';
import { aggregateSales } from './handlers/sales.ts';
import { getProducts } from './handlers/products.ts';
import { calculateMetrics, updateSubMetas } from './handlers/metrics.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header (optional for development)
    const authHeader = req.headers.get('Authorization');
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    });

    // Try to verify user if auth header is present (optional)
    let user = null;
    if (authHeader) {
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      if (!userError && authUser) {
        user = authUser;
        console.log('Authenticated user:', user.email);
      }
    }
    
    // Log if running without authentication (development mode)
    if (!user) {
      console.warn('Running without authentication - development mode');
    }

    // Get query parameters
    const url = new URL(req.url);
    const month = parseInt(url.searchParams.get('month') || new Date().getMonth() + 1);
    const year = parseInt(url.searchParams.get('year') || new Date().getFullYear());

    // Fetch data in parallel for better performance
    const [metaPrincipal, salesData, products] = await Promise.all([
      getMetaPrincipal(supabase, month, year),
      aggregateSales(supabase, month, year),
      getProducts(supabase),
    ]);

    // Fetch sub-metas only if meta exists
    let subMetas = metaPrincipal
      ? await getSubMetas(supabase, metaPrincipal.id)
      : [];

    // Update sub-metas automatically based on current revenue
    if (metaPrincipal && salesData.revenue > 0) {
      await updateSubMetas(supabase, metaPrincipal.id, salesData.revenue);
      // Re-fetch sub-metas after update
      subMetas = await getSubMetas(supabase, metaPrincipal.id);
    }

    // Calculate progress
    const progress = metaPrincipal
      ? (salesData.revenue / metaPrincipal.valor_meta) * 100
      : 0;

    // Calculate date range for response
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

    // Calculate advanced metrics
    const metrics = metaPrincipal
      ? await calculateMetrics(supabase, metaPrincipal.id, salesData.revenue, startDate, endDate)
      : null;

    // Return aggregated data
    return new Response(
      JSON.stringify({
        meta: metaPrincipal,
        subMetas,
        totals: {
          sales: salesData.sales,
          revenue: salesData.revenue,
          progress: Math.round(progress * 100) / 100,
        },
        metrics,
        salesByDay: salesData.salesByDay,
        products,
        period: {
          month,
          year,
          startDate,
          endDate,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in get-dashboard-data:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
