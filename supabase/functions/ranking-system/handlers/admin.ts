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
  role?: 'sdr' | 'closer' | 'ciclo_completo'
  active?: boolean
  month?: string
}

export async function adminActions(params: AdminParams) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { subaction } = params

  console.log(`[admin] Subaction: ${subaction}`)

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

  // Verificar se usuário existe no GHL
  const { data: user, error: userError } = await supabase
    .from('ghl_users')
    .select('id, name')
    .eq('id', user_id)
    .single()

  if (userError || !user) {
    throw new Error('Usuário não encontrado no GoHighLevel')
  }

  // Upsert na tabela user_roles
  const { data, error } = await supabase
    .from('user_roles')
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
      user_roles(role, active)
    `)
    .order('name')

  if (error) throw error

  return {
    users: users?.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      active: u.active,
      role: u.user_roles?.role || null,
      role_active: u.user_roles?.active || false
    })) || []
  }
}
