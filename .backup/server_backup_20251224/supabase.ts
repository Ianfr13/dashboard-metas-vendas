import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuração do Supabase
// IMPORTANTE: Apenas a ANON KEY deve ser usada aqui
// A anon key é segura para uso no frontend e backend
// RLS (Row Level Security) protege os dados no nível do banco

const supabaseUrl = process.env.SUPABASE_URL || 'https://auvvrewlbpyymekonilv.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1dnZyZXdsYnB5eW1la29uaWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MTIzNDMsImV4cCI6MjA4MjE4ODM0M30.GfjckpNB1l-LSgvjOqJaMCs1iyNEByuCF2rBv4As0OY';

let supabaseClient: SupabaseClient | null = null;

/**
 * Retorna o cliente Supabase com anon key
 * Esta key é segura para uso no frontend e backend
 * A segurança é garantida pelas políticas RLS no banco de dados
 */
export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false, // Backend não precisa persistir sessão
      },
    });
  }
  return supabaseClient;
}

/**
 * Retorna o cliente Supabase para uso no frontend
 * Mesma configuração, mas com persistência de sessão habilitada
 */
export function getSupabaseForClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true, // Frontend persiste sessão no localStorage
    },
  });
}

export type { SupabaseClient };

// Exportar configurações públicas (seguras para frontend)
export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
};
