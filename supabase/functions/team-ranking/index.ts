import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

interface TeamMember {
  id: string
  name: string
  email: string | null
  role: string | null
  sales_count: number
  sales_value: number
  gtm_sales_count: number
  gtm_sales_value: number
  crm_sales_count: number
  crm_sales_value: number
  discrepancy: number
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
  summary: {
    total_gtm_sales: number
    total_crm_sales: number
    total_discrepancy: number
    match_percentage: number
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

    // ===== DADOS DO GTM =====
    // Buscar vendas do GTM (purchase events)
    const { data: gtmSales, error: gtmError } = await supabase
      .from('gtm_events')
      .select('*')
      .eq('event_name', 'purchase')
      .gte('timestamp', startDate)
      .lte('timestamp', endDate)

    if (gtmError) {
      throw new Error(`Error fetching GTM sales: ${gtmError.message}`)
    }

    // ===== DADOS DO CRM =====
    // Get sales data from crm_gtm_sync
    const { data: crmSales, error: crmError } = await supabase
      .from('crm_gtm_sync')
      .select('contact_id, purchase_value, purchase_date, transaction_id')
      .gte('purchase_date', startDate)
      .lte('purchase_date', endDate)

    if (crmError) {
      throw new Error(`Error fetching CRM sales: ${crmError.message}`)
    }

    // Get contacts to link sales to users
    const { data: contacts, error: contactsError } = await supabase
      .from('ghl_contacts')
      .select('id, assigned_user_id, email, phone')

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

    // ===== CRUZAMENTO DE DADOS =====
    // Create a map of contact_id to assigned_user_id
    const contactToUser = new Map<string, string>()
    const contactByEmail = new Map<string, string>()
    const contactByPhone = new Map<string, string>()
    
    contacts?.forEach(contact => {
      if (contact.assigned_user_id) {
        contactToUser.set(contact.id, contact.assigned_user_id)
        if (contact.email) {
          contactByEmail.set(contact.email.toLowerCase(), contact.assigned_user_id)
        }
        if (contact.phone) {
          contactByPhone.set(contact.phone.replace(/\D/g, ''), contact.assigned_user_id)
        }
      }
    })

    // Create map of transaction_id from CRM
    const crmTransactionIds = new Set<string>()
    crmSales?.forEach(sale => {
      if (sale.transaction_id) {
        crmTransactionIds.add(sale.transaction_id)
      }
    })

    // Calculate stats for each user
    const userStats = new Map<string, {
      gtm_sales_count: number
      gtm_sales_value: number
      crm_sales_count: number
      crm_sales_value: number
      meetings_count: number
      appointments_count: number
      matched_transactions: Set<string>
    }>()

    // Initialize stats for all users
    users?.forEach(user => {
      userStats.set(user.id, {
        gtm_sales_count: 0,
        gtm_sales_value: 0,
        crm_sales_count: 0,
        crm_sales_value: 0,
        meetings_count: 0,
        appointments_count: 0,
        matched_transactions: new Set()
      })
    })

    // Process GTM sales - tentar associar a vendedor
    let totalGtmValue = 0
    gtmSales?.forEach(sale => {
      try {
        const eventData = JSON.parse(sale.event_data || '{}')
        const value = parseFloat(eventData.value || eventData.transaction_value || '0')
        const transactionId = eventData.transaction_id
        const userEmail = eventData.user_email || sale.user_id
        
        totalGtmValue += value

        // Tentar encontrar vendedor responsável
        let userId = null
        
        // 1. Tentar por email do usuário
        if (userEmail && contactByEmail.has(userEmail.toLowerCase())) {
          userId = contactByEmail.get(userEmail.toLowerCase())
        }
        
        // 2. Se tem transaction_id, verificar no CRM
        if (!userId && transactionId && crmTransactionIds.has(transactionId)) {
          const crmSale = crmSales?.find(s => s.transaction_id === transactionId)
          if (crmSale) {
            userId = contactToUser.get(crmSale.contact_id) || null
          }
        }

        if (userId && userStats.has(userId)) {
          const stats = userStats.get(userId)!
          stats.gtm_sales_count++
          stats.gtm_sales_value += value
          if (transactionId) {
            stats.matched_transactions.add(transactionId)
          }
        }
      } catch (e) {
        console.error('Error processing GTM sale:', e)
      }
    })

    // Process CRM sales
    let totalCrmValue = 0
    crmSales?.forEach(sale => {
      const userId = contactToUser.get(sale.contact_id)
      const value = Number(sale.purchase_value || 0)
      totalCrmValue += value
      
      if (userId && userStats.has(userId)) {
        const stats = userStats.get(userId)!
        stats.crm_sales_count++
        stats.crm_sales_value += value
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

    // Build team members array with hybrid data
    const teamMembers: TeamMember[] = users?.map(user => {
      const stats = userStats.get(user.id)!
      
      // Usar a maior contagem entre GTM e CRM como "oficial"
      const sales_count = Math.max(stats.gtm_sales_count, stats.crm_sales_count)
      const sales_value = Math.max(stats.gtm_sales_value, stats.crm_sales_value)
      
      // Calcular discrepância
      const discrepancy = Math.abs(stats.gtm_sales_value - stats.crm_sales_value)
      
      const conversion_rate = stats.appointments_count > 0
        ? (sales_count / stats.appointments_count) * 100
        : 0

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        sales_count,
        sales_value,
        gtm_sales_count: stats.gtm_sales_count,
        gtm_sales_value: stats.gtm_sales_value,
        crm_sales_count: stats.crm_sales_count,
        crm_sales_value: stats.crm_sales_value,
        discrepancy,
        meetings_count: stats.meetings_count,
        appointments_count: stats.appointments_count,
        conversion_rate: Math.round(conversion_rate * 100) / 100
      }
    }) || []

    // Separate closers and SDRs
    const closers = teamMembers
      .filter(member => member.role?.toLowerCase().includes('closer') || member.role?.toLowerCase().includes('vendedor'))
      .sort((a, b) => b.sales_value - a.sales_value)

    const sdrs = teamMembers
      .filter(member => member.role?.toLowerCase().includes('sdr') || member.role?.toLowerCase().includes('agendador'))
      .sort((a, b) => b.appointments_count - a.appointments_count)

    // If no role is set, separate by performance
    if (closers.length === 0 && sdrs.length === 0) {
      const sortedBySales = [...teamMembers].sort((a, b) => b.sales_count - a.sales_count)
      const sortedByAppointments = [...teamMembers].sort((a, b) => b.appointments_count - a.appointments_count)
      
      closers.push(...sortedBySales.filter(m => m.sales_count > 0))
      sdrs.push(...sortedByAppointments.filter(m => m.appointments_count > 0 && !closers.includes(m)))
    }

    // Calculate summary
    const totalDiscrepancy = Math.abs(totalGtmValue - totalCrmValue)
    const matchPercentage = totalGtmValue > 0 
      ? ((Math.min(totalGtmValue, totalCrmValue) / Math.max(totalGtmValue, totalCrmValue)) * 100)
      : 0

    const response: RankingResponse = {
      best_closer: closers[0] || null,
      best_sdr: sdrs[0] || null,
      closers,
      sdrs,
      period: {
        start_date: startDate,
        end_date: endDate
      },
      summary: {
        total_gtm_sales: totalGtmValue,
        total_crm_sales: totalCrmValue,
        total_discrepancy: totalDiscrepancy,
        match_percentage: Math.round(matchPercentage * 100) / 100
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
