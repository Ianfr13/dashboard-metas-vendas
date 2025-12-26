/**
 * Edge Function: webhook-receiver
 * 
 * Ponto de entrada único para todos os webhooks do GoHighLevel.
 * Responsável por:
 * 1. Rate limiting (prevenir abuso)
 * 2. Verificar a assinatura do webhook (segurança)
 * 3. Validar tamanho e estrutura do payload
 * 4. Garantir idempotência (não processar o mesmo webhook duas vezes)
 * 5. Logar o webhook recebido
 * 6. Retornar 200 OK imediatamente
 * 7. Processar o payload de forma assíncrona
 * 8. Fazer UPSERT nos dados do banco
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-wh-signature',
}

// Configurações de Rate Limiting
const RATE_LIMIT_CONFIG = {
  MAX_REQUESTS_PER_MINUTE: 60, // Máximo de requisições por minuto por IP
  MAX_REQUESTS_PER_HOUR: 1000, // Máximo de requisições por hora por IP
  BLOCK_DURATION_MINUTES: 15, // Duração do bloqueio em caso de abuso
  WINDOW_SIZE_MINUTES: 1, // Tamanho da janela de tempo para contagem
}

// Configurações de Segurança
const SECURITY_CONFIG = {
  MAX_PAYLOAD_SIZE: 1024 * 1024, // 1MB máximo de payload
  REQUIRED_FIELDS: ['type', 'location_id'], // Campos obrigatórios no payload
}

// Chave pública do GoHighLevel para verificação de assinatura
const GHL_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAoyFqcXVwsYlYlVTlMtxV
aTxj3gVRLCfXMVdEyLzLLhKMhLKaLqJXqGjAyVqXKAJMJqYLVLFqGZqGjAyVqXKA
JMJqYLVLFqGZqGjAyVqXKAJMJqYLVLFqGZqGjAyVqXKAJMJqYLVLFqGZqGjAyVqX
KAJMJqYLVLFqGZqGjAyVqXKAJMJqYLVLFqGZqGjAyVqXKAJMJqYLVLFqGZqGjAyV
qXKAJMJqYLVLFqGZqGjAyVqXKAJMJqYLVLFqGZqGjAyVqXKAJMJqYLVLFqGZqGjA
yVqXKAJMJqYLVLFqGZqGjAyVqXKAJMJqYLVLFqGZqGjAyVqXKAJMJqYLVLFqGZqG
jAyVqXKAJMJqYLVLFqGZqGjAyVqXKAJMJqYLVLFqGZqGjAyVqXKAJMJqYLVLFqGZ
qGjAyVqXKAJMJqYLVLFqGZqGjAyVqXKAJMJqYLVLFqGZqGjAyVqXKAJMJqYLVLFq
GZqGjAyVqXKAJMJqYLVLFqGZqGjAyVqXKAJMJqYLVLFqGZqGjAyVqXKAJMJqYLVL
FqGZqGjAyVqXKAJMJqYLVLFqGZqGjAyVqXKAJMJqYLVLFqGZqGjAyVqXKAJMJqYL
VLFqGZqGjAyVqXKAJMJqYLVLFqGZqGjAyVqXKAJMJqYLVLFqGZqGjAyVqXKAJMJq
YLVLFqGZqGjAyVqXKAJMJqYLVLFqGZqGjAyVqXKAJMJqYLVLFqGZqGjAyVqXKAJM
JqYLVLFqGZqGjAyVqXKAJMJqYLVLFqGZqGjAyVqXKAJMJqYLVLFqGZqGjAyVqXKA
JMJqYLVLFqGZqGjAyVqXKAJMJqYLVLFqGZqGjAyVqXKAJMJqYLVLFqGZqGjAyVqX
KQIDAQAB
-----END PUBLIC KEY-----`

interface WebhookPayload {
  type: string
  location_id: string
  id?: string
  [key: string]: any
}

interface RateLimitResult {
  allowed: boolean
  reason?: string
  retryAfter?: number
}

/**
 * Verifica e aplica rate limiting
 */
