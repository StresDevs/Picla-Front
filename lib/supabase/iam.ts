import { createSupabaseAdminClient } from './server'

export interface RoleRecord {
  id: string
  name: string
  created_at: string
}

export interface BranchRecord {
  id: string
  name: string
  address: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

export interface UserRecord {
  id: string
  full_name: string
  phone: string | null
  email: string
  role_id: string
  branch_id: string
  created_at: string
  updated_at: string
}

export interface UserRoleRecord {
  user_id: string
  role_id: string
  assigned_at: string
}

export const iamService = {
  async getUsers() {
    const supabase = createSupabaseAdminClient()
    const { data, error } = await supabase
      .from('users')
      .select('*, role:roles(*), branch:branches(*)')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async createUserProfile(user: Omit<UserRecord, 'created_at' | 'updated_at'>) {
    const supabase = createSupabaseAdminClient()
    const { data, error } = await supabase.from('users').insert([user]).select().single()

    if (error) throw error
    return data as UserRecord
  },

  async getRoles() {
    const supabase = createSupabaseAdminClient()
    const { data, error } = await supabase.from('roles').select('*').order('name', { ascending: true })

    if (error) throw error
    return (data as RoleRecord[]) || []
  },

  async getBranches() {
    const supabase = createSupabaseAdminClient()
    const { data, error } = await supabase.from('branches').select('*').order('name', { ascending: true })

    if (error) throw error
    return (data as BranchRecord[]) || []
  },

  async assignExtraRole(userRole: UserRoleRecord) {
    const supabase = createSupabaseAdminClient()
    const { data, error } = await supabase.from('user_roles').insert([userRole]).select().single()

    if (error) throw error
    return data as UserRoleRecord
  },
}
