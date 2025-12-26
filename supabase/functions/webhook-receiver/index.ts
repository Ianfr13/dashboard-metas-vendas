/**
 * Edge Function: webhook-receiver
 * 
 * Ponto de entrada único para todos os webhooks do GoHighLevel.
 * Responsável por:
 * 1. Validar token de autenticação (X-Webhook-Token)
 * 2. Rate limiting (prevenir abuso)
 * 3. Verificar a assinatura do webhook (segurança)
 * 4. Validar tamanho e estrutura do payload
 * 5. Garantir idempotência (não processar o mesmo webhook duas vezes)
 * 6. Logar o webhook recebido
 * 7. FILTRAR eventos por estágios importantes
 * 8. Retornar 200 OK imediatamente
 * 9. Processar o payload de forma assíncrona
 * 10. Fazer UPSERT nos dados do banco
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers (sincronizado com _shared/cors.ts)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-wh-signature, x-webhook-token',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

// ============================================================================
// CONFIGURAÇÃO DE SEGURANÇA - TOKEN DE AUTENTICAÇÃO
// ============================================================================
/**
 * Valida o token de autenticação enviado via query parameter ?token=XXX
 * 
 * Para configurar:
 * 1. Defina a variável de ambiente WEBHOOK_AUTH_TOKEN no Supabase
 * 2. Configure a URL no GoHighLevel com query parameter:
 *    https://auvvrewlbpyymekonilv.supabase.co/functions/v1/webhook-receiver?token=SEU_TOKEN
 * 3. Se WEBHOOK_AUTH_TOKEN não estiver definida, a validação é DESATIVADA (apenas dev)
 * 
 * Nota: GoHighLevel Marketplace App não suporta custom headers, por isso usamos query parameter
 */
async function validateWebhookToken(request: Request): Promise<{ valid: boolean; error?: string }> {
  const expectedToken = Deno.env.get('WEBHOOK_AUTH_TOKEN')
  
  // Se não houver token configurado, permitir (modo desenvolvimento)
  if (!expectedToken) {
    console.warn(
      'AVISO: WEBHOOK_AUTH_TOKEN não está configurada. ' +
      'Validação de token DESATIVADA. Configure em produção!'
    )
    return { valid: true }
  }
  
  // Obter token do query parameter
  const url = new URL(request.url)
  const receivedToken = url.searchParams.get('token')
  
  if (!receivedToken) {
    return {
      valid: false,
      error: 'Missing authentication token. Query parameter ?token=XXX is required.'
    }
  }
  
  // Comparação segura (constant-time) para prevenir timing attacks
  // Usar crypto.timingSafeEqual requer buffers de mesmo tamanho
  // Então criamos HMACs de tamanho fixo para comparar
  try {
    const encoder = new TextEncoder()
    const secret = Deno.env.get('WEBHOOK_TOKEN_HMAC_SECRET') || 'default-hmac-secret-change-in-production'
    
    // Criar HMAC de ambos os tokens usando Web Crypto API
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const expectedHmac = await crypto.subtle.sign(
      'HMAC',
      keyMaterial,
      encoder.encode(expectedToken)
    )
    
    const receivedHmac = await crypto.subtle.sign(
      'HMAC',
      keyMaterial,
      encoder.encode(receivedToken)
    )
    
    // Comparar HMACs usando timingSafeEqual
    const expectedBuffer = new Uint8Array(expectedHmac)
    const receivedBuffer = new Uint8Array(receivedHmac)
    
    // Deno's crypto.subtle não tem timingSafeEqual nativo,
    // mas podemos usar uma comparação manual constant-time
    if (expectedBuffer.length !== receivedBuffer.length) {
      return {
        valid: false,
        error: 'Invalid authentication token'
      }
    }
    
    let mismatch = 0
    for (let i = 0; i < expectedBuffer.length; i++) {
      mismatch |= expectedBuffer[i] ^ receivedBuffer[i]
    }
    
    if (mismatch !== 0) {
      return {
        valid: false,
        error: 'Invalid authentication token'
      }
    }
    
    return { valid: true }
  } catch (error) {
    console.error('Error in constant-time comparison:', error)
    return {
      valid: false,
      error: 'Authentication error'
    }
  }
}