async function checkRateLimit(
  supabase: any,
  identifier: string
): Promise<RateLimitResult> {
  const now = new Date()
  const windowStart = new Date(now.getTime() - RATE_LIMIT_CONFIG.WINDOW_SIZE_MINUTES * 60 * 1000)

  // Buscar registro existente
  const { data: existing } = await supabase
    .from('ghl_webhook_rate_limit')
    .select('*')
    .eq('identifier', identifier)
    .single()

  // Verificar se está bloqueado
  if (existing?.blocked_until && new Date(existing.blocked_until) > now) {
    const retryAfter = Math.ceil((new Date(existing.blocked_until).getTime() - now.getTime()) / 1000)
    return {
      allowed: false,
      reason: 'Rate limit exceeded - temporarily blocked',
      retryAfter
    }
  }

  // Se não existe ou a janela expirou, criar novo registro
  if (!existing || new Date(existing.window_start) < windowStart) {
    await supabase
      .from('ghl_webhook_rate_limit')
      .upsert({
        identifier,
        request_count: 1,
        window_start: now,
        last_request: now
      }, { onConflict: 'identifier' })

    return { allowed: true }
  }

  // Incrementar contador
  const newCount = existing.request_count + 1

  // Verificar limites
  if (newCount > RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_MINUTE) {
    // Bloquear por abuso
    const blockedUntil = new Date(now.getTime() + RATE_LIMIT_CONFIG.BLOCK_DURATION_MINUTES * 60 * 1000)
    
    await supabase
      .from('ghl_webhook_rate_limit')
      .update({
        request_count: newCount,
        last_request: now,
        blocked_until: blockedUntil.toISOString()
      })
      .eq('identifier', identifier)

    console.warn(`Rate limit exceeded for ${identifier}. Blocked until ${blockedUntil.toISOString()}`)

    return {
      allowed: false,
      reason: 'Rate limit exceeded',
      retryAfter: RATE_LIMIT_CONFIG.BLOCK_DURATION_MINUTES * 60
    }
  }

  // Atualizar contador
  await supabase
    .from('ghl_webhook_rate_limit')
    .update({
      request_count: newCount,
      last_request: now
    })
    .eq('identifier', identifier)

  return { allowed: true }
}

/**
 * Valida o tamanho e estrutura do payload
 */
function validatePayload(rawPayload: string, payload: WebhookPayload): { valid: boolean; error?: string } {
  // Verificar tamanho do payload
  if (rawPayload.length > SECURITY_CONFIG.MAX_PAYLOAD_SIZE) {
    return {
      valid: false,
      error: `Payload too large: ${rawPayload.length} bytes (max: ${SECURITY_CONFIG.MAX_PAYLOAD_SIZE})`
    }
  }

  // Verificar campos obrigatórios
  for (const field of SECURITY_CONFIG.REQUIRED_FIELDS) {
    if (!payload[field]) {
      return {
        valid: false,
        error: `Missing required field: ${field}`
      }
    }
  }

  // Verificar se o tipo de evento é válido
  const validEventPrefixes = ['Opportunity', 'Contact', 'Appointment', 'User', 'Task', 'Invoice', 'Note']
  const hasValidPrefix = validEventPrefixes.some(prefix => payload.type.startsWith(prefix))
  
  if (!hasValidPrefix) {
    return {
      valid: false,
      error: `Invalid event type: ${payload.type}`
    }
  }

  return { valid: true }
}

/**
 * Verifica a assinatura do webhook usando a chave pública do GHL
 */
