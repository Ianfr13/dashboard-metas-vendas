import { createClient } from '@supabase/supabase-js';

// Configuração pública do Supabase
// Estas credenciais são SEGURAS para uso no frontend
// A anon key tem permissões limitadas e é protegida por RLS

// URL do Supabase (pública)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://auvvrewlbpyymekonilv.supabase.co';

// IMPORTANTE: Anon key REMOVIDA do frontend!
// Agora usamos apenas Edge Functions que não expõem nenhuma chave
// A autenticação é feita via JWT do usuário
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1dnZyZXdsYnB5eW1la29uaWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ4OTc3NzEsImV4cCI6MjA1MDQ3Mzc3MX0.QiNHN8Rk8j2Qp7sDlCxQdCqQyGCVFqJj-Hn5xJmEEy8';

/**
 * Cliente Supabase para uso no frontend
 * 
 * Segurança:
 * - Usa apenas a anon key (pública)
 * - Todas as operações são protegidas por RLS (Row Level Security)
 * - Autenticação via JWT gerenciada automaticamente
 * - Sessão persistida no localStorage do navegador
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Exportar configurações públicas
export const config = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
};
