import { GTMSale } from './gtm-sales.ts'
import { CRMSale, Contact } from './crm-data.ts'

export interface TeamMember {
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

export interface UserStats {
  gtm_sales_count: number
  gtm_sales_value: number
  crm_sales_count: number
  crm_sales_value: number
  meetings_count: number
  appointments_count: number
  matched_transactions: Set<string>
}

export function createContactMaps(contacts: Contact[]) {
  const contactToUser = new Map<string, string>()
  const contactByEmail = new Map<string, string>()
  const contactByPhone = new Map<string, string>()
  
  contacts.forEach(contact => {
    if (contact.assignedUserId) {
      contactToUser.set(contact.id, contact.assignedUserId)
      if (contact.email) {
        contactByEmail.set(contact.email.toLowerCase(), contact.assignedUserId)
      }
      if (contact.phone) {
        contactByPhone.set(contact.phone.replace(/\D/g, ''), contact.assignedUserId)
      }
    }
  })

  return { contactToUser, contactByEmail, contactByPhone }
}

export function processGTMSales(
  gtmSales: GTMSale[],
  crmSales: CRMSale[],
  contactMaps: ReturnType<typeof createContactMaps>,
  userStats: Map<string, UserStats>
): number {
  const { contactToUser, contactByEmail } = contactMaps
  
  // Create map of transaction_id from CRM
  const crmTransactionIds = new Set<string>()
  crmSales.forEach(sale => {
    if (sale.transactionId) {
      crmTransactionIds.add(sale.transactionId)
    }
  })

  let totalGtmValue = 0

  gtmSales.forEach(sale => {
    totalGtmValue += sale.value

    // Tentar encontrar vendedor responsável
    let userId = null
    
    // 1. Tentar por email do usuário
    if (sale.userEmail && contactByEmail.has(sale.userEmail.toLowerCase())) {
      userId = contactByEmail.get(sale.userEmail.toLowerCase())
    }
    
    // 2. Se tem transaction_id, verificar no CRM
    if (!userId && sale.transactionId && crmTransactionIds.has(sale.transactionId)) {
      const crmSale = crmSales.find(s => s.transactionId === sale.transactionId)
      if (crmSale) {
        userId = contactToUser.get(crmSale.contactId) || null
      }
    }

    if (userId && userStats.has(userId)) {
      const stats = userStats.get(userId)!
      stats.gtm_sales_count++
      stats.gtm_sales_value += sale.value
      if (sale.transactionId) {
        stats.matched_transactions.add(sale.transactionId)
      }
    }
  })

  return totalGtmValue
}

export function processCRMSales(
  crmSales: CRMSale[],
  contactToUser: Map<string, string>,
  userStats: Map<string, UserStats>
): number {
  let totalCrmValue = 0

  crmSales.forEach(sale => {
    const userId = contactToUser.get(sale.contactId)
    totalCrmValue += sale.value
    
    if (userId && userStats.has(userId)) {
      const stats = userStats.get(userId)!
      stats.crm_sales_count++
      stats.crm_sales_value += sale.value
    }
  })

  return totalCrmValue
}

export function buildTeamMembers(
  users: any[],
  userStats: Map<string, UserStats>
): TeamMember[] {
  return users.map(user => {
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
  })
}

export function separateByRole(teamMembers: TeamMember[]) {
  let closers = teamMembers
    .filter(member => member.role?.toLowerCase().includes('closer') || member.role?.toLowerCase().includes('vendedor'))
    .sort((a, b) => b.sales_value - a.sales_value)

  let sdrs = teamMembers
    .filter(member => member.role?.toLowerCase().includes('sdr') || member.role?.toLowerCase().includes('agendador'))
    .sort((a, b) => b.appointments_count - a.appointments_count)

  // If no role is set, separate by performance
  if (closers.length === 0 && sdrs.length === 0) {
    const sortedBySales = [...teamMembers].sort((a, b) => b.sales_count - a.sales_count)
    const sortedByAppointments = [...teamMembers].sort((a, b) => b.appointments_count - a.appointments_count)
    
    closers = sortedBySales.filter(m => m.sales_count > 0)
    sdrs = sortedByAppointments.filter(m => m.appointments_count > 0 && !closers.includes(m))
  }

  return { closers, sdrs }
}
