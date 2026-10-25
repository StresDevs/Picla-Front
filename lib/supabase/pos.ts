import { supabase } from './client'
import { saleTotalBob, validateMixedPayments, type POSPayment } from '../pos-payments'

export interface POSCatalogItem {
  part_id: string
  code: string
  name: string
  category: string
  image_url: string | null
  price: number
  kit_price: number
  quotation_min_price: number | null
  quotation_max_price: number | null
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

export interface POSPriceChange {
  part_id: string
  part_name: string
  original_price: number
  final_price: number
  quantity: number
  changed_by: string | null
}

export interface POSQueuedSale {
  metadata?: Record<string, unknown>
  price_changes?: POSPriceChange[]
  queue_id: string
  branch_id: string
  created_by: string | null
  created_by_role: 'admin' | 'manager' | 'employee' | 'read_only'
  customer_name: string | null
  payment_method: 'cash' | 'card' | 'qr' | 'credit'
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
  sold_by_name?: string
  exchange_rate?: number
  metadata?: Record<string, unknown>
  customer_name: string | null
  payment_method: 'cash' | 'card' | 'qr' | 'credit'
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

export interface TopSellerRecord {
  seller_id: string
  seller_name: string
  branch_id: string
  branch_name: string
  sales_count: number
  total_amount: number
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
  payment_method: 'cash' | 'card' | 'qr' | 'credit'
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
  async editSale(input: { sale_id: string; edit_id: string; expected_items: Array<{ id: string; part_id: string; quantity: number; unit_price: number }>; items: Array<POSQueueLineInput & { id: string | null }>; reason: string; payments: POSPayment[]; confirmed: boolean }) {
    const { data, error } = await supabase.rpc('pos_edit_sale', { p_sale_id: input.sale_id, p_edit_id: input.edit_id, p_expected_items: input.expected_items, p_items: input.items, p_reason: input.reason, p_payments: input.payments, p_confirmed: input.confirmed })
    if (error) throw error
    return data
  },
  async getCatalog(branchId?: string | null) {
    const [catalog, limits] = await Promise.all([
      supabase.rpc('pos_get_catalog', { p_branch_id: branchId ?? null }),
      supabase.rpc('pos_get_price_limits', { p_branch_id: branchId ?? null }),
    ])
    if (catalog.error) throw catalog.error
    if (limits.error) throw limits.error
    const priceLimits = new Map<string, Pick<POSCatalogItem, 'quotation_min_price' | 'quotation_max_price'>>(
      (limits.data || []).map((row: Pick<POSCatalogItem, 'part_id' | 'quotation_min_price' | 'quotation_max_price'>) => [row.part_id, row]),
    )
    return ((catalog.data || []) as POSCatalogItem[]).map((item) => ({
      ...item,
      ...priceLimits.get(item.part_id),
    }))
  },

  async getQueuedSales(input?: { branch_id?: string | null; status?: string | null }) {
    const { data, error } = await supabase.rpc('pos_get_queued_sales', {
      p_branch_id: input?.branch_id ?? null,
      p_status: input?.status ?? null,
    })

    if (error) throw error
    const queues = (data || []) as POSQueuedSale[]
    if (queues.length === 0) return queues
    const { data: metadata, error: metadataError } = await supabase
      .from('pos_sale_queue').select('id, metadata').in('id', queues.map((queue) => queue.queue_id))
    if (metadataError) throw metadataError
    const details = new Map((metadata || []).map((row) => [row.id, row.metadata]))
    return queues.map((queue) => ({ ...queue, metadata: details.get(queue.queue_id), price_changes: details.get(queue.queue_id)?.price_changes || [] }))
  },