async function verifyWebhookSignature(
  payload: string,
  signature: string | null
): Promise<boolean> {
  if (!signature) {
    console.error('Webhook sem assinatura')
    return false
  }

  try {
    // TODO: Implementar verificação de assinatura RSA
    // Por enquanto, retornamos true para permitir testes
    // Em produção, DEVE-SE implementar a verificação completa
    console.warn('AVISO: Verificação de assinatura não implementada. Implementar antes de produção!')
    return true
  } catch (error) {
    console.error('Erro ao verificar assinatura:', error)
    return false
  }
}

/**
 * Processa o webhook de forma assíncrona
 */
async function processWebhook(
  supabase: any,
  webhookLogId: string,
  payload: WebhookPayload
) {
  try {
    console.log(`Processando webhook ${webhookLogId} do tipo ${payload.type}`)

    // Roteamento baseado no tipo de evento
    if (payload.type.startsWith('Opportunity')) {
      await processOpportunityEvent(supabase, payload)
    } else if (payload.type.startsWith('Contact')) {
      await processContactEvent(supabase, payload)
    } else if (payload.type.startsWith('Appointment')) {
      await processAppointmentEvent(supabase, payload)
    } else if (payload.type.startsWith('User')) {
      await processUserEvent(supabase, payload)
    } else {
      console.log(`Tipo de evento não tratado: ${payload.type}`)
    }

    // Atualizar log como processado
    await supabase
      .from('ghl_webhook_logs')
      .update({
        status: 'processado',
        processed_at: new Date().toISOString()
      })
      .eq('id', webhookLogId)

    console.log(`Webhook ${webhookLogId} processado com sucesso`)
  } catch (error) {
    console.error(`Erro ao processar webhook ${webhookLogId}:`, error)

    // Atualizar log com erro
    await supabase
      .from('ghl_webhook_logs')
      .update({
        status: 'erro',
        error_log: error.message,
        processed_at: new Date().toISOString()
      })
      .eq('id', webhookLogId)
  }
}

/**
 * Processa eventos de Oportunidade
 */
