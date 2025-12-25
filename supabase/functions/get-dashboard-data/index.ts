import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getMetaPrincipal, getSubMetas } from './handlers/meta.ts';
import { aggregateSales } from './handlers/sales.ts';
import { getProducts } from './handlers/products.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
    const subMetas = metaPrincipal
      ? await getSubMetas(supabase, metaPrincipal.id)
      : [];

    // Calculate progress
    const progress = metaPrincipal
      ? (salesData.revenue / metaPrincipal.valor_meta) * 100
      : 0;

    // Calculate date range for response
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

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
