import { supabase } from './client'
import { Part, Inventory } from '@/types/database'

// Parts Service
export const partsService = {
  async getAll(branchId: string) {
    const { data, error } = await supabase
      .from('parts')
      .select('*')
      .eq('branch_id', branchId)
      .order('name', { ascending: true })
    
    if (error) throw error
    return (data as Part[]) || []
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('parts')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as Part
  },

  async create(part: Omit<Part, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('parts')
      .insert([part])
      .select()
      .single()
    
    if (error) throw error
    return data as Part
  },

  async update(id: string, part: Partial<Part>) {
    const { data, error } = await supabase
      .from('parts')
      .update(part)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Part
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
      .select('*')
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
    return (data as Part[]) || []
  },

  async getCategories(branchId: string) {
    const { data, error } = await supabase
      .from('parts')
      .select('category')
      .eq('branch_id', branchId)
      .neq('category', null)
      .order('category', { ascending: true })
    
    if (error) throw error
    const categories = [...new Set((data || []).map(p => p.category))].filter(Boolean)
    return categories
  }
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
