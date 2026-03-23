import { supabase } from './client'
import { Sale, SaleItem } from '@/types/database'

export const salesService = {
  async getByBranch(branchId: string, limit = 100, offset = 0) {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        sale_items(
          *,
          parts(name, code, price)
        ),
        customers(full_name, phone)
      `)
      .eq('branch_id', branchId)
      .order('sale_date', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (error) throw error
    return data || []
  },

  async getByRegister(registerId: string) {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        sale_items(
          *,
          parts(name, code, price)
        ),
        customers(full_name, phone)
      `)
      .eq('cash_register_id', registerId)
      .order('sale_date', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async create(sale: Omit<Sale, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('sales')
      .insert([sale])
      .select()
      .single()
    
    if (error) throw error
    return data as Sale
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        sale_items(
          *,
          parts(name, code, price)
        ),
        customers(full_name, phone, email)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, sale: Partial<Sale>) {
    const { data, error } = await supabase
      .from('sales')
      .update(sale)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Sale
  },

  async getTotalSales(branchId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('sales')
      .select('total_amount, payment_method')
      .eq('branch_id', branchId)
      .gte('sale_date', startDate)
      .lte('sale_date', endDate)
      .eq('status', 'completed')
    
    if (error) throw error
    
    return {
      total: data?.reduce((sum, s) => sum + s.total_amount, 0) || 0,
      byMethod: (data || []).reduce((acc, s) => {
        const method = s.payment_method || 'unknown'
        acc[method] = (acc[method] || 0) + s.total_amount
        return acc
      }, {} as Record<string, number>)
    }
  }
}

export const saleItemsService = {
  async addItem(item: Omit<SaleItem, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('sale_items')
      .insert([item])
      .select()
      .single()
    
    if (error) throw error
    return data as SaleItem
  },

  async removeItem(id: string) {
    const { error } = await supabase
      .from('sale_items')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async updateItem(id: string, item: Partial<SaleItem>) {
    const { data, error } = await supabase
      .from('sale_items')
      .update(item)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as SaleItem
  },
}
