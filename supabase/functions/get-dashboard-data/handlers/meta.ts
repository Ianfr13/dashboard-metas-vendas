import { SupabaseClient } from 'jsr:@supabase/supabase-js@2';

export async function getMetaPrincipal(
  supabase: SupabaseClient,
  month: number,
  year: number
) {
  const { data, error } = await supabase
    .from('metas_principais')
    .select('*')
    .eq('mes', month)
    .eq('ano', year)
    .eq('active', 1)
    .single();

  if (error) {
    console.error('Error fetching meta:', error);
    return null;
  }

  return data;
}

export async function getSubMetas(
  supabase: SupabaseClient,
  metaId: number
) {
  const { data, error } = await supabase
    .from('sub_metas')
    .select('*')
    .eq('meta_principal_id', metaId)
    .order('valor', { ascending: true });

  if (error) {
    console.error('Error fetching sub-metas:', error);
    return [];
  }

  return data || [];
}
