import { supabase } from './client'
import {
  Inventory,
  InventoryCategory,
  Part,
  ProductKit,
  ProductKitItem,
  ProductPriceTier,
} from '@/types/database'

interface UpsertProductInput {
  branch_id: string
  code: string
  name: string
  description?: string
  category?: string
  category_id?: string | null
  image_url?: string | null
  cost: number
  price: number
  kit_price: number
  quotation_min_price?: number | null
  quotation_max_price?: number | null
  tracking_mode?: 'none' | 'serial' | 'lot'
  requires_serialization?: boolean
  initial_quantity?: number
  min_quantity?: number
  price_tiers?: ProductPriceTier[]
}

interface BulkProductRow extends UpsertProductInput {}

interface BulkProcessResult {
  row_index: number
  part_id: string | null
  status: 'ok' | 'error'
  message: string
}

interface ProductRow extends Omit<Part, 'price_tiers'> {
  product_price_tiers?: ProductPriceTier[]
}

interface ProductKitRow {
  id: string
  code: string
  name: string
  description: string
  category?: string
  branch_id: string
  created_at: string
  updated_at: string
  product_kit_items?: ProductKitItem[]
}

interface BranchOption {
  id: string
  name: string
}

interface TransferRequestRow {
  id: string
  from_branch_id: string
  to_branch_id: string
  status: 'pending' | 'completed' | 'anulled' | 'returned' | 'replenished'
  notes: string | null
  requested_by: string | null
  requested_at: string
  resolution_type: 'anulacion' | 'devolucion' | 'reposicion' | null
  resolution_reason: string | null
  inventory_transfer_request_items?: Array<{
    id: string
    part_id: string
    quantity: number
    source_part?: {
      id: string
      code: string
      name: string
      category: string | null
    } | Array<{
      id: string
      code: string
      name: string
      category: string | null
    }>
  }>
}

export interface TransferRequestDetail {
  id: string
  from_branch_id: string
  to_branch_id: string
  status: 'pending' | 'completed' | 'anulled' | 'returned' | 'replenished'
  notes: string | null
  requested_at: string
  resolution_type: 'anulacion' | 'devolucion' | 'reposicion' | null
  resolution_reason: string | null
  items: Array<{
    id: string
    part_id: string
    part_code: string
    part_name: string
    part_category: string | null
    quantity: number
  }>
}

export interface PendingTransferSummary {
  transfer_id: string
  from_branch_id: string
  to_branch_id: string
  status: string
  notes: string | null
  requested_at: string
  requested_by: string | null
  total_items: number
  total_quantity: number
  can_complete: boolean
}

export interface TransferHistoryRow {
  id: string
  transfer_id: string
  action_id: string
  action_type: string
  action_reason: string | null
  action_date: string
  from_branch_id: string
  to_branch_id: string
  status: string
  part_id: string
  part_code: string
  part_name: string
  quantity: number
  performed_by: string | null
}

export interface InventoryMovementRow {
  id: string
  movement_id: string
  branch_id: string
  part_id: string
  part_code: string
  part_name: string
  movement_type: string
  quantity: number
  quantity_before: number
  quantity_after: number
  reason: string
  reference_table: string | null
  reference_id: string | null
  created_by: string | null
  created_at: string
  metadata: Record<string, unknown>
}

interface InventoryExitRow {
  id: string
  branch_id: string
  part_id: string
  quantity: number
  reason: string
  source_reference: string | null
  created_by: string | null
  created_at: string
  branches?: { name: string } | Array<{ name: string }>
  parts?: { code: string; name: string; category: string | null } | Array<{ code: string; name: string; category: string | null }>
  users?: { full_name: string | null } | Array<{ full_name: string | null }>
}

export interface InventoryEntryView {
  id: string
  branch_id: string
  branch_name: string
  part_id: string
  part_code: string
  part_name: string
  quantity: number
  unit_cost: number | null
  unit_price: number | null
  currency: 'BOB' | 'USD'
  exchange_rate: number | null
  source_reference: string | null
  supplier_name: string | null
  reason: string
  notes: string | null
  created_by: string | null
  created_by_name: string | null
  created_at: string
}

export interface InventoryExitView {
  id: string
  branch_id: string
  branch_name: string
  part_id: string
  part_code: string
  part_name: string
  category: string | null
  quantity: number
  reason: string
  source_reference: string | null
  created_by_name: string | null
  created_at: string
}

