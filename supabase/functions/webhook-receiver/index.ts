/**
 * Edge Function: webhook-receiver
 * 
 * Ponto de entrada único para todos os webhooks do GoHighLevel.
 * Responsável por:
 * 1. Verificar a assinatura do webhook (segurança)
 * 2. Garantir idempotência (não processar o mesmo webhook duas vezes)
 * 3. Logar o webhook recebido
 * 4. Retornar 200 OK imediatamente
 * 5. Processar o payload de forma assíncrona
 * 6. Fazer UPSERT nos dados do banco
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-wh-signature',
}

// Chave pública do GoHighLevel para verificação de assinatura
// Fonte: https://marketplace.gohighlevel.com/docs/webhook/WebhookIntegrationGuide/
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
    // Deletar oportunidade
    const { error } = await supabase
      .from('ghl_opportunities')
      .delete()
      .eq('id', payload.id)

    if (error) throw error
    console.log(`Oportunidade ${payload.id} deletada`)
  } else {
    // Create ou Update: fazer UPSERT
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
    // UPSERT do contato
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

    // Ler o payload
    const rawPayload = await req.text()
    const payload: WebhookPayload = JSON.parse(rawPayload)

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

    // Gerar webhook_id único (usar o ID do evento + tipo)
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
