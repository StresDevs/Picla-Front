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
  max_quantity?: number | null
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
      p_max_quantity: part.max_quantity ?? null,
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
      max_quantity: part.max_quantity,
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
}