interface InventoryControlRow {
  id: string
  branch_id: string
  part_id: string
  counted_quantity: number
  system_quantity: number
  difference_quantity: number
  control_reason: string | null
  notes: string | null
  recorded_by: string | null
  recorded_at: string
  parts?: { code: string; name: string; category: string | null } | Array<{ code: string; name: string; category: string | null }>
  branches?: { name: string } | Array<{ name: string }>
  users?: { full_name: string | null } | Array<{ full_name: string | null }>
}

export interface InventoryControlView {
  id: string
  branch_id: string
  branch_name: string
  part_id: string
  part_code: string
  part_name: string
  part_category: string | null
  counted_quantity: number
  system_quantity: number
  difference_quantity: number
  control_reason: string | null
  notes: string | null
  recorded_by_name: string | null
  recorded_at: string
}

export interface InventoryBranchSummary {
  branch_id: string
  branch_name: string
  total_items: number
  total_units: number
  estimated_value: number
}

function pickRelation<T>(relation: T | T[] | undefined): T | null {
  if (!relation) return null
  return Array.isArray(relation) ? (relation[0] || null) : relation
}

function mapTransferRequests(rows: TransferRequestRow[]) {
  return rows.map((row) => ({
    id: row.id,
    from_branch_id: row.from_branch_id,
    to_branch_id: row.to_branch_id,
    status: row.status,
    notes: row.notes,
    requested_at: row.requested_at,
    resolution_type: row.resolution_type,
    resolution_reason: row.resolution_reason,
    items: (row.inventory_transfer_request_items || []).map((item) => {
      const part = pickRelation(item.source_part)
      return {
        id: item.id,
        part_id: item.part_id,
        part_code: part?.code || '-',
        part_name: part?.name || item.part_id,
        part_category: part?.category || null,
        quantity: Number(item.quantity || 0),
      }
    }),
  }))
}

function toPartModel(row: ProductRow): Part {
  return {
    ...row,
    price_tiers: (row.product_price_tiers || []).sort((a, b) => a.min_quantity - b.min_quantity),
  }
}

function sanitizeFilename(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.-]+/g, '-').replace(/-+/g, '-')
}

function buildTiersPayload(tiers: ProductPriceTier[] | undefined, basePrice: number) {
  const hasBase = (tiers || []).some((tier) => tier.min_quantity === 1)
  const normalized = (tiers || [])
    .filter((tier) => tier.min_quantity >= 1 && tier.price >= 0)
    .map((tier) => ({ min_quantity: tier.min_quantity, price: tier.price }))

  if (!hasBase) {
    normalized.push({ min_quantity: 1, price: basePrice })
  }

  return normalized.sort((a, b) => a.min_quantity - b.min_quantity)
}

