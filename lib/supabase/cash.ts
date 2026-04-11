import { supabase } from './client'

export interface CurrentCashSession {
  cash_session_id: string
  branch_id: string
  branch_name: string
  opened_by: string | null
  opened_by_name: string | null
  opening_role: 'admin' | 'manager' | 'employee'
  opened_at: string
  opening_amount: number
  status: 'open' | 'closed'
  expected_closing_amount: number | null
  closing_amount_counted: number | null
  variance_amount: number | null
  manual_income_total: number
  manual_expense_total: number
  sales_cash_total: number
  sales_return_total: number
  expected_now: number
  total_movements: number
}

export interface CashMovement {
  movement_id: string
  movement_type: 'manual_income' | 'manual_expense' | 'sale_cash' | 'sale_return_cash'
  amount: number
  description: string
  payment_method: string | null
  reference_table: string | null
  reference_id: string | null
  created_by: string | null
  created_by_name: string | null
  updated_by: string | null
  updated_by_name: string | null
  created_at: string
  updated_at: string
  metadata: Record<string, unknown>
}

export interface CashMovementEditRequest {
  request_id: string
  movement_id: string
  cash_session_id: string
  branch_id: string
  movement_type: CashMovement['movement_type']
  current_amount: number
  current_description: string
  proposed_amount: number | null
  proposed_description: string | null
  request_reason: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  requested_by: string | null
  requested_by_name: string | null
  requested_role: 'admin' | 'manager'
  reviewed_by: string | null
  reviewed_by_name: string | null
  review_notes: string | null
  applied: boolean
  created_at: string
  reviewed_at: string | null
}

export interface CashSnapshot {
  snapshot_id: string
  snapshot_type: 'open' | 'close'
  item_count: number
  total_units: number
  taken_by: string | null
  taken_by_name: string | null
  taken_at: string
}

interface CloseCashSessionResult {
  cash_session_id: string
  expected_amount: number
  counted_amount: number
  variance: number
}

interface ReviewEditRequestResult {
  request_id: string
  status: 'approved' | 'rejected'
  applied: boolean
  movement_id: string
}

interface CurrentProfile {
  id: string
  full_name: string
  email: string
  role_name: string
  branch_id: string
  branch_name: string
}

function parseSingleRpcRow<T>(data: T[] | T | null): T | null {
  if (!data) return null
  return Array.isArray(data) ? (data[0] ?? null) : data
}

export const cashService = {
  async getCurrentProfile() {
    const { data, error } = await supabase.rpc('get_current_user_profile')
    if (error) throw error
    return parseSingleRpcRow<CurrentProfile>(data as CurrentProfile[] | CurrentProfile | null)
  },

  async getCurrentSession() {
    const { data, error } = await supabase.rpc('get_current_cash_session')
    if (error) throw error
    return parseSingleRpcRow<CurrentCashSession>(data as CurrentCashSession[] | CurrentCashSession | null)
  },

  async openSession(input: { opening_amount: number; opening_notes?: string | null }) {
    const { data, error } = await supabase.rpc('open_cash_session', {
      p_opening_amount: input.opening_amount,
      p_opening_notes: input.opening_notes ?? null,
    })

    if (error) throw error
    return data as string
  },

  async createManualMovement(input: {
    cash_session_id: string
    direction: 'income' | 'expense'
    amount: number
    description: string
    metadata?: Record<string, unknown>
  }) {
    const { data, error } = await supabase.rpc('create_cash_manual_movement', {
      p_cash_session_id: input.cash_session_id,
      p_direction: input.direction,
      p_amount: input.amount,
      p_description: input.description,
      p_metadata: input.metadata ?? {},
    })

    if (error) throw error
    return data as string
  },

  async closeSession(input: {
    cash_session_id: string
    closing_amount_counted: number
    closing_notes?: string | null
  }) {
    const { data, error } = await supabase.rpc('close_cash_session', {
      p_cash_session_id: input.cash_session_id,
      p_closing_amount_counted: input.closing_amount_counted,
      p_closing_notes: input.closing_notes ?? null,
    })

    if (error) throw error
    return parseSingleRpcRow<CloseCashSessionResult>(
      data as CloseCashSessionResult[] | CloseCashSessionResult | null
    )
  },

  async getSessionMovements(cashSessionId: string) {
    const { data, error } = await supabase.rpc('get_cash_session_movements', {
      p_cash_session_id: cashSessionId,
    })

    if (error) throw error
    return (data || []) as CashMovement[]
  },

  async getSessionSnapshots(cashSessionId: string) {
    const { data, error } = await supabase.rpc('get_cash_session_snapshots', {
      p_cash_session_id: cashSessionId,
    })

    if (error) throw error
    return (data || []) as CashSnapshot[]
  },

  async createMovementEditRequest(input: {
    movement_id: string
    request_reason: string
    proposed_amount?: number | null
    proposed_description?: string | null
  }) {
    const { data, error } = await supabase.rpc('create_cash_movement_edit_request', {
      p_movement_id: input.movement_id,
      p_request_reason: input.request_reason,
      p_proposed_amount: input.proposed_amount ?? null,
      p_proposed_description: input.proposed_description ?? null,
    })

    if (error) throw error
    return data as string
  },

  async getMovementEditRequests(input?: { status?: string | null; cash_session_id?: string | null }) {
    const { data, error } = await supabase.rpc('get_cash_movement_edit_requests', {
      p_status: input?.status ?? null,
      p_cash_session_id: input?.cash_session_id ?? null,
    })

    if (error) throw error
    return (data || []) as CashMovementEditRequest[]
  },

  async reviewMovementEditRequest(input: {
    request_id: string
    action: 'approve' | 'reject'
    review_notes?: string | null
    apply_changes?: boolean
  }) {
    const { data, error } = await supabase.rpc('review_cash_movement_edit_request', {
      p_request_id: input.request_id,
      p_action: input.action,
      p_review_notes: input.review_notes ?? null,
      p_apply_changes: input.apply_changes ?? true,
    })

    if (error) throw error
    return parseSingleRpcRow<ReviewEditRequestResult>(
      data as ReviewEditRequestResult[] | ReviewEditRequestResult | null,
    )
  },

  async adminUpdateMovement(input: {
    movement_id: string
    new_amount?: number | null
    new_description?: string | null
    reason?: string | null
  }) {
    const { data, error } = await supabase.rpc('admin_update_cash_movement', {
      p_movement_id: input.movement_id,
      p_new_amount: input.new_amount ?? null,
      p_new_description: input.new_description ?? null,
      p_reason: input.reason ?? null,
    })

    if (error) throw error
    return data as string
  },
}
