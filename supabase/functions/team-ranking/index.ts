import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'
import { getGTMSales } from './handlers/gtm-sales.ts'
import { getCRMSales, getContacts, getMeetings, getAppointments } from './handlers/crm-data.ts'
import {
  createContactMaps,
  processGTMSales,
  processCRMSales,
  buildTeamMembers,
  separateByRole,
  type TeamMember,
  type UserStats
} from './handlers/calculate-ranking.ts'

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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Obter o header de autorização (já verificado pelo Gateway)
    const authHeader = req.headers.get('Authorization')!

    // Criar cliente com contexto do usuário para RLS
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

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

    // Fetch all data in parallel
    const [gtmSales, crmSales, contacts, meetings, appointments] = await Promise.all([
      getGTMSales(supabase, startDate, endDate),
      getCRMSales(supabase, startDate, endDate),
      getContacts(supabase),
      getMeetings(supabase, startDate, endDate),
      getAppointments(supabase, startDate, endDate)
    ])

    // Create contact maps for linking
    const contactMaps = createContactMaps(contacts)

    // Initialize stats for all users
    const userStats = new Map<string, UserStats>()
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

    // Process GTM sales
    const totalGtmValue = processGTMSales(gtmSales, crmSales, contactMaps, userStats)

    // Process CRM sales
    const totalCrmValue = processCRMSales(crmSales, contactMaps.contactToUser, userStats)

    // Count meetings per user
    meetings.forEach(meeting => {
      if (meeting.assignedUserId && userStats.has(meeting.assignedUserId)) {
        const stats = userStats.get(meeting.assignedUserId)!
        stats.meetings_count++
      }
    })

    // Count appointments per user
    appointments.forEach(appointment => {
      if (appointment.assignedUserId && userStats.has(appointment.assignedUserId)) {
        const stats = userStats.get(appointment.assignedUserId)!
        stats.appointments_count++
      }
    })

    // Build team members array
    const teamMembers = buildTeamMembers(users || [], userStats)

    // Separate closers and SDRs
    const { closers, sdrs } = separateByRole(teamMembers)

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