// Parts Service
export const partsService = {
  async getAll(branchId: string) {
    const { data, error } = await supabase
      .from('parts')
      .select('*, product_price_tiers(*)')
      .eq('branch_id', branchId)
      .order('name', { ascending: true })
    
    if (error) throw error
    return ((data as ProductRow[]) || []).map(toPartModel)
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('parts')
      .select('*, product_price_tiers(*)')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return toPartModel(data as ProductRow)
  },

  async create(part: UpsertProductInput) {
    const { data, error } = await supabase.rpc('upsert_inventory_product', {
      p_branch_id: part.branch_id,
      p_code: part.code,
      p_name: part.name,
      p_description: part.description || null,
      p_category: part.category || null,
      p_category_id: part.category_id || null,
      p_image_url: part.image_url || null,
      p_cost: part.cost,
      p_price: part.price,
      p_kit_price: part.kit_price,
      p_quotation_min_price: part.quotation_min_price ?? null,
      p_quotation_max_price: part.quotation_max_price ?? null,
      p_tracking_mode: part.tracking_mode || 'none',
      p_requires_serialization: part.requires_serialization ?? (part.tracking_mode === 'serial'),
      p_initial_quantity: part.initial_quantity ?? 0,
      p_min_quantity: part.min_quantity ?? 0,
      p_price_tiers: buildTiersPayload(part.price_tiers, part.price),
    })

    if (error) throw error
    return this.getById(data as string)
  },

  async bulkUpsert(rows: BulkProductRow[]) {
    const { data, error } = await supabase.rpc('bulk_upsert_inventory_products', {
      p_rows: rows.map((row) => ({
        ...row,
        requires_serialization: row.requires_serialization ?? row.tracking_mode === 'serial',
        price_tiers: buildTiersPayload(row.price_tiers, row.price),
      })),
    })

    if (error) throw error
    return (data || []) as BulkProcessResult[]
  },

  async uploadProductImage(file: File, branchId: string) {
    const safeName = sanitizeFilename(file.name)
    const objectPath = `${branchId}/${Date.now()}-${safeName}`

    const { error: uploadError } = await supabase.storage
      .from('product_images')
      .upload(objectPath, file, {
        upsert: false,
        contentType: file.type,
      })

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('product_images').getPublicUrl(objectPath)
    return data.publicUrl
  },

  async update(id: string, part: Partial<UpsertProductInput>) {
    const current = await this.getById(id)
    return this.create({
      branch_id: part.branch_id || current.branch_id,
      code: part.code || current.code,
      name: part.name || current.name,
      description: part.description ?? current.description,
      category: part.category ?? current.category,
      category_id: part.category_id ?? null,
      image_url: part.image_url ?? current.image_url,
      cost: part.cost ?? current.cost,
      price: part.price ?? current.price,
      kit_price: part.kit_price ?? current.kit_price ?? current.price,
      quotation_min_price: part.quotation_min_price ?? current.quotation_min_price ?? null,
      quotation_max_price: part.quotation_max_price ?? current.quotation_max_price ?? null,
      tracking_mode: part.tracking_mode ?? current.tracking_mode ?? 'none',
      requires_serialization:
        part.requires_serialization ?? current.requires_serialization ?? current.tracking_mode === 'serial',
      initial_quantity: part.initial_quantity,
      min_quantity: part.min_quantity,
      price_tiers: part.price_tiers ?? current.price_tiers ?? [],
    })
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('parts')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async search(branchId: string, filters: {
    name?: string
    category?: string
    code?: string
    minPrice?: number
    maxPrice?: number
  }) {
    let query = supabase
      .from('parts')
      .select('*, product_price_tiers(*)')
      .eq('branch_id', branchId)

    if (filters.name) {
      query = query.ilike('name', `%${filters.name}%`)
    }
    if (filters.code) {
      query = query.ilike('code', `%${filters.code}%`)
    }
    if (filters.category) {
      query = query.eq('category', filters.category)
    }
    if (filters.minPrice !== undefined) {
      query = query.gte('price', filters.minPrice)
    }
    if (filters.maxPrice !== undefined) {
      query = query.lte('price', filters.maxPrice)
    }

    const { data, error } = await query.order('name', { ascending: true })

    if (error) throw error
    return ((data as ProductRow[]) || []).map(toPartModel)
  },

  async getCategories(branchId: string) {
    const { data, error } = await supabase
      .from('inventory_categories')
      .select('*')
      .eq('branch_id', branchId)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error
    return (data as InventoryCategory[]) || []
  },
}

export const categoriesService = {
  async getAll(branchId: string) {
    const { data, error } = await supabase
      .from('inventory_categories')
      .select('*')
      .eq('branch_id', branchId)
      .eq('is_active', true)
      .order('name', { ascending: true })
    
    if (error) throw error
    return (data as InventoryCategory[]) || []
  },

  async create(input: { branch_id: string; name: string; description?: string | null }) {
    const { data: categoryId, error: createError } = await supabase.rpc('create_inventory_category', {
      p_branch_id: input.branch_id,
      p_name: input.name,
      p_description: input.description || null,
    })

    if (createError) throw createError

    const { data, error } = await supabase
      .from('inventory_categories')
      .select('*')
      .eq('id', categoryId as string)
      .single()

    if (error) throw error
    return data as InventoryCategory
  },
}

export const branchesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('branches')
      .select('id, name')
      .order('name', { ascending: true })

    if (error) throw error
    return (data as BranchOption[]) || []
  },
}

