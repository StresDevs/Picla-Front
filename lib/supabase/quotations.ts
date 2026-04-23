import { supabase } from './client'

export interface QuotationItemInput {
  part_id: string
  quantity: number
  unit_price: number
  metadata?: Record<string, unknown>
}

export interface QuotationItemRecord {
  id: string
  part_id: string
  part_code: string
  part_name: string
  quantity: number
  unit_price: number
  line_total: number
  metadata?: Record<string, unknown>
}

export interface QuotationRecord {
  quotation_id: string
  branch_id: string
  branch_name: string
  customer_id: string
  customer_name: string
  customer_nit_ci: string
  quoted_by: string | null
  quoted_by_name: string | null
  status: 'active' | 'cancelled' | 'converted' | 'expired'
  expires_at: string
  subtotal_amount: number
  discount_amount: number
  total_amount: number
  converted_sale_id: string | null
  notes: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  items: QuotationItemRecord[]
}

export interface QuotationHistoryRecord {
  id: string
  quotation_id: string
  branch_id: string
  event_type: 'created' | 'cancelled' | 'converted' | 'expired' | 'updated'
  actor_user_id: string | null
  actor_name: string | null
  payload: Record<string, unknown>
  notes: string | null
  created_at: string
}

interface ConvertQuotationResult {
  quotation_id: string
  sale_id: string
  total_amount_bob: number
  total_amount_usd: number
  cash_movement_id: string | null
}

function parseSingleRpcRow<T>(data: T[] | T | null): T | null {
  if (!data) return null
  return Array.isArray(data) ? (data[0] ?? null) : data
}

export const quotationsService = {
  async create(input: {
    branch_id: string | null
    customer_id: string
    expires_at: string
    notes?: string | null
    metadata?: Record<string, unknown>
    items: QuotationItemInput[]
  }) {
    const { data, error } = await supabase.rpc('quotation_create', {
      p_branch_id: input.branch_id,
      p_customer_id: input.customer_id,
      p_expires_at: input.expires_at,
      p_items: input.items,
      p_notes: input.notes ?? null,
      p_metadata: input.metadata ?? {},
    })

    if (error) throw error
    return data as string
  },

  async getList(input?: { branch_id?: string | null; status?: string | null }) {
    const { data, error } = await supabase.rpc('quotation_get_list', {
      p_branch_id: input?.branch_id ?? null,
      p_status: input?.status ?? null,
    })

    if (error) throw error
    return (data || []) as QuotationRecord[]
  },

  async cancel(input: { quotation_id: string; reason?: string | null }) {
    const { data, error } = await supabase.rpc('quotation_cancel', {
      p_quotation_id: input.quotation_id,
      p_reason: input.reason ?? null,
    })

    if (error) throw error
    return data as string
  },

  async convertToSale(input: {
    quotation_id: string
    payment_method: 'cash' | 'card' | 'qr'
    payment_currency: 'BOB' | 'USD'
    exchange_rate: number
    sale_mode?: 'immediate' | 'advance'
    advance_amount?: number
    metadata?: Record<string, unknown>
  }) {
    const { data, error } = await supabase.rpc('quotation_convert_to_sale', {
      p_quotation_id: input.quotation_id,
      p_payment_method: input.payment_method,
      p_payment_currency: input.payment_currency,
      p_exchange_rate: input.exchange_rate,
      p_sale_mode: input.sale_mode ?? 'immediate',
      p_advance_amount: input.advance_amount ?? 0,
      p_metadata: input.metadata ?? {},
    })

    if (error) throw error
    return parseSingleRpcRow<ConvertQuotationResult>(
      data as ConvertQuotationResult[] | ConvertQuotationResult | null,
    )
  },

  async getHistory(input?: { quotation_id?: string | null; branch_id?: string | null }) {
    const { data, error } = await supabase.rpc('quotation_get_history', {
      p_quotation_id: input?.quotation_id ?? null,
      p_branch_id: input?.branch_id ?? null,
    })

    if (error) throw error
    return (data || []) as QuotationHistoryRecord[]
  },
}
