import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { syncUsers } from './handlers/users.ts';
import { syncContacts } from './handlers/contacts.ts';
import { syncAppointments } from './handlers/appointments.ts';
import { matchGTMWithCRM } from './handlers/match.ts';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar método
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse body
    const { 
      sync_type, 
      start_date, 
      end_date 
    } = await req.json();

    // Validar sync_type
    const validTypes = ['users', 'contacts', 'appointments', 'match', 'all'];
    if (!sync_type || !validTypes.includes(sync_type)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid sync_type',
          valid_types: validTypes 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter credenciais do GHL
    const GHL_API_KEY = Deno.env.get('GHL_API_KEY');
    const GHL_LOCATION_ID = Deno.env.get('GHL_LOCATION_ID');

    if (!GHL_API_KEY || !GHL_LOCATION_ID) {
      return new Response(
        JSON.stringify({ error: 'GHL credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase com service_role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results: any = {
      sync_type,
      timestamp: new Date().toISOString(),
    };

    // Executar sincronização baseado no tipo
    if (sync_type === 'users' || sync_type === 'all') {
      console.log('Syncing users...');
      const userResult = await syncUsers(supabase, GHL_API_KEY, GHL_LOCATION_ID);
      results.users = userResult;
    }

    if (sync_type === 'contacts' || sync_type === 'all') {
      console.log('Syncing contacts...');
      const contactResult = await syncContacts(supabase, GHL_API_KEY, GHL_LOCATION_ID, start_date);
      results.contacts = contactResult;
    }

    if (sync_type === 'appointments' || sync_type === 'all') {
      console.log('Syncing appointments...');
      const appointmentResult = await syncAppointments(
        supabase, 
        GHL_API_KEY, 
        GHL_LOCATION_ID, 
        start_date, 
        end_date
      );
      results.appointments = appointmentResult;
    }

    if (sync_type === 'match' || sync_type === 'all') {
      console.log('Matching GTM with CRM...');
      const matchResult = await matchGTMWithCRM(supabase, start_date);
      results.match = matchResult;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sync completed',
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
