import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

interface TeamMember {
  id: string
  name: string
  email: string | null
  role: string | null
  sales_count: number
  sales_value: number
  meetings_count: number
  appointments_count: number
  conversion_rate: number
}

interface RankingResponse {
  best_closer: TeamMember | null
  best_sdr: TeamMember | null
  closers: TeamMember[]
  sdrs: TeamMember[]
  period: {
    start_date: string
    end_date: string
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    const { start_date, end_date } = await req.json().catch(() => ({}))

    // Default to last 30 days if not specified
    const endDate = end_date || new Date().toISOString()
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // Get all users with their roles
    const { data: users, error: usersError } = await supabase
      .from('ghl_users')
      .select('*')
      .eq('active', true)

    if (usersError) {
      throw new Error(`Error fetching users: ${usersError.message}`)
    }

    // Get sales data from crm_gtm_sync
    const { data: sales, error: salesError } = await supabase
      .from('crm_gtm_sync')
      .select('contact_id, purchase_value, purchase_date')
      .gte('purchase_date', startDate)
      .lte('purchase_date', endDate)

    if (salesError) {
      throw new Error(`Error fetching sales: ${salesError.message}`)
    }

    // Get contacts to link sales to users
    const { data: contacts, error: contactsError } = await supabase
      .from('ghl_contacts')
      .select('id, assigned_user_id')

    if (contactsError) {
      throw new Error(`Error fetching contacts: ${contactsError.message}`)
    }

    // Get meetings data
    const { data: meetings, error: meetingsError } = await supabase
      .from('ghl_meetings')
      .select('assigned_user_id, outcome')
      .gte('meeting_date', startDate)
      .lte('meeting_date', endDate)

    if (meetingsError) {
      throw new Error(`Error fetching meetings: ${meetingsError.message}`)
    }

    // Get appointments data
    const { data: appointments, error: appointmentsError } = await supabase
      .from('ghl_appointments')
      .select('assigned_user_id, status')
      .gte('start_time', startDate)
      .lte('start_time', endDate)

    if (appointmentsError) {
      throw new Error(`Error fetching appointments: ${appointmentsError.message}`)
    }

    // Create a map of contact_id to assigned_user_id
    const contactToUser = new Map<string, string>()
    contacts?.forEach(contact => {
      if (contact.assigned_user_id) {
        contactToUser.set(contact.id, contact.assigned_user_id)
      }
    })

    // Calculate stats for each user
    const userStats = new Map<string, {
      sales_count: number
      sales_value: number
      meetings_count: number
      appointments_count: number
    }>()

    // Initialize stats for all users
    users?.forEach(user => {
      userStats.set(user.id, {
        sales_count: 0,
        sales_value: 0,
        meetings_count: 0,
        appointments_count: 0
      })
    })

    // Count sales per user
    sales?.forEach(sale => {
      const userId = contactToUser.get(sale.contact_id)
      if (userId && userStats.has(userId)) {
        const stats = userStats.get(userId)!
        stats.sales_count++
        stats.sales_value += Number(sale.purchase_value || 0)
      }
    })

    // Count meetings per user
    meetings?.forEach(meeting => {
      if (meeting.assigned_user_id && userStats.has(meeting.assigned_user_id)) {
        const stats = userStats.get(meeting.assigned_user_id)!
        stats.meetings_count++
      }
    })

    // Count appointments per user
    appointments?.forEach(appointment => {
      if (appointment.assigned_user_id && userStats.has(appointment.assigned_user_id)) {
        const stats = userStats.get(appointment.assigned_user_id)!
        stats.appointments_count++
      }
    })

    // Build team members array
    const teamMembers: TeamMember[] = users?.map(user => {
      const stats = userStats.get(user.id)!
      const conversion_rate = stats.appointments_count > 0
        ? (stats.sales_count / stats.appointments_count) * 100
        : 0

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        sales_count: stats.sales_count,
        sales_value: stats.sales_value,
        meetings_count: stats.meetings_count,
        appointments_count: stats.appointments_count,
        conversion_rate: Math.round(conversion_rate * 100) / 100
      }
    }) || []

    // Separate closers and SDRs (assuming role field contains this info)
    const closers = teamMembers
      .filter(member => member.role?.toLowerCase().includes('closer') || member.role?.toLowerCase().includes('vendedor'))
      .sort((a, b) => b.sales_value - a.sales_value)

    const sdrs = teamMembers
      .filter(member => member.role?.toLowerCase().includes('sdr') || member.role?.toLowerCase().includes('agendador'))
      .sort((a, b) => b.appointments_count - a.appointments_count)

    // If no role is set, separate by performance
    if (closers.length === 0 && sdrs.length === 0) {
      // Users with more sales are closers
      const sortedBySales = [...teamMembers].sort((a, b) => b.sales_count - a.sales_count)
      const sortedByAppointments = [...teamMembers].sort((a, b) => b.appointments_count - a.appointments_count)
      
      closers.push(...sortedBySales.filter(m => m.sales_count > 0))
      sdrs.push(...sortedByAppointments.filter(m => m.appointments_count > 0 && !closers.includes(m)))
    }

    const response: RankingResponse = {
      best_closer: closers[0] || null,
      best_sdr: sdrs[0] || null,
      closers,
      sdrs,
      period: {
        start_date: startDate,
        end_date: endDate
      }
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('Error in team-ranking function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