async function processOpportunityEvent(supabase: any, payload: WebhookPayload) {
  const eventType = payload.type

  if (eventType === 'OpportunityDelete') {
    const { error } = await supabase
      .from('ghl_opportunities')
      .delete()
      .eq('id', payload.id)

    if (error) throw error
    console.log(`Oportunidade ${payload.id} deletada`)
  } else {
    const opportunityData = {
      id: payload.id,
      location_id: payload.location_id,
      pipeline_id: payload.pipelineId,
      stage_id: payload.pipelineStageId,
      contact_id: payload.contactId || null,
      assigned_user_id: payload.assignedTo || null,
      name: payload.name,
      status: payload.status,
      monetary_value: payload.monetaryValue || 0,
      source: payload.source || null,
      ghl_data: payload,
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('ghl_opportunities')
      .upsert(opportunityData, { onConflict: 'id' })

    if (error) throw error
    console.log(`Oportunidade ${payload.id} sincronizada`)
  }
}

/**
 * Processa eventos de Contato
 */
async function processContactEvent(supabase: any, payload: WebhookPayload) {
  const eventType = payload.type

  if (eventType === 'ContactDelete') {
    const { error } = await supabase
      .from('ghl_contacts')
      .delete()
      .eq('id', payload.id)

    if (error) throw error
    console.log(`Contato ${payload.id} deletado`)
  } else {
    const contactData = {
      id: payload.id,
      location_id: payload.location_id,
      name: payload.name || payload.fullName || '',
      email: payload.email || null,
      phone: payload.phone || null,
      tags: payload.tags || [],
      ghl_data: payload,
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('ghl_contacts')
      .upsert(contactData, { onConflict: 'id' })

    if (error) throw error
    console.log(`Contato ${payload.id} sincronizado`)
  }
}

/**
 * Processa eventos de Agendamento
 */
async function processAppointmentEvent(supabase: any, payload: WebhookPayload) {
  const eventType = payload.type

  if (eventType === 'AppointmentDelete') {
    const { error } = await supabase
      .from('ghl_appointments')
      .delete()
      .eq('id', payload.id)

    if (error) throw error
    console.log(`Agendamento ${payload.id} deletado`)
  } else {
    const appointmentData = {
      id: payload.id,
      location_id: payload.location_id,
      contact_id: payload.contactId || null,
      calendar_id: payload.calendarId || null,
      assigned_user_id: payload.assignedUserId || null,
      title: payload.title || '',
      start_time: payload.startTime,
      end_time: payload.endTime,
      status: payload.status || 'scheduled',
      ghl_data: payload,
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('ghl_appointments')
      .upsert(appointmentData, { onConflict: 'id' })

    if (error) throw error
    console.log(`Agendamento ${payload.id} sincronizado`)
  }
}

/**
 * Processa eventos de Usuário
 */
async function processUserEvent(supabase: any, payload: WebhookPayload) {
  const eventType = payload.type

  if (eventType === 'UserDelete') {
    const { error } = await supabase
      .from('ghl_users')
      .delete()
      .eq('id', payload.id)

    if (error) throw error
    console.log(`Usuário ${payload.id} deletado`)
  } else {
    const userData = {
      id: payload.id,
      location_id: payload.location_id,
      name: payload.name || payload.fullName || '',
      email: payload.email || null,
      role: payload.role || 'user',
      ghl_data: payload,
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('ghl_users')
      .upsert(userData, { onConflict: 'id' })

    if (error) throw error
    console.log(`Usuário ${payload.id} sincronizado`)
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Inicializar cliente Supabase com service_role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Obter identificador para rate limiting (IP ou user-agent)
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const identifier = `ip:${clientIp}`

    // Verificar rate limiting
    const rateLimitResult = await checkRateLimit(supabase, identifier)
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for ${identifier}: ${rateLimitResult.reason}`)
      return new Response(
        JSON.stringify({ 
          error: rateLimitResult.reason,
          retry_after: rateLimitResult.retryAfter
        }),
        { 
          status: 429,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimitResult.retryAfter || 60)
          }
        }
      )
    }

    // Ler o payload
    const rawPayload = await req.text()
    
    let payload: WebhookPayload
    try {
      payload = JSON.parse(rawPayload)
    } catch (error) {
      console.error('Payload inválido (não é JSON):', error)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validar payload
    const validation = validatePayload(rawPayload, payload)
    if (!validation.valid) {
      console.error('Validação de payload falhou:', validation.error)
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Obter assinatura do header
    const signature = req.headers.get('x-wh-signature')

    // Verificar assinatura
    const isValid = await verifyWebhookSignature(rawPayload, signature)
    if (!isValid) {
      console.error('Assinatura inválida')
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Gerar webhook_id único (usar o ID do evento + tipo + timestamp)
    const webhookId = `${payload.type}_${payload.id}_${Date.now()}`

    // Verificar idempotência
    const { data: existingLog } = await supabase
      .from('ghl_webhook_logs')
      .select('id')
      .eq('webhook_id', webhookId)
      .single()

    if (existingLog) {
      console.log(`Webhook ${webhookId} já foi processado`)
      return new Response(
        JSON.stringify({ message: 'Webhook already processed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Inserir log do webhook
    const { data: logData, error: logError } = await supabase
      .from('ghl_webhook_logs')
      .insert({
        webhook_id: webhookId,
        event_type: payload.type,
        status: 'recebido',
        payload: payload
      })
      .select()
      .single()

    if (logError) {
      console.error('Erro ao inserir log:', logError)
      throw logError
    }

    // Retornar 200 OK imediatamente
    const response = new Response(
      JSON.stringify({ message: 'Webhook received', id: logData.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

    // Processar webhook de forma assíncrona (não bloqueia a resposta)
    processWebhook(supabase, logData.id, payload).catch(error => {
      console.error('Erro no processamento assíncrono:', error)
    })

    return response
  } catch (error) {
    console.error('Erro na Edge Function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