export const transferService = {
  async getRequests(branchId?: string | null) {
    let query = supabase
      .from('inventory_transfer_requests')
      .select(`
        id,
        from_branch_id,
        to_branch_id,
        status,
        notes,
        requested_by,
        requested_at,
        resolution_type,
        resolution_reason,
        inventory_transfer_request_items(
          id,
          part_id,
          quantity,
          source_part:parts!inventory_transfer_request_items_part_id_fkey(id, code, name, category)
        )
      `)

    if (branchId) {
      query = query.or(`from_branch_id.eq.${branchId},to_branch_id.eq.${branchId}`)
    }

    const { data, error } = await query.order('requested_at', { ascending: false })

    if (error) throw error
    return mapTransferRequests((data as TransferRequestRow[]) || [])
  },

  async getPendingSummaries(branchId?: string | null) {
    const { data, error } = await supabase.rpc('get_pending_inventory_transfers', {
      p_branch_id: branchId || null,
    })

    if (error) throw error
    return ((data || []) as PendingTransferSummary[]).map((row) => ({
      ...row,
      total_items: Number(row.total_items || 0),
      total_quantity: Number(row.total_quantity || 0),
      can_complete: Boolean(row.can_complete),
    }))
  },

  async createRequest(input: {
    from_branch_id: string
    to_branch_id: string
    notes?: string | null
    items: Array<{ part_id: string; quantity: number }>
  }) {
    const { data, error } = await supabase.rpc('create_inventory_transfer_request', {
      p_from_branch_id: input.from_branch_id,
      p_to_branch_id: input.to_branch_id,
      p_notes: input.notes || null,
      p_items: input.items,
    })

    if (error) throw error
    return data as string
  },

  async completeRequest(transferId: string, reason?: string | null) {
    const { data, error } = await supabase.rpc('complete_inventory_transfer_request', {
      p_transfer_id: transferId,
      p_reason: reason || null,
    })

    if (error) throw error
    return data as string
  },

  async applyResolution(transferId: string, action: 'anulacion' | 'devolucion' | 'reposicion', reason?: string | null) {
    const { data, error } = await supabase.rpc('apply_inventory_transfer_resolution', {
      p_transfer_id: transferId,
      p_action: action,
      p_reason: reason || null,
    })

    if (error) throw error
    return data as string
  },

  async getHistory(filters?: {
    branch_id?: string | null
    from?: string | null
    to?: string | null
  }) {
    const { data, error } = await supabase.rpc('get_inventory_transfer_history', {
      p_branch_id: filters?.branch_id || null,
      p_from: filters?.from || null,
      p_to: filters?.to || null,
    })

    if (error) throw error
    return ((data || []) as Array<Omit<TransferHistoryRow, 'id'>>).map((row) => ({
      ...row,
      id: row.action_id,
      quantity: Number(row.quantity || 0),
    }))
  },
}

export const entriesService = {
  async create(input: {
    branch_id: string
    part_id: string
    quantity: number
    reason?: string | null
    source_reference?: string | null
    supplier_name?: string | null
    notes?: string | null
    unit_cost?: number | null
    unit_price?: number | null
    currency?: 'BOB' | 'USD'
    exchange_rate?: number | null
  }) {
    const { data, error } = await supabase.rpc('create_inventory_entry', {
      p_branch_id: input.branch_id,
      p_part_id: input.part_id,
      p_quantity: input.quantity,
      p_reason: input.reason || null,
      p_source_reference: input.source_reference || null,
      p_supplier_name: input.supplier_name || null,
      p_notes: input.notes || null,
      p_unit_cost: input.unit_cost ?? null,
      p_unit_price: input.unit_price ?? null,
      p_currency: input.currency || 'BOB',
      p_exchange_rate: input.exchange_rate ?? null,
    })

    if (error) throw error
    return data as string
  },

  async getAll(filters?: {
    branch_id?: string | null
    from?: string | null
    to?: string | null
  }) {
    const { data, error } = await supabase.rpc('get_inventory_entries', {
      p_branch_id: filters?.branch_id || null,
      p_from: filters?.from || null,
      p_to: filters?.to || null,
    })

    if (error) throw error

    return ((data || []) as Array<Omit<InventoryEntryView, 'id'> & { entry_id: string }>).map((row) => ({
      id: row.entry_id,
      branch_id: row.branch_id,
      branch_name: row.branch_name,
      part_id: row.part_id,
      part_code: row.part_code,
      part_name: row.part_name,
      quantity: Number(row.quantity || 0),
      unit_cost: row.unit_cost === null ? null : Number(row.unit_cost),
      unit_price: row.unit_price === null ? null : Number(row.unit_price),
      currency: row.currency === 'USD' ? 'USD' : 'BOB',
      exchange_rate: row.exchange_rate === null ? null : Number(row.exchange_rate),
      source_reference: row.source_reference,
      supplier_name: row.supplier_name,
      reason: row.reason,
      notes: row.notes,
      created_by: row.created_by,
      created_by_name: row.created_by_name,
      created_at: row.created_at,
    }))
  },
}

