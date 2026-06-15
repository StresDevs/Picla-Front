import { createSupabaseAdminClient } from './server'

export interface PayrollScheduleRecord {
  id: string
  user_id: string
  user_name: string
  branch_id: string | null
  branch_name: string | null
  amount: number
  due_date: string
  status: 'active' | 'inactive'
  notes: string | null
  created_at: string
  created_by: string | null
  last_paid_at: string | null
  last_paid_by: string | null
}

export interface PayrollHistoryRecord {
  id: string
  payroll_payment_id: string
  user_id: string
  user_name: string
  branch_id: string | null
  branch_name: string | null
  amount: number
  due_date: string
  paid_at: string
  paid_by: string | null
}

interface PayrollScheduleRow {
  id: string
  user_id: string
  branch_id: string | null
  amount: number
  due_date: string
  status: 'active' | 'inactive'
  notes: string | null
  created_at: string
  created_by: string | null
  last_paid_at: string | null
  last_paid_by: string | null
  user: { full_name: string } | null
  branch: { name: string } | null
}

interface PayrollHistoryRow {
  id: string
  payroll_payment_id: string
  user_id: string
  branch_id: string | null
  amount: number
  due_date: string
  paid_at: string
  paid_by: string | null
  user: { full_name: string } | null
  branch: { name: string } | null
}

function mapScheduleRow(row: PayrollScheduleRow): PayrollScheduleRecord {
  return {
    id: row.id,
    user_id: row.user_id,
    user_name: row.user?.full_name || 'Desconocido',
    branch_id: row.branch_id,
    branch_name: row.branch?.name || null,
    amount: row.amount,
    due_date: row.due_date,
    status: row.status,
    notes: row.notes,
    created_at: row.created_at,
    created_by: row.created_by,
    last_paid_at: row.last_paid_at,
    last_paid_by: row.last_paid_by,
  }
}

function mapHistoryRow(row: PayrollHistoryRow): PayrollHistoryRecord {
  return {
    id: row.id,
    payroll_payment_id: row.payroll_payment_id,
    user_id: row.user_id,
    user_name: row.user?.full_name || 'Desconocido',
    branch_id: row.branch_id,
    branch_name: row.branch?.name || null,
    amount: row.amount,
    due_date: row.due_date,
    paid_at: row.paid_at,
    paid_by: row.paid_by,
  }
}

const SCHEDULE_SELECT = '*, user:users(full_name), branch:branches(name)'
const HISTORY_SELECT = '*, user:users(full_name), branch:branches(name)'

export const payrollService = {
  async listPayments(filters?: { status?: 'active' | 'inactive' }) {
    const supabase = createSupabaseAdminClient()
    let query = supabase
      .from('payroll_payments')
      .select(SCHEDULE_SELECT)
      .order('due_date', { ascending: true })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query
    if (error) throw error
    return ((data || []) as unknown as PayrollScheduleRow[]).map(mapScheduleRow)
  },

  async createPayment(input: {
    user_id: string
    branch_id: string | null
    amount: number
    due_date: string
    notes: string | null
    created_by: string | null
  }) {
    const supabase = createSupabaseAdminClient()
    const { data, error } = await supabase
      .from('payroll_payments')
      .insert([input])
      .select(SCHEDULE_SELECT)
      .single()

    if (error) throw error
    return mapScheduleRow(data as unknown as PayrollScheduleRow)
  },

  async markAsPaid(id: string, paid_by: string) {
    const supabase = createSupabaseAdminClient()
    const { error: rpcError } = await supabase.rpc('payroll_register_payment', {
      p_schedule_id: id,
      p_paid_by: paid_by,
    })
    if (rpcError) throw rpcError

    const { data, error } = await supabase
      .from('payroll_payments')
      .select(SCHEDULE_SELECT)
      .eq('id', id)
      .single()

    if (error) throw error
    return mapScheduleRow(data as unknown as PayrollScheduleRow)
  },

  async updatePayment(id: string, updates: { amount?: number; due_date?: string; notes?: string | null }) {
    const supabase = createSupabaseAdminClient()
    const { data, error } = await supabase
      .from('payroll_payments')
      .update(updates)
      .eq('id', id)
      .select(SCHEDULE_SELECT)
      .single()

    if (error) throw error
    return mapScheduleRow(data as unknown as PayrollScheduleRow)
  },

  async deletePayment(id: string) {
    const supabase = createSupabaseAdminClient()
    const { error } = await supabase.from('payroll_payments').delete().eq('id', id)
    if (error) throw error
  },

  async setScheduleStatus(id: string, status: 'active' | 'inactive') {
    const supabase = createSupabaseAdminClient()
    const { data, error } = await supabase
      .from('payroll_payments')
      .update({ status })
      .eq('id', id)
      .select(SCHEDULE_SELECT)
      .single()

    if (error) throw error
    return mapScheduleRow(data as unknown as PayrollScheduleRow)
  },

  async getUpcomingAlerts() {
    const supabase = createSupabaseAdminClient()
    const today = new Date()
    const limit = new Date(today)
    limit.setDate(limit.getDate() + 5)

    const { data, error } = await supabase
      .from('payroll_payments')
      .select(SCHEDULE_SELECT)
      .eq('status', 'active')
      .lte('due_date', limit.toISOString().slice(0, 10))
      .order('due_date', { ascending: true })

    if (error) throw error
    return ((data || []) as unknown as PayrollScheduleRow[]).map(mapScheduleRow)
  },

  async listHistory(filters?: { date_from?: string; date_to?: string }) {
    const supabase = createSupabaseAdminClient()
    let query = supabase
      .from('payroll_payment_history')
      .select(HISTORY_SELECT)
      .order('paid_at', { ascending: false })

    if (filters?.date_from) {
      query = query.gte('paid_at', `${filters.date_from}T00:00:00`)
    }
    if (filters?.date_to) {
      query = query.lte('paid_at', `${filters.date_to}T23:59:59.999`)
    }

    const { data, error } = await query
    if (error) throw error
    return ((data || []) as unknown as PayrollHistoryRow[]).map(mapHistoryRow)
  },
}
