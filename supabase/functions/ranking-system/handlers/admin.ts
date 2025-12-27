/**
 * Handler: admin
 * 
 * Funções administrativas para gerenciar o sistema de ranking
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { calculate } from './calculate.ts'

interface AdminParams {
  subaction: 'set-role' | 'recalculate' | 'list-users'
  user_id?: string
  role?: 'sdr' | 'closer' | 'auto_prospeccao'
  active?: boolean
  month?: string
}

// Roles permitidos
const ALLOWED_ROLES = ['sdr', 'closer', 'auto_prospeccao'] as const

/**
 * Verificar se o usuário tem permissão de admin
 */
async function verifyAdminPermission(supabase: any, callerId: string) {
  // Por enquanto, vamos verificar se o usuário está na tabela de admins
  // Você pode criar uma tabela 'admins' ou adicionar um campo 'is_admin' em auth.users
  
  // Opção 1: Verificar se tem role 'admin' em sales_roles
  const { data, error } = await supabase
    .from('sales_roles')
    .select('role')
    .eq('ghl_user_id', callerId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('[admin] Erro ao verificar permissão:', error)
    throw new Error('Erro ao verificar permissões')
  }

  // Por enquanto, permitir qualquer usuário autenticado
  // TODO: Implementar verificação real de admin quando a tabela estiver pronta
  // if (!data || data.role !== 'admin') {
  //   throw new Error('Acesso negado: você não tem permissão de administrador')
  // }

  return true
}

export async function adminActions(params: AdminParams, callerId: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Verificar permissão de admin
  await verifyAdminPermission(supabase, callerId)

  const { subaction } = params

  console.log(`[admin] Subaction: ${subaction}, Caller: ${callerId}`)

  switch (subaction) {
    case 'set-role':
      return await setUserRole(supabase, params)
    
    case 'recalculate':
      return await calculate({ month: params.month })
    
    case 'list-users':
      return await listUsers(supabase)
    
    default:
      throw new Error(`Subaction '${subaction}' not found`)
  }
}

/**
 * Atribuir ou atualizar função de um usuário
 */
async function setUserRole(supabase: any, params: AdminParams) {
  const { user_id, role, active } = params

  if (!user_id || !role) {
    throw new Error('user_id e role são obrigatórios')
  }

  // Validar role
  if (!ALLOWED_ROLES.includes(role as any)) {
    throw new Error(`Role inválido. Valores permitidos: ${ALLOWED_ROLES.join(', ')}`)
  }

  // Verificar se usuário existe no GHL
  const { data: user, error: userError } = await supabase
    .from('ghl_users')
    .select('id, name')
    .eq('id', user_id)
    .single()

  if (userError || !user) {
    throw new Error('Usuário não encontrado no GoHighLevel')
  }

  // Upsert na tabela sales_roles
  const { data, error } = await supabase
    .from('sales_roles')
    .upsert({
      ghl_user_id: user_id,
      role,
      active: active !== undefined ? active : true,
      updated_at: new Date().toISOString()
    }, { onConflict: 'ghl_user_id' })
    .select()
    .single()

  if (error) throw error

  console.log(`[set-role] Função '${role}' atribuída ao usuário ${user.name}`)

  return {
    message: `Função '${role}' atribuída com sucesso`,
    user: {
      id: user_id,
      name: user.name,
      role,
      active: active !== undefined ? active : true
    }
  }
}

/**
 * Listar todos os usuários do GHL com suas funções
 */
async function listUsers(supabase: any) {
  const { data: users, error } = await supabase
    .from('ghl_users')
    .select(`
      id,
      name,
      email,
      active,
      sales_roles(role, active)
    `)
    .order('name')

  if (error) throw error

  return {
    users: users?.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      active: u.active,
      role: u.sales_roles?.role || null,
      role_active: u.sales_roles?.active || false
    })) || []
  }
}
