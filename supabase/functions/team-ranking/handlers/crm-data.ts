import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

export interface CRMSale {
  contactId: string
  value: number
  transactionId?: string
  purchaseDate: string
}

export interface Contact {
  id: string
  assignedUserId: string | null
  email: string | null
  phone: string | null
}

export interface Meeting {
  assignedUserId: string
  outcome: string
}

export interface Appointment {
  assignedUserId: string
  status: string
}

export async function getCRMSales(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string
): Promise<CRMSale[]> {
  const { data: crmSales, error } = await supabase
    .from('crm_gtm_sync')
    .select('contact_id, purchase_value, purchase_date, transaction_id')
    .gte('purchase_date', startDate)
    .lte('purchase_date', endDate)

  if (error) {
    throw new Error(`Error fetching CRM sales: ${error.message}`)
  }

  return (crmSales || []).map(sale => ({
    contactId: sale.contact_id,
    value: Number(sale.purchase_value || 0),
    transactionId: sale.transaction_id,
    purchaseDate: sale.purchase_date
  }))
}

export async function getContacts(supabase: SupabaseClient): Promise<Contact[]> {
  const { data: contacts, error } = await supabase
    .from('ghl_contacts')
    .select('id, assigned_user_id, email, phone')

  if (error) {
    throw new Error(`Error fetching contacts: ${error.message}`)
  }

  return (contacts || []).map(contact => ({
    id: contact.id,
    assignedUserId: contact.assigned_user_id,
    email: contact.email,
    phone: contact.phone
  }))
}

export async function getMeetings(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string
): Promise<Meeting[]> {
  const { data: meetings, error } = await supabase
    .from('ghl_meetings')
    .select('assigned_user_id, outcome')
    .gte('meeting_date', startDate)
    .lte('meeting_date', endDate)

  if (error) {
    throw new Error(`Error fetching meetings: ${error.message}`)
  }

  return (meetings || []).map(meeting => ({
    assignedUserId: meeting.assigned_user_id,
    outcome: meeting.outcome
  }))
}

export async function getAppointments(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string
): Promise<Appointment[]> {
  const { data: appointments, error } = await supabase
    .from('ghl_appointments')
    .select('assigned_user_id, status')
    .gte('start_time', startDate)
    .lte('start_time', endDate)

  if (error) {
    throw new Error(`Error fetching appointments: ${error.message}`)
  }

  return (appointments || []).map(appointment => ({
    assignedUserId: appointment.assigned_user_id,
    status: appointment.status
  }))
}
