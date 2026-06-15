import { createSupabaseAdminClient } from './server'

export interface DeviceSessionRecord {
  id: string
  user_id: string | null
  user_email: string
  user_name: string
  role: string
  branch_id: string | null
  device_name: string | null
  browser: string | null
  os: string | null
  ip_address: string | null
  status: 'active' | 'closed'
  login_at: string
  logout_at: string | null
}

export interface DeviceSessionFilters {
  role?: string
  status?: string
  branch_id?: string
  user_email?: string
}

export const devicesService = {
  async registerSession(input: {
    user_id: string | null
    user_email: string
    user_name: string
    role: string
    branch_id: string | null
    device_name: string | null
    browser: string | null
    os: string | null
    ip_address: string | null
  }) {
    const supabase = createSupabaseAdminClient()
    const { data, error } = await supabase
      .from('device_sessions')
      .insert([{ ...input, status: 'active' }])
      .select()
      .single()

    if (error) throw error
    return data as DeviceSessionRecord
  },

  async closeSession(id: string) {
    const supabase = createSupabaseAdminClient()
    const { data, error } = await supabase
      .from('device_sessions')
      .update({ status: 'closed', logout_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as DeviceSessionRecord
  },

  async listSessions(filters: DeviceSessionFilters = {}) {
    const supabase = createSupabaseAdminClient()
    let query = supabase
      .from('device_sessions')
      .select('*')
      .order('login_at', { ascending: false })

    if (filters.role && filters.role !== 'all') {
      query = query.eq('role', filters.role)
    }
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }
    if (filters.branch_id && filters.branch_id !== 'all') {
      query = query.eq('branch_id', filters.branch_id)
    }
    if (filters.user_email) {
      query = query.ilike('user_email', `%${filters.user_email}%`)
    }

    const { data, error } = await query
    if (error) throw error
    return (data as DeviceSessionRecord[]) || []
  },
}
