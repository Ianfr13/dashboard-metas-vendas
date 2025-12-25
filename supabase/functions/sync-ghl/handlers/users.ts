import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface GHLUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  [key: string]: any;
}

/**
 * Busca usuários (vendedores) do GoHighLevel
 */
export async function fetchGHLUsers(apiKey: string, locationId: string): Promise<GHLUser[]> {
  const response = await fetch(
    `https://services.leadconnectorhq.com/users/?locationId=${locationId}`,
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Version': '2021-07-28',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`GHL API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.users || [];
}

/**
 * Sincroniza usuários do GHL com o Supabase
 */
export async function syncUsers(
  supabase: SupabaseClient,
  apiKey: string,
  locationId: string
): Promise<{ synced: number; errors: string[] }> {
  const errors: string[] = [];
  let synced = 0;

  try {
    // Buscar usuários do GHL
    const ghlUsers = await fetchGHLUsers(apiKey, locationId);

    // Inserir/atualizar no Supabase
    for (const user of ghlUsers) {
      try {
        const { error } = await supabase
          .from('ghl_users')
          .upsert({
            id: user.id,
            name: user.name || user.firstName + ' ' + user.lastName,
            email: user.email,
            phone: user.phone,
            role: user.role || user.type,
            active: user.deleted !== true,
            ghl_data: user,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'id',
          });

        if (error) {
          errors.push(`User ${user.id}: ${error.message}`);
        } else {
          synced++;
        }
      } catch (err) {
        errors.push(`User ${user.id}: ${err.message}`);
      }
    }
  } catch (err) {
    errors.push(`Fetch users error: ${err.message}`);
  }

  return { synced, errors };
}