// ============================================================================
// CONFIGURAÇÃO DE FILTROS - ESTÁGIOS IMPORTANTES
// ============================================================================
// Apenas eventos relacionados a estes estágios serão processados e salvos
// Todos os outros eventos serão logados mas não processados
const ESTAGIOS_IMPORTANTES = [
  'Primeiro Contato',
  'Agendado',
  'Não Compareceu',
  'Reagendamento',
  'Venda Realizada',
  'Venda com Sinal',
  'Venda Perdida'
]

/**
 * Verifica se um estágio é importante
 * Usa apenas o nome do estágio (case-insensitive, remove acentos)
 */
function isImportantStage(stageName: string | null | undefined): boolean {
  if (!stageName) return false
  
  // Verificar por nome (case-insensitive, remove acentos)
  const normalizedStageName = stageName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const isImportant = ESTAGIOS_IMPORTANTES.some(estagio => {
    const normalizedEstagio = estagio.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return normalizedStageName.includes(normalizedEstagio) || normalizedEstagio.includes(normalizedStageName)
  })
  
  return isImportant
}

/**
 * Verifica se um evento deve ser processado
 */
function shouldProcessEvent(payload: WebhookPayload): { process: boolean; reason: string } {
  const eventType = payload.type
  
  // SEMPRE processar eventos de Agendamento (Appointment)
  if (eventType.startsWith('Appointment')) {
    return { process: true, reason: 'Evento de agendamento' }
  }
  
  // Para Oportunidades, verificar o estágio
  if (eventType.startsWith('Opportunity')) {
    const stageName = payload.pipelineStageName || payload.stageName || null
    
    if (isImportantStage(stageName)) {
      return { process: true, reason: `Estágio importante: ${stageName}` }
    }
    
    return { process: false, reason: `Estágio ignorado: ${stageName || 'desconhecido'}` }
  }
  
  // Para Contatos, processar apenas Create (primeiro contato)
  if (eventType === 'ContactCreate') {
    return { process: true, reason: 'Primeiro contato (ContactCreate)' }
  }
  
  // Ignorar outros eventos de contato (Update, Delete)
  if (eventType.startsWith('Contact')) {
    return { process: false, reason: 'Evento de contato não é Create' }
  }
  
  // Ignorar todos os outros tipos de evento
  return { process: false, reason: `Tipo de evento não configurado: ${eventType}` }
}

// ============================================================================
// CONFIGURAÇÕES DE RATE LIMITING E SEGURANÇA
// ============================================================================

const RATE_LIMIT_CONFIG = {
  MAX_REQUESTS_PER_MINUTE: 60, // Máximo de requisições por minuto por IP
  MAX_REQUESTS_PER_HOUR: 1000, // Máximo de requisições por hora por IP
  BLOCK_DURATION_MINUTES: 15, // Duração do bloqueio em caso de abuso
  WINDOW_SIZE_MINUTES: 1, // Tamanho da janela de tempo para contagem
}

const SECURITY_CONFIG = {
  MAX_PAYLOAD_SIZE: 1024 * 1024, // 1MB máximo de payload
  REQUIRED_FIELDS: ['type', 'location_id'], // Campos obrigatórios no payload
}

