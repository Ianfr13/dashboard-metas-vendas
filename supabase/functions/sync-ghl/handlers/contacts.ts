import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface GHLContact {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  assignedTo?: string;
  tags?: string[];
  source?: string;
  [key: string]: any;
}

/**
 * Busca contatos do GoHighLevel
 */
export async function fetchGHLContacts(
  apiKey: string,
  locationId: string,
  startDate?: string
): Promise<GHLContact[]> {
  let allContacts: GHLContact[] = [];
  let nextCursor: string | null = null;

  do {
    const url = new URL('https://services.leadconnectorhq.com/contacts/');
    url.searchParams.append('locationId', locationId);
    if (startDate) {
      url.searchParams.append('startAfter', startDate);
    }
    if (nextCursor) {
      url.searchParams.append('cursor', nextCursor);
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Version': '2021-07-28',
      },
    });

    if (!response.ok) {
      throw new Error(`GHL API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    allContacts = allContacts.concat(data.contacts || []);
    nextCursor = data.meta?.nextCursor || null;

    // Limite de segurança para não travar
    if (allContacts.length >= 10000) {
      console.warn('Reached 10k contacts limit, stopping pagination');
      break;
    }
  } while (nextCursor);

  return allContacts;
}

/**
 * Sincroniza contatos do GHL com o Supabase
 */
export async function syncContacts(
  supabase: SupabaseClient,
  apiKey: string,
  locationId: string,
  startDate?: string
): Promise<{ synced: number; errors: string[] }> {
  const errors: string[] = [];
  let synced = 0;

  try {
    const ghlContacts = await fetchGHLContacts(apiKey, locationId, startDate);

    for (const contact of ghlContacts) {
      try {
        const fullName = contact.name || 
          `${contact.firstName || ''} ${contact.lastName || ''}`.trim() ||
          'Sem nome';

        const { error } = await supabase
          .from('ghl_contacts')
          .upsert({
            id: contact.id,
            name: fullName,
            email: contact.email,
            phone: contact.phone,
            assigned_user_id: contact.assignedTo,
            tags: contact.tags || [],
            source: contact.source,
            ghl_data: contact,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'id',
          });

        if (error) {
          errors.push(`Contact ${contact.id}: ${error.message}`);
        } else {
          synced++;
        }
      } catch (err) {
        errors.push(`Contact ${contact.id}: ${err.message}`);
      }
    }
  } catch (err) {
    errors.push(`Fetch contacts error: ${err.message}`);
  }

  return { synced, errors };
}
