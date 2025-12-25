import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Calcula similaridade entre duas strings (Levenshtein distance normalizado)
 */
function stringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1.0;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

interface GTMPurchaseEvent {
  id: number;
  event_name: string;
  event_data: any;
  created_at: string;
}

interface CRMContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface MatchResult {
  contact_id: string;
  contact_name: string;
  gtm_event_id: number;
  transaction_id?: string;
  purchase_value: number;
  purchase_date: string;
  match_confidence: number;
  match_method: string;
}

/**
 * Faz match entre eventos de compra do GTM e contatos do CRM
 */
export async function matchGTMWithCRM(
  supabase: SupabaseClient,
  startDate?: string
): Promise<{ matched: number; errors: string[] }> {
  const errors: string[] = [];
  let matched = 0;

  try {
    // Buscar eventos de compra do GTM que ainda não foram matcheados
    let query = supabase
      .from('gtm_events')
      .select('id, event_name, event_data, created_at')
      .eq('event_name', 'purchase');

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    const { data: gtmEvents, error: gtmError } = await query;

    if (gtmError) {
      throw new Error(`Error fetching GTM events: ${gtmError.message}`);
    }

    if (!gtmEvents || gtmEvents.length === 0) {
      return { matched: 0, errors: [] };
    }

    // Buscar todos os contatos do CRM
    const { data: crmContacts, error: crmError } = await supabase
      .from('ghl_contacts')
      .select('id, name, email, phone');

    if (crmError) {
      throw new Error(`Error fetching CRM contacts: ${crmError.message}`);
    }

    if (!crmContacts || crmContacts.length === 0) {
      errors.push('No CRM contacts found');
      return { matched: 0, errors };
    }

    // Para cada evento de compra, tentar fazer match
    for (const event of gtmEvents as GTMPurchaseEvent[]) {
      try {
        const eventData = event.event_data || {};
        const customerName = eventData.customer_name || eventData.name || eventData.user_name;

        if (!customerName) {
          errors.push(`Event ${event.id}: No customer name found`);
          continue;
        }

        // Tentar match por nome
        let bestMatch: CRMContact | null = null;
        let bestScore = 0;
        let matchMethod = 'fuzzy_name';

        for (const contact of crmContacts as CRMContact[]) {
          // Match exato
          if (contact.name.toLowerCase() === customerName.toLowerCase()) {
            bestMatch = contact;
            bestScore = 1.0;
            matchMethod = 'exact_name';
            break;
          }

          // Match por similaridade
          const similarity = stringSimilarity(contact.name, customerName);
          if (similarity > bestScore && similarity >= 0.8) {
            bestMatch = contact;
            bestScore = similarity;
          }
        }

        // Se não encontrou match bom o suficiente, tentar por email ou telefone
        if (!bestMatch || bestScore < 0.8) {
          const customerEmail = eventData.email;
          const customerPhone = eventData.phone;

          if (customerEmail) {
            const emailMatch = (crmContacts as CRMContact[]).find(
              c => c.email && c.email.toLowerCase() === customerEmail.toLowerCase()
            );
            if (emailMatch) {
              bestMatch = emailMatch;
              bestScore = 1.0;
              matchMethod = 'email';
            }
          }

          if (!bestMatch && customerPhone) {
            const phoneMatch = (crmContacts as CRMContact[]).find(
              c => c.phone && c.phone.replace(/\D/g, '') === customerPhone.replace(/\D/g, '')
            );
            if (phoneMatch) {
              bestMatch = phoneMatch;
              bestScore = 1.0;
              matchMethod = 'phone';
            }
          }
        }

        // Se encontrou um match, salvar
        if (bestMatch && bestScore >= 0.8) {
          const matchData: MatchResult = {
            contact_id: bestMatch.id,
            contact_name: bestMatch.name,
            gtm_event_id: event.id,
            transaction_id: eventData.transaction_id,
            purchase_value: parseFloat(eventData.value || eventData.revenue || 0),
            purchase_date: event.created_at,
            match_confidence: Math.round(bestScore * 100) / 100,
            match_method: matchMethod,
          };

          const { error: matchError } = await supabase
            .from('crm_gtm_sync')
            .insert(matchData);

          if (matchError) {
            // Se já existe, tentar atualizar
            if (matchError.code === '23505') { // Unique violation
              const { error: updateError } = await supabase
                .from('crm_gtm_sync')
                .update({
                  match_confidence: matchData.match_confidence,
                  match_method: matchData.match_method,
                })
                .eq('gtm_event_id', event.id);

              if (updateError) {
                errors.push(`Event ${event.id}: ${updateError.message}`);
              } else {
                matched++;
              }
            } else {
              errors.push(`Event ${event.id}: ${matchError.message}`);
            }
          } else {
            matched++;
          }
        } else {
          errors.push(`Event ${event.id}: No match found for "${customerName}" (best score: ${bestScore.toFixed(2)})`);
        }
      } catch (err) {
        errors.push(`Event ${event.id}: ${err.message}`);
      }
    }
  } catch (err) {
    errors.push(`Match error: ${err.message}`);
  }

  return { matched, errors };
}