// Chave pública oficial do GoHighLevel (fallback para desenvolvimento)
// Fonte: https://marketplace.gohighlevel.com/docs/webhook/WebhookIntegrationGuide/
// Em produção, configure a variável de ambiente GHL_PUBLIC_KEY
const GHL_PUBLIC_KEY_FALLBACK = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAokvo/r9tVgcfZ5DysOSC
Frm602qYV0MaAiNnX9O8KxMbiyRKWeL9JpCpVpt4XHIcBOK4u3cLSqJGOLaPuXw6
dO0t6Q/ZVdAV5Phz+ZtzPL16iCGeK9po6D6JHBpbi989mmzMryUnQJezlYJ3DVfB
csedpinheNnyYeFXolrJvcsjDtfAeRx5ByHQmTnSdFUzuAnC9/GepgLT9SM4nCpv
uxmZMxrJt5Rw+VUaQ9B8JSvbMPpez4peKaJPZHBbU3OdeCVx5klVXXZQGNHOs8gF
3kvoV5rTnXV0IknLBXlcKKAQLZcY/Q9rG6Ifi9c+5vqlvHPCUJFT5XUGG5RKgOKU
J062fRtN+rLYZUV+BjafxQauvC8wSWeYja63VSUruvmNj8xkx2zE/Juc+yjLjTXp
IocmaiFeAO6fUtNjDeFVkhf5LNb59vECyrHD2SQIrhgXpO4Q3dVNA5rw576PwTzN
h/AMfHKIjE4xQA1SZuYJmNnmVZLIZBlQAF9Ntd03rfadZ+yDiOXCCs9FkHibELhC
HULgCsnuDJHcrGNd5/Ddm5hxGQ0ASitgHeMZ0kcIOwKDOzOU53lDza6/Y09T7sYJ
PQe7z0cvj7aE4B+Ax1ZoZGPzpJlZtGXCsu9aTEGEnKzmsFqwcSsnw3JB31IGKAyk
T1hhTiaCeIY/OwwwNUY2yvcCAwEAAQ==
-----END PUBLIC KEY-----`

/**
 * Obtém a chave pública do GHL de forma segura
 * Prioriza variável de ambiente, com fallback para a chave oficial
 */
function getGHLPublicKey(): string {
  // Tentar carregar da variável de ambiente primeiro
  const envKey = Deno.env.get('GHL_PUBLIC_KEY')
  
  if (envKey) {
    console.log('Usando chave pública do GHL da variável de ambiente')
    return envKey
  }
  
  // Verificar se estamos em produção
  const requireSignature = Deno.env.get('REQUIRE_WEBHOOK_SIGNATURE') === 'true'
  
  if (requireSignature) {
    // Em produção, a chave DEVE vir da variável de ambiente
    throw new Error(
      'ERRO DE CONFIGURAÇÃO: GHL_PUBLIC_KEY não está definida. ' +
      'Em produção (REQUIRE_WEBHOOK_SIGNATURE=true), você DEVE configurar ' +
      'a variável de ambiente GHL_PUBLIC_KEY com a chave pública do GoHighLevel.'
    )
  }
  
  // Em desenvolvimento, usar fallback
  console.warn(
    'AVISO: Usando chave pública fallback do GHL. ' +
    'Para produção, configure a variável de ambiente GHL_PUBLIC_KEY.'
  )
  return GHL_PUBLIC_KEY_FALLBACK
}

/**
 * Valida o formato PEM de uma chave pública
 */
function validatePEMFormat(key: string): boolean {
  const pemRegex = /^-----BEGIN PUBLIC KEY-----\s*[\s\S]+\s*-----END PUBLIC KEY-----\s*$/
  return pemRegex.test(key.trim())
}

interface WebhookPayload {
  type: string
  location_id: string
  id?: string
  webhookId?: string
  pipelineStageId?: string
  pipelineStageName?: string
  stageName?: string
  stageId?: string
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
    const { error } = await supabase
      .from('ghl_webhook_rate_limit')
      .upsert({
        identifier,
        request_count: 1,
        window_start: now,
        last_request: now
      }, { onConflict: 'identifier' })
    
    if (error) {
      console.error('Erro ao fazer upsert no rate limit (novo registro):', error)
      // Fail-safe: bloquear em caso de erro de DB
      return { allowed: false, reason: 'Database error' }
    }

    return { allowed: true }
  }

  // Incrementar contador
  const newCount = existing.request_count + 1

  // Verificar limites
  if (newCount > RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_MINUTE) {
    // Bloquear por abuso
    const blockedUntil = new Date(now.getTime() + RATE_LIMIT_CONFIG.BLOCK_DURATION_MINUTES * 60 * 1000)
    
    const { error } = await supabase
      .from('ghl_webhook_rate_limit')
      .update({
        request_count: newCount,
        last_request: now,
        blocked_until: blockedUntil.toISOString()
      })
      .eq('identifier', identifier)
    
    if (error) {
      console.error('Erro ao atualizar rate limit (bloqueio):', error)
      // Fail-safe: bloquear mesmo se o DB falhar
    }

    console.warn(`Rate limit exceeded for ${identifier}. Blocked until ${blockedUntil.toISOString()}`)

    return {
      allowed: false,
      reason: 'Rate limit exceeded',
      retryAfter: RATE_LIMIT_CONFIG.BLOCK_DURATION_MINUTES * 60
    }
  }

  // Atualizar contador
  const { error: updateError } = await supabase
    .from('ghl_webhook_rate_limit')
    .update({
      request_count: newCount,
      last_request: now
    })
    .eq('identifier', identifier)
  
  if (updateError) {
    console.error('Erro ao atualizar contador de rate limit:', updateError)
    // Fail-safe: bloquear em caso de erro de DB
    return { allowed: false, reason: 'Database error' }
  }

  return { allowed: true }
}

/**
 * Serializa um erro de forma segura, independente do tipo
 */
function safeSerializeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

/**
 * Valida o tamanho e estrutura do payload
 */
function validatePayload(rawPayload: string, payload: WebhookPayload): { valid: boolean; error?: string} {
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
 * Importa a chave pública PEM para uso com Web Crypto API
 */
async function importPublicKey(pemKey: string): Promise<CryptoKey> {
  // Validar formato PEM
  if (!validatePEMFormat(pemKey)) {
    throw new Error(
      'Formato inválido de chave pública. ' +
      'Esperado formato PEM: -----BEGIN PUBLIC KEY----- ... -----END PUBLIC KEY-----'
    )
  }
  
  try {
    // Remover cabeçalho e rodapé do PEM
    const pemContents = pemKey
      .replace('-----BEGIN PUBLIC KEY-----', '')
      .replace('-----END PUBLIC KEY-----', '')
      .replace(/\s/g, '')
    
    // Decodificar de Base64 para ArrayBuffer
    const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))
    
    // Importar a chave
    return await crypto.subtle.importKey(
      'spki',
      binaryDer,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256'
      },
      false,
      ['verify']
    )
  } catch (error) {
    throw new Error(
      `Erro ao importar chave pública: ${safeSerializeError(error)}. ` +
      'Verifique se a chave está no formato PEM correto.'
    )
  }
}

/**
 * Verifica a assinatura do webhook usando a chave pública do GHL
 */
async function verifyWebhookSignature(
  payload: string,
  signature: string | null
): Promise<boolean> {
  // Verificar se a verificação é obrigatória
  const requireSignature = Deno.env.get('REQUIRE_WEBHOOK_SIGNATURE') === 'true'
  
  if (!signature) {
    if (requireSignature) {
      console.error('Webhook sem assinatura e REQUIRE_WEBHOOK_SIGNATURE=true')
      return false
    } else {
      console.warn('Webhook sem assinatura, mas REQUIRE_WEBHOOK_SIGNATURE não está ativado. Permitindo.')
      return true
    }
  }

  try {
    // Obter e importar a chave pública
    const pemKey = getGHLPublicKey()
    const publicKey = await importPublicKey(pemKey)
    
    // Decodificar a assinatura de Base64 para ArrayBuffer
    const signatureBytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0))
    
    // Converter payload para ArrayBuffer
    const encoder = new TextEncoder()
    const payloadBytes = encoder.encode(payload)
    
    // Verificar a assinatura
    const isValid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      publicKey,
      signatureBytes,
      payloadBytes
    )
    
    if (!isValid) {
      console.error('Assinatura RSA inválida')
    }
    
    return isValid
  } catch (error) {
    console.error('Erro ao verificar assinatura:', safeSerializeError(error))
    return false
  }
}

/**
 * Processa o webhook de forma assíncrona
 */
async function processWebhook(supabase: any, webhookLogId: string, payload: WebhookPayload) {
  try {
    const eventType = payload.type

    // Verificar se o evento deve ser processado
    const { process, reason } = shouldProcessEvent(payload)
    
    console.log(`Evento ${eventType}: ${process ? 'PROCESSAR' : 'IGNORAR'} - ${reason}`)
    
    if (!process) {
      // Atualizar log como "ignorado"
      await supabase
        .from('ghl_webhook_logs')
        .update({
          status: 'ignorado',
          error_log: reason,
          processed_at: new Date().toISOString()
        })
        .eq('id', webhookLogId)
      
      return
    }

    // Processar baseado no tipo de evento
    if (eventType.startsWith('Opportunity')) {
      await processOpportunityEvent(supabase, payload)
    } else if (eventType.startsWith('Contact')) {
      await processContactEvent(supabase, payload)
    } else if (eventType.startsWith('Appointment')) {
      await processAppointmentEvent(supabase, payload)
    } else if (eventType.startsWith('User')) {
      await processUserEvent(supabase, payload)
    } else {
      throw new Error(`Tipo de evento não suportado: ${eventType}`)
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

    // Recalcular rankings após processar eventos importantes
    if (eventType.startsWith('Opportunity') || eventType.startsWith('Appointment')) {
      EdgeRuntime.waitUntil(
        fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/ranking-system`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({ action: 'calculate' })
        }).catch(err => {
          console.error('Erro ao recalcular rankings:', err)
        })
      )
    }
  } catch (error) {
    console.error('Erro ao processar webhook:', error)
    
    // Atualizar log com erro
    await supabase
      .from('ghl_webhook_logs')
      .update({
        status: 'erro',
        error_log: safeSerializeError(error),
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
    console.log(`Oportunidade ${payload.id} sincronizada - Estágio: ${payload.pipelineStageName || payload.stageId}`)
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
    console.log(`Contato ${payload.id} sincronizado (Primeiro Contato)`)
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
    console.log(`Agendamento ${payload.id} sincronizado - SDR: ${payload.assignedUserId || 'não atribuído'}`)
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
    // Validar variáveis de ambiente críticas
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        'ERRO DE CONFIGURAÇÃO: Variáveis de ambiente SUPABASE_URL e/ou ' +
        'SUPABASE_SERVICE_ROLE_KEY não estão definidas. ' +
        'A função não pode inicializar sem essas credenciais.'
      )
    }
    
    // Inicializar cliente Supabase com service_role
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // PASSO 1: Validar token de autenticação
    const tokenValidation = await validateWebhookToken(req)
    if (!tokenValidation.valid) {
      console.error('Token de autenticação inválido ou ausente')
      return new Response(
        JSON.stringify({ error: tokenValidation.error }),
        { 
          status: 401,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // PASSO 2: Obter identificador para rate limiting (IP ou user-agent)
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

    // Gerar webhook_id único usando o webhookId do GHL (garante verdadeira idempotência)
    // Fallback para o esquema antigo apenas se o GHL não enviar webhookId
    const webhookId = payload.webhookId 
      ? `${payload.type}_${payload.webhookId}`
      : `${payload.type}_${payload.id}_${Date.now()}`
    
    if (!payload.webhookId) {
      console.warn(`Webhook sem webhookId do GHL. Usando fallback: ${webhookId}`)
    }

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

    // Processar webhook de forma assíncrona usando EdgeRuntime.waitUntil
    // Isso garante que o processamento seja completado antes da função terminar
    EdgeRuntime.waitUntil(
      processWebhook(supabase, logData.id, payload).catch(error => {
        console.error('Erro no processamento assíncrono:', error)
      })
    )

    // Retornar 200 OK imediatamente (não bloqueia a resposta)
    return new Response(
      JSON.stringify({ message: 'Webhook received', id: logData.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Erro na Edge Function:', error)
    return new Response(
      JSON.stringify({ error: safeSerializeError(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
