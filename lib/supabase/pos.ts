import { supabase } from './client'

export interface POSCatalogItem {
  part_id: string
  code: string
  name: string
  category: string
  image_url: string | null
  price: number
  kit_price: number
  stock: number
  tracking_mode: 'none' | 'serial' | 'lot'
  requires_serialization: boolean
}

export interface POSQueueLineInput {
  part_id: string
  quantity: number
  unit_price: number
  source_type?: 'product' | 'kit_component'
  source_kit_id?: string | null
}

export interface POSQueueItem {
  id: string
  part_id: string
  part_name: string
  quantity: number
  unit_price: number
  line_total: number
  source_type: 'product' | 'kit_component'
  source_kit_id: string | null
}

export interface POSQueuedSale {
  queue_id: string
  branch_id: string
  created_by: string | null
  created_by_role: 'admin' | 'manager' | 'employee' | 'read_only'
  customer_name: string | null
  payment_method: 'cash' | 'card' | 'qr'
  payment_currency: 'BOB' | 'USD'
  exchange_rate: number
  total_amount_bob: number
  total_amount_usd: number
  sale_mode: 'immediate' | 'advance'
  advance_amount: number
  requested_delivery_status: 'pending' | 'partial' | 'delivered'
  status: 'queued' | 'approved' | 'rejected' | 'cancelled'
  approved_by: string | null
  approved_by_role: 'admin' | 'manager' | 'employee' | null
  approved_sale_id: string | null
  approval_notes: string | null
  created_at: string
  approved_at: string | null
  lines: POSQueueItem[]
}

export interface POSSaleItem {
  id: string
  part_id: string
  part_code: string
  part_name: string
  quantity: number
  unit_price: number
  line_total: number
  delivered_quantity: number
  delivery_status: 'pending' | 'partial' | 'delivered'
  source_type: 'product' | 'kit_component'
  source_kit_id: string | null
}

export interface POSSaleRecord {
  sale_id: string
  branch_id: string
  sold_by: string | null
  customer_name: string | null
  payment_method: 'cash' | 'card' | 'qr'
  payment_currency: 'BOB' | 'USD'
  total_amount: number
  sale_mode: 'immediate' | 'advance'
  advance_amount: number
  pending_amount: number
  delivery_status: 'pending' | 'partial' | 'delivered'
  status: 'completed' | 'voided' | 'cancelled'
  created_at: string
  items: POSSaleItem[]
}

export interface POSReturnRecord {
  return_id: string
  sale_id: string
  branch_id: string
  returned_by: string | null
  reason: string
  status: 'completed' | 'cancelled'
  total_return_amount: number
  created_at: string
  items: Array<{
    id: string
    sale_item_id: string
    part_id: string
    quantity: number
    unit_price: number
    line_total: number
  }>
}

export interface POSPendingDelivery {
  sale_id: string
  branch_id: string
  customer_name: string | null
  payment_method: 'cash' | 'card' | 'qr'
  total_amount: number
  pending_amount: number
  delivery_status: 'pending' | 'partial' | 'delivered'
  created_at: string
  items: Array<{
    sale_item_id: string
    part_id: string
    part_name: string
    quantity: number
    delivered_quantity: number
    delivery_status: 'pending' | 'partial' | 'delivered'
  }>
}

interface CreateSaleResult {
  sale_id: string
  total_amount_bob: number
  total_amount_usd: number
  cash_movement_id: string | null
}

interface ApproveQueueResult {
  sale_id: string
  queue_id: string
  total_amount_bob: number
  total_amount_usd: number
}

interface CreateReturnResult {
  return_id: string
  sale_id: string
  total_return_amount: number
}

interface RegisterDeliveryResult {
  delivery_event_id: string
  sale_id: string
  delivery_status: 'pending' | 'partial' | 'delivered'
}

function parseSingleRpcRow<T>(data: T[] | T | null): T | null {
  if (!data) return null
  return Array.isArray(data) ? (data[0] ?? null) : data
}