export const exitsService = {
  async create(input: {
    branch_id: string
    part_id: string
    quantity: number
    reason: string
    source_reference?: string | null
  }) {
    const { data, error } = await supabase.rpc('create_inventory_exit', {
      p_branch_id: input.branch_id,
      p_part_id: input.part_id,
      p_quantity: input.quantity,
      p_reason: input.reason,
      p_source_reference: input.source_reference || null,
    })

    if (error) throw error
    return data as string
  },

  async getAll(branchId?: string | null) {
    let query = supabase
      .from('inventory_exits')
      .select(`
        id,
        branch_id,
        part_id,
        quantity,
        reason,
        source_reference,
        created_by,
        created_at,
        branches(name),
        parts(code, name, category),
        users!inventory_exits_created_by_fkey(full_name)
      `)

    if (branchId) {
      query = query.eq('branch_id', branchId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    return ((data as InventoryExitRow[]) || []).map((row) => {
      const branch = pickRelation(row.branches)
      const part = pickRelation(row.parts)
      const user = pickRelation(row.users)

      return {
        id: row.id,
        branch_id: row.branch_id,
        branch_name: branch?.name || row.branch_id,
        part_id: row.part_id,
        part_code: part?.code || '-',
        part_name: part?.name || row.part_id,
        category: part?.category || null,
        quantity: Number(row.quantity || 0),
        reason: row.reason,
        source_reference: row.source_reference,
        created_by_name: user?.full_name || null,
        created_at: row.created_at,
      } as InventoryExitView
    })
  },
}

export const movementHistoryService = {
  async getHistory(filters?: {
    branch_id?: string | null
    part_id?: string | null
    from?: string | null
    to?: string | null
  }) {
    const { data, error } = await supabase.rpc('get_inventory_movement_history', {
      p_branch_id: filters?.branch_id || null,
      p_part_id: filters?.part_id || null,
      p_from: filters?.from || null,
      p_to: filters?.to || null,
    })

    if (error) throw error
    return ((data || []) as Array<Omit<InventoryMovementRow, 'id'>>).map((row) => ({
      ...row,
      id: row.movement_id,
      quantity: Number(row.quantity || 0),
      quantity_before: Number(row.quantity_before || 0),
      quantity_after: Number(row.quantity_after || 0),
    }))
  },
}

export const inventoryControlService = {
  async record(input: {
    branch_id: string
    part_id: string
    counted_quantity: number
    control_reason?: string | null
    notes?: string | null
    apply_adjustment?: boolean
  }) {
    const { data, error } = await supabase.rpc('record_inventory_control', {
      p_branch_id: input.branch_id,
      p_part_id: input.part_id,
      p_counted_quantity: input.counted_quantity,
      p_control_reason: input.control_reason || null,
      p_notes: input.notes || null,
      p_apply_adjustment: input.apply_adjustment ?? false,
    })

    if (error) throw error
    return data as string
  },

  async getRecords(branchId?: string | null) {
    let query = supabase
      .from('inventory_control_records')
      .select(`
        id,
        branch_id,
        part_id,
        counted_quantity,
        system_quantity,
        difference_quantity,
        control_reason,
        notes,
        recorded_by,
        recorded_at,
        branches(name),
        parts(code, name, category),
        users!inventory_control_records_recorded_by_fkey(full_name)
      `)

    if (branchId) {
      query = query.eq('branch_id', branchId)
    }

    const { data, error } = await query.order('recorded_at', { ascending: false })

    if (error) throw error

    return ((data as InventoryControlRow[]) || []).map((row) => {
      const branch = pickRelation(row.branches)
      const part = pickRelation(row.parts)
      const user = pickRelation(row.users)

      return {
        id: row.id,
        branch_id: row.branch_id,
        branch_name: branch?.name || row.branch_id,
        part_id: row.part_id,
        part_code: part?.code || '-',
        part_name: part?.name || row.part_id,
        part_category: part?.category || null,
        counted_quantity: Number(row.counted_quantity || 0),
        system_quantity: Number(row.system_quantity || 0),
        difference_quantity: Number(row.difference_quantity || 0),
        control_reason: row.control_reason,
        notes: row.notes,
        recorded_by_name: user?.full_name || null,
        recorded_at: row.recorded_at,
      } as InventoryControlView
    })
  },
}

export const kitsService = {
  async getAll(branchId: string) {
    const { data, error } = await supabase
      .from('product_kits')
      .select('*, product_kit_items(*)')
      .eq('branch_id', branchId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    return ((data as ProductKitRow[]) || []).map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      category: row.category || 'General',
      branch_id: row.branch_id,
      items: row.product_kit_items || [],
      created_at: row.created_at,
      updated_at: row.updated_at,
    })) as ProductKit[]
  },

  async create(input: Omit<ProductKit, 'id' | 'created_at' | 'updated_at'>) {
    const { data: createdKit, error: kitError } = await supabase
      .from('product_kits')
      .insert([
        {
          code: input.code,
          name: input.name,
          description: input.description,
          category: input.category || 'General',
          branch_id: input.branch_id,
        },
      ])
      .select('*')
      .single()

    if (kitError) throw kitError

    const rows = input.items.map((item) => ({
      kit_id: createdKit.id,
      part_id: item.part_id,
      quantity: item.quantity,
      kit_price: item.kit_price,
    }))

    if (rows.length > 0) {
      const { error: itemError } = await supabase.from('product_kit_items').insert(rows)
      if (itemError) throw itemError
    }

    return {
      id: createdKit.id,
      code: createdKit.code,
      name: createdKit.name,
      description: createdKit.description,
      category: createdKit.category || 'General',
      branch_id: createdKit.branch_id,
      items: input.items,
      created_at: createdKit.created_at,
      updated_at: createdKit.updated_at,
    } as ProductKit
  },
}

