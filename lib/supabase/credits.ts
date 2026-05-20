import { supabase } from './client'
import type { CreditPayment } from '@/types/database'

export interface CreditSettings {
  max_open_credits_per_customer: number
  credit_reminder_weekly_day: number
  credit_due_daily_threshold_days: number
}

export interface CreditLimitState {
  openCount: number
  limit: number
  blocked: boolean
}

export interface CreditPortfolioRow {
  credit_id: string
  customer_id: string
  customer_name: string
  branch_id: string
  branch_name: string
  seller_name: string
  product_name: string
  total_amount: number
  paid_amount: number
  balance: number
  status: 'active' | 'overdue' | 'paid'
  due_date: string
  reminder_date: string | null
  notes: string | null
  created_date: string
  created_at: string
  updated_at: string
}

export interface CreditKardexRow {
  movement_id: string
  credit_id: string
  branch_id: string
  branch_name: string
  customer_id: string
  customer_name: string
  movement_type: 'credit_created' | 'credit_payment'
  amount: number
  movement_date: string
  created_at: string
}

export interface CreditAlertRow {
  credit_id: string
  branch_id: string
  branch_name: string
  customer_id: string
  customer_name: string
  due_date: string
  days_to_due: number
  alert_type: 'daily_due' | 'weekly' | null
  weekly_day: number
  daily_threshold_days: number
  reminder_date: string | null
  status: 'active' | 'overdue' | 'paid'
}

export interface CreditPaymentRequest {
  id: string
  credit_id: string
  branch_id: string
  requested_by: string | null
  requested_role: string
  amount: number
  payment_method: string
  payment_date: string
  notes: string | null
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by: string | null
  review_notes: string | null
  created_at: string
  reviewed_at: string | null
}

function parseSingleRpcRow<T>(data: T[] | T | null): T | null {
  if (!data) return null
  return Array.isArray(data) ? (data[0] ?? null) : data
}

export const creditsService = {
  async getSettings() {
    const { data, error } = await supabase.rpc('get_credit_settings')

    if (error) throw error

    return (
      parseSingleRpcRow<CreditSettings>(data as CreditSettings[] | CreditSettings | null) || {
        max_open_credits_per_customer: 2,
        credit_reminder_weekly_day: 1,
        credit_due_daily_threshold_days: 5,
      }
    )
  },

  async validateCustomerLimit(input: { customer_id: string; branch_id?: string | null }): Promise<CreditLimitState> {
    const { data, error } = await supabase.rpc('validate_customer_credit_limit', {
      p_customer_id: input.customer_id,
      p_branch_id: input.branch_id ?? null,
    })

    if (error) throw error

    const row = parseSingleRpcRow<{ open_count: number; limit_value: number; blocked: boolean }>(
      data as Array<{ open_count: number; limit_value: number; blocked: boolean }> | null,
    )

    return {
      openCount: row?.open_count ?? 0,
      limit: row?.limit_value ?? 0,
      blocked: row?.blocked ?? false,
    }
  },

  async create(input: {
    sale_id: string
    branch_id: string
    customer_id: string
    seller_name: string
    product_name: string
    total_amount: number
    paid_amount: number
    due_days: number
    reminder_date?: string | null
    notes?: string | null
  }) {
    const { data, error } = await supabase.rpc('create_credit', {
      p_sale_id: input.sale_id,
      p_branch_id: input.branch_id,
      p_customer_id: input.customer_id,
      p_seller_name: input.seller_name,
      p_product_name: input.product_name,
      p_total_amount: input.total_amount,
      p_paid_amount: input.paid_amount,
      p_due_days: input.due_days,
      p_reminder_date: input.reminder_date ?? null,
      p_notes: input.notes ?? null,
    })

    if (error) throw error
    return data as string
  },

  async getPortfolio(input?: { branch_id?: string | null; customer_id?: string | null; search?: string | null }) {
    const { data, error } = await supabase.rpc('get_credit_portfolio', {
      p_branch_id: input?.branch_id ?? null,
      p_customer_id: input?.customer_id ?? null,
      p_search: input?.search ?? null,
    })

    if (error) throw error
    return (data || []) as CreditPortfolioRow[]
  },

  async getKardex(input?: { branch_id?: string | null; customer_id?: string | null; from?: string | null; to?: string | null }) {
    const { data, error } = await supabase.rpc('get_credit_kardex', {
      p_branch_id: input?.branch_id ?? null,
      p_customer_id: input?.customer_id ?? null,
      p_from: input?.from ?? null,
      p_to: input?.to ?? null,
    })

    if (error) throw error
    return (data || []) as CreditKardexRow[]
  },

  async getAlerts(input?: { branch_id?: string | null }) {
    const { data, error } = await supabase.rpc('get_credit_alerts', {
      p_branch_id: input?.branch_id ?? null,
    })

    if (error) throw error
    return (data || []) as CreditAlertRow[]
  },

  async markAlertSeen(creditId: string) {
    const { data, error } = await supabase.rpc('mark_credit_alert_seen', {
      p_credit_id: creditId,
    })

    if (error) throw error
    return data as string
  },
}

export const creditPaymentsService = {
  async addPayment(input: {
    credit_id: string
    amount: number
    payment_method: string
    payment_date?: string | null
    notes?: string | null
  }) {
    const { data, error } = await supabase.rpc('add_credit_payment', {
      p_credit_id: input.credit_id,
      p_amount: input.amount,
      p_payment_method: input.payment_method,
      p_payment_date: input.payment_date ?? null,
      p_notes: input.notes ?? null,
    })

    if (error) throw error
    return data as string
  },

  async getByCredit(creditId: string) {
    const { data, error } = await supabase
      .from('credit_payments')
      .select('*')
      .eq('credit_id', creditId)
      .order('payment_date', { ascending: false })

    if (error) throw error
    return (data as CreditPayment[]) || []
  },

  async requestPayment(input: {
    credit_id: string
    amount: number
    payment_method: string
    payment_date?: string | null
    notes?: string | null
  }) {
    const { data, error } = await supabase.rpc('request_credit_payment', {
      p_credit_id: input.credit_id,
      p_amount: input.amount,
      p_payment_method: input.payment_method,
      p_payment_date: input.payment_date ?? null,
      p_notes: input.notes ?? null,
    })
    if (error) throw error
    return data as string
  },

  async getPendingRequests(input?: { branch_id?: string | null }) {
    const { data, error } = await supabase
      .from('credit_payment_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async reviewRequest(input: {
    request_id: string
    action: 'approve' | 'reject'
    review_notes?: string | null
  }) {
    const { data, error } = await supabase.rpc('review_credit_payment_request', {
      p_request_id: input.request_id,
      p_action: input.action,
      p_review_notes: input.review_notes ?? null,
    })
    if (error) throw error
    return data as string
  },
}