export const posService = {
  async getCatalog(branchId?: string | null) {
    const { data, error } = await supabase.rpc('pos_get_catalog', {
      p_branch_id: branchId ?? null,
    })

    if (error) throw error
    return (data || []) as POSCatalogItem[]
  },

  async getQueuedSales(input?: { branch_id?: string | null; status?: string | null }) {
    const { data, error } = await supabase.rpc('pos_get_queued_sales', {
      p_branch_id: input?.branch_id ?? null,
      p_status: input?.status ?? null,
    })

    if (error) throw error
    return (data || []) as POSQueuedSale[]
  },

  async enqueueSale(input: {
    branch_id: string | null
    customer_name?: string | null
    payment_method: 'cash' | 'card' | 'qr'
    payment_currency: 'BOB' | 'USD'
    exchange_rate: number
    sale_mode: 'immediate' | 'advance'
    advance_amount?: number
    items: POSQueueLineInput[]
  }) {
    const { data, error } = await supabase.rpc('pos_enqueue_sale', {
      p_branch_id: input.branch_id ?? null,
      p_customer_name: input.customer_name ?? null,
      p_payment_method: input.payment_method,
      p_payment_currency: input.payment_currency,
      p_exchange_rate: input.exchange_rate,
      p_sale_mode: input.sale_mode,
      p_advance_amount: input.advance_amount ?? 0,
      p_items: input.items,
    })

    if (error) throw error
    return data as string
  },

  async createSale(input: {
    branch_id: string | null
    customer_name?: string | null
    payment_method: 'cash' | 'card' | 'qr'
    payment_currency: 'BOB' | 'USD'
    exchange_rate: number
    sale_mode: 'immediate' | 'advance'
    advance_amount?: number
    items: POSQueueLineInput[]
    metadata?: Record<string, unknown>
  }) {
    const { data, error } = await supabase.rpc('pos_create_sale', {
      p_branch_id: input.branch_id ?? null,
      p_customer_name: input.customer_name ?? null,
      p_payment_method: input.payment_method,
      p_payment_currency: input.payment_currency,
      p_exchange_rate: input.exchange_rate,
      p_sale_mode: input.sale_mode,
      p_advance_amount: input.advance_amount ?? 0,
      p_items: input.items,
      p_metadata: input.metadata ?? {},
    })

    if (error) throw error
    return parseSingleRpcRow<CreateSaleResult>(data as CreateSaleResult[] | CreateSaleResult | null)
  },

  async approveQueuedSale(input: { queue_id: string; approval_notes?: string | null }) {
    const { data, error } = await supabase.rpc('pos_approve_queued_sale', {
      p_queue_id: input.queue_id,
      p_approval_notes: input.approval_notes ?? null,
    })

    if (error) throw error
    return parseSingleRpcRow<ApproveQueueResult>(data as ApproveQueueResult[] | ApproveQueueResult | null)
  },

  async rejectQueuedSale(input: { queue_id: string; reason?: string | null }) {
    const { data, error } = await supabase.rpc('pos_reject_queued_sale', {
      p_queue_id: input.queue_id,
      p_reason: input.reason ?? null,
    })

    if (error) throw error
    return data as string
  },

  async getSales(branchId?: string | null, includeVoided = true) {
    const { data, error } = await supabase.rpc('pos_get_sales', {
      p_branch_id: branchId ?? null,
      p_include_voided: includeVoided,
    })

    if (error) throw error
    return (data || []) as POSSaleRecord[]
  },

  async createReturn(input: {
    sale_id: string
    reason: string
    notes?: string | null
    items: Array<{ sale_item_id?: string; part_id?: string; quantity: number }>
  }) {
    const { data, error } = await supabase.rpc('pos_create_sale_return', {
      p_sale_id: input.sale_id,
      p_reason: input.reason,
      p_items: input.items,
      p_notes: input.notes ?? null,
    })

    if (error) throw error
    return parseSingleRpcRow<CreateReturnResult>(data as CreateReturnResult[] | CreateReturnResult | null)
  },

  async getReturns(branchId?: string | null) {
    const { data, error } = await supabase.rpc('pos_get_returns', {
      p_branch_id: branchId ?? null,
    })

    if (error) throw error
    return (data || []) as POSReturnRecord[]
  },

  async registerDelivery(input: {
    sale_id: string
    notes?: string | null
    items: Array<{ sale_item_id: string; quantity: number }>
  }) {
    const { data, error } = await supabase.rpc('pos_register_sale_delivery', {
      p_sale_id: input.sale_id,
      p_notes: input.notes ?? null,
      p_items: input.items,
    })

    if (error) throw error
    return parseSingleRpcRow<RegisterDeliveryResult>(
      data as RegisterDeliveryResult[] | RegisterDeliveryResult | null,
    )
  },

  async getPendingDeliveries(branchId?: string | null) {
    const { data, error } = await supabase.rpc('pos_get_pending_deliveries', {
      p_branch_id: branchId ?? null,
    })

    if (error) throw error
    return (data || []) as POSPendingDelivery[]
  },

  async voidSale(input: { sale_id: string; reason: string }) {
    const { data, error } = await supabase.rpc('pos_void_sale', {
      p_sale_id: input.sale_id,
      p_reason: input.reason,
    })

    if (error) throw error
    return parseSingleRpcRow<{ sale_id: string; reversed_amount: number }>(
      data as Array<{ sale_id: string; reversed_amount: number }> | { sale_id: string; reversed_amount: number } | null,
    )
  },
}
