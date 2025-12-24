import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Edge Function: validate-email-domain
 * 
 * Propósito: Validar se o email do usuário pertence ao domínio @douravita.com.br
 * 
 * Esta função é chamada via webhook após cada login do Google OAuth.
 * Se o email não for do domínio permitido, o usuário é deslogado automaticamente.
 * 
 * Domínios permitidos:
 * - @douravita.com.br
 */

const ALLOWED_DOMAINS = ['douravita.com.br'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Webhook do Supabase Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const body = await req.json();
    const { type, user } = body;

    // Apenas processar eventos de login
    if (type !== 'user.created' && type !== 'user.signed_in') {
      return new Response(
        JSON.stringify({ success: true, message: 'Event ignored' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    if (!user || !user.email) {
      throw new Error('User or email not found in webhook payload');
    }

    const email = user.email.toLowerCase();
    const emailDomain = email.split('@')[1];

    console.log(`Validating email: ${email}, domain: ${emailDomain}`);

    // Verificar se o domínio é permitido
    if (!ALLOWED_DOMAINS.includes(emailDomain)) {
      console.warn(`Unauthorized domain: ${emailDomain} for user ${user.id}`);

      // Deslogar o usuário
      const { error: signOutError } = await supabaseAdmin.auth.admin.signOut(user.id);
      
      if (signOutError) {
        console.error('Error signing out user:', signOutError);
      }

      // Deletar o usuário do banco
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
      
      if (deleteError) {
        console.error('Error deleting user:', deleteError);
      }

      return new Response(
        JSON.stringify({
          success: false,
          message: `Access denied. Only @douravita.com.br emails are allowed.`,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      );
    }

    console.log(`Email validated successfully: ${email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email domain validated successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error validating email domain:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