  async enqueueSale(input: {
    branch_id: string | null
    customer_name?: string | null
    payment_method: 'cash' | 'qr' | 'mixed'
    payments?: POSPayment[]
    payment_currency: 'BOB' | 'USD'
    exchange_rate: number
    sale_mode: 'immediate' | 'advance'
    advance_amount?: number
    items: POSQueueLineInput[]
  }) {
    const mixed = input.payment_method === 'mixed'
    if (mixed) {
      const message = validateMixedPayments(input.payments || [], saleTotalBob(input.items))
      if (message) throw new Error(message)
      if (input.payment_currency !== 'BOB' || input.sale_mode !== 'immediate') throw new Error('El pago mixto requiere una venta al contado en bolivianos.')
    }
    const { data, error } = await supabase.rpc(mixed ? 'pos_enqueue_mixed_sale' : 'pos_enqueue_sale', {
      p_branch_id: input.branch_id ?? null,
      p_customer_name: input.customer_name ?? null,
      p_payment_method: mixed ? 'cash' : input.payment_method,
      ...(mixed ? { p_payments: input.payments } : {}),
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
    payment_method: 'cash' | 'qr' | 'credit' | 'mixed'
    payments?: POSPayment[]
    payment_currency: 'BOB' | 'USD'
    exchange_rate: number
    sale_mode: 'immediate' | 'advance'
    advance_amount?: number
    items: POSQueueLineInput[]
    metadata?: Record<string, unknown>
  }) {
    const mixed = input.payment_method === 'mixed'
    if (mixed) {
      const message = validateMixedPayments(input.payments || [], saleTotalBob(input.items))
      if (message) throw new Error(message)
      if (input.payment_currency !== 'BOB' || input.sale_mode !== 'immediate') throw new Error('El pago mixto requiere una venta al contado en bolivianos.')
    }
    const normalizedPaymentMethod = input.payment_method === 'credit' || mixed ? 'cash' : input.payment_method
    const { data, error } = await supabase.rpc(mixed ? 'pos_create_mixed_sale' : 'pos_create_sale', {
      p_branch_id: input.branch_id ?? null,
      p_customer_name: input.customer_name ?? null,
      p_payment_method: normalizedPaymentMethod,
      p_payment_currency: input.payment_currency,
      p_exchange_rate: input.exchange_rate,
      p_sale_mode: input.sale_mode,
      p_advance_amount: input.advance_amount ?? 0,
      p_items: input.items,
      p_metadata: input.metadata ?? {},
      ...(mixed ? { p_payments: input.payments } : { p_sold_by_override: null }),
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
    const sales = (data || []) as POSSaleRecord[]
    if (!sales.length) return sales
    const details = await supabase.rpc('pos_get_sale_receipt_details', { p_branch_id: branchId ?? null })
    if (!details.error) {
      const rows = (details.data || []) as Array<{ sale_id: string; sold_by_name: string; metadata: Record<string, unknown>; exchange_rate: number }>
      const byId = new Map(rows.map((row) => [row.sale_id, row] as const))
      return sales.map((sale) => ({ ...sale, ...byId.get(sale.sale_id) })) as POSSaleRecord[]
    }
    if (details.error.code !== 'PGRST202') throw details.error
    // Compatibilidad mientras se instala la consulta de nombres en Supabase.
    const [metadataResult, usersResult] = await Promise.all([
      supabase.from('pos_sales').select('id, metadata, exchange_rate').in('id', sales.map((sale) => sale.sale_id)),
      supabase.from('users').select('id, full_name').in('id', [...new Set(sales.map((sale) => sale.sold_by).filter((id): id is string => !!id))]),
    ])
    if (metadataResult.error) throw metadataResult.error
    if (usersResult.error) throw usersResult.error
    const metadataById = new Map((metadataResult.data || []).map((row) => [row.id, row]))
    const usersById = new Map((usersResult.data || []).map((row) => [row.id, row.full_name]))
    return sales.map((sale) => {
      const details = metadataById.get(sale.sale_id)
      return {
        ...sale,
        metadata: details?.metadata || {},
        exchange_rate: Number(details?.exchange_rate || 1),
        sold_by_name: details?.metadata?.created_by_name || details?.metadata?.converted_by_name || usersById.get(sale.sold_by) || (sale.sold_by ? `Usuario ${sale.sold_by}` : 'No registrado'),
      }
    }) as POSSaleRecord[]
  },

  async getTopSellers(input?: {
    branch_id?: string | null
    limit?: number
    start_date?: string | null
    end_date?: string | null
  }) {
    const { data, error } = await supabase.rpc('pos_get_top_sellers', {
      p_branch_id: input?.branch_id ?? null,
      p_limit: input?.limit ?? 10,
      p_start_date: input?.start_date ?? null,
      p_end_date: input?.end_date ?? null,
    })
    if (error) throw error
    return (data || []) as TopSellerRecord[]
  },

  async getSaleReceiptNumber(saleId: string, branchId?: string | null) {
    const sales = await posService.getSales(branchId ?? null, true)
    const sale = sales.find((row) => row.sale_id === saleId)
    if (!sale) return 'N0'

    const dateKey = (value: string) => {
      const dt = new Date(value)
      const year = dt.getFullYear()
      const month = String(dt.getMonth() + 1).padStart(2, '0')
      const day = String(dt.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const targetKey = dateKey(sale.created_at)
    const daySales = sales.filter((row) => dateKey(row.created_at) === targetKey)
    daySales.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    const index = daySales.findIndex((row) => row.sale_id === saleId)
    const sequence = index >= 0 ? index + 1 : daySales.length + 1
    return `N${sequence}`
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

  async markItemsForDelivery(saleId: string, partIds: string[]) {
    const { error } = await supabase.rpc('pos_mark_sale_items_for_delivery', {
      p_sale_id: saleId,
      p_part_ids: partIds,
    })
    if (error) throw error
  },
}
