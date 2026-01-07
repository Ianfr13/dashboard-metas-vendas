import { SupabaseClient } from 'jsr:@supabase/supabase-js@2';

export async function getProducts(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return data || [];
}