// Inventory Service
export const inventoryService = {
  async getByBranch(branchId: string) {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('branch_id', branchId)
    
    if (error) throw error
    return (data as Inventory[]) || []
  },

  async getWithParts(branchId: string) {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        parts(*)
      `)
      .eq('branch_id', branchId)
    
    if (error) throw error
    return data || []
  },

  async getLowStock(branchId: string) {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('branch_id', branchId)
      .lt('quantity', 'min_quantity')
    
    if (error) throw error
    return (data as Inventory[]) || []
  },

  async update(id: string, inventory: Partial<Inventory>) {
    const { data, error } = await supabase
      .from('inventory')
      .update(inventory)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Inventory
  },

  async adjustQuantity(id: string, quantity: number) {
    const inventory = await supabase
      .from('inventory')
      .select('quantity')
      .eq('id', id)
      .single()
    
    if (inventory.error) throw inventory.error
    
    const newQuantity = (inventory.data?.quantity || 0) + quantity
    
    const { data, error } = await supabase
      .from('inventory')
      .update({ quantity: newQuantity })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Inventory
  },

  async getBranchSummary(branchId?: string | null) {
    const [inventoryRows, branches] = await Promise.all([
      (branchId
        ? supabase
            .from('inventory')
            .select('branch_id, quantity, part_id, parts(cost)')
            .eq('branch_id', branchId)
        : supabase
            .from('inventory')
            .select('branch_id, quantity, part_id, parts(cost)'))
        .then((result) => {
          if (result.error) throw result.error
          return result.data || []
        }),
      branchesService.getAll(),
    ])

    const branchNames = new Map<string, string>(branches.map((branch) => [branch.id, branch.name]))
    const map = new Map<string, InventoryBranchSummary>()

    for (const row of inventoryRows as Array<{
      branch_id: string
      quantity: number
      parts?: { cost: number } | Array<{ cost: number }>
    }>) {
      const current = map.get(row.branch_id) || {
        branch_id: row.branch_id,
        branch_name: branchNames.get(row.branch_id) || row.branch_id,
        total_items: 0,
        total_units: 0,
        estimated_value: 0,
      }

      const part = pickRelation(row.parts)
      const qty = Number(row.quantity || 0)
      const cost = Number(part?.cost || 0)

      current.total_items += 1
      current.total_units += qty
      current.estimated_value += qty * cost
      map.set(row.branch_id, current)
    }

    return [...map.values()].sort((a, b) => b.total_units - a.total_units)
  },
}
