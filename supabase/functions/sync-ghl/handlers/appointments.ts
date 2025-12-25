import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface GHLAppointment {
  id: string;
  contactId?: string;
  assignedUserId?: string;
  title?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  appointmentType?: string;
  notes?: string;
  [key: string]: any;
}

/**
 * Busca agendamentos do GoHighLevel
 */
export async function fetchGHLAppointments(
  apiKey: string,
  locationId: string,
  startDate?: string,
  endDate?: string
): Promise<GHLAppointment[]> {
  const url = new URL('https://services.leadconnectorhq.com/calendars/events');
  url.searchParams.append('locationId', locationId);
  
  if (startDate) {
    url.searchParams.append('startDate', startDate);
  }
  if (endDate) {
    url.searchParams.append('endDate', endDate);
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
  return data.events || [];
}

/**
 * Sincroniza agendamentos do GHL com o Supabase
 */
export async function syncAppointments(
  supabase: SupabaseClient,
  apiKey: string,
  locationId: string,
  startDate?: string,
  endDate?: string
): Promise<{ synced: number; completed: number; errors: string[] }> {
  const errors: string[] = [];
  let synced = 0;
  let completed = 0;

  try {
    const ghlAppointments = await fetchGHLAppointments(apiKey, locationId, startDate, endDate);

    for (const appointment of ghlAppointments) {
      try {
        // Inserir/atualizar agendamento
        const { error: appointmentError } = await supabase
          .from('ghl_appointments')
          .upsert({
            id: appointment.id,
            contact_id: appointment.contactId,
            assigned_user_id: appointment.assignedUserId,
            title: appointment.title,
            start_time: appointment.startTime,
            end_time: appointment.endTime,
            status: appointment.status,
            appointment_type: appointment.appointmentType || appointment.calendarName,
            notes: appointment.notes,
            ghl_data: appointment,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'id',
          });

        if (appointmentError) {
          errors.push(`Appointment ${appointment.id}: ${appointmentError.message}`);
          continue;
        }

        synced++;

        // Se o agendamento foi completado, criar registro em ghl_meetings
        if (appointment.status === 'completed' || appointment.status === 'confirmed') {
          const startTime = new Date(appointment.startTime);
          const endTime = appointment.endTime ? new Date(appointment.endTime) : null;
          const durationMinutes = endTime 
            ? Math.round((endTime.getTime() - startTime.getTime()) / 60000)
            : null;

          const { error: meetingError } = await supabase
            .from('ghl_meetings')
            .upsert({
              id: `meeting_${appointment.id}`,
              appointment_id: appointment.id,
              contact_id: appointment.contactId,
              assigned_user_id: appointment.assignedUserId,
              meeting_date: appointment.startTime,
              duration_minutes: durationMinutes,
              outcome: appointment.status === 'completed' ? 'success' : 'completed',
              notes: appointment.notes,
              ghl_data: appointment,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'id',
            });

          if (meetingError) {
            errors.push(`Meeting for appointment ${appointment.id}: ${meetingError.message}`);
          } else {
            completed++;
          }
        }
      } catch (err) {
        errors.push(`Appointment ${appointment.id}: ${err.message}`);
      }
    }
  } catch (err) {
    errors.push(`Fetch appointments error: ${err.message}`);
  }

  return { synced, completed, errors };
}
