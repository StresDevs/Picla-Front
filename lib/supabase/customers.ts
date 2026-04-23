import { supabase } from './client'

export interface CustomerRecord {
  id: string
  full_name: string
  nit_ci: string
  phone: string | null
  email: string | null
  branch_id: string
  is_active?: boolean
  created_at: string
  updated_at: string
}

function parseSingleRpcRow<T>(data: T[] | T | null): T | null {
  if (!data) return null
  return Array.isArray(data) ? (data[0] ?? null) : data
}

export const customersService = {
  async getList(input?: {
    branch_id?: string | null
    search?: string | null
    include_inactive?: boolean
  }) {
    const { data, error } = await supabase.rpc('customers_get_list', {
      p_branch_id: input?.branch_id ?? null,
      p_search: input?.search ?? null,
      p_include_inactive: input?.include_inactive ?? false,
    })

    if (error) throw error
    return (data || []) as CustomerRecord[]
  },

  async getForSales(input?: { branch_id?: string | null; search?: string | null }) {
    const { data, error } = await supabase.rpc('customer_get_for_sales', {
      p_branch_id: input?.branch_id ?? null,
      p_search: input?.search ?? null,
    })

    if (error) throw error
    return (data || []) as CustomerRecord[]
  },

  async createQuick(input: {
    branch_id?: string | null
    full_name: string
    nit_ci: string
    phone?: string | null
    email?: string | null
  }) {
    const { data, error } = await supabase.rpc('customers_create_quick', {
      p_branch_id: input.branch_id ?? null,
      p_full_name: input.full_name,
      p_nit_ci: input.nit_ci,
      p_phone: input.phone ?? null,
      p_email: input.email ?? null,
    })

    if (error) throw error
    return parseSingleRpcRow<CustomerRecord>(data as CustomerRecord[] | CustomerRecord | null)
  },

  async create(input: {
    branch_id?: string | null
    full_name: string
    nit_ci: string
    phone?: string | null
    email?: string | null
  }) {
    const { data, error } = await supabase.rpc('customers_create', {
      p_branch_id: input.branch_id ?? null,
      p_full_name: input.full_name,
      p_nit_ci: input.nit_ci,
      p_phone: input.phone ?? null,
      p_email: input.email ?? null,
    })

    if (error) throw error
    return parseSingleRpcRow<CustomerRecord>(data as CustomerRecord[] | CustomerRecord | null)
  },

  async update(input: {
    customer_id: string
    full_name: string
    nit_ci: string
    phone?: string | null
    email?: string | null
    is_active?: boolean | null
  }) {
    const { data, error } = await supabase.rpc('customers_update', {
      p_customer_id: input.customer_id,
      p_full_name: input.full_name,
      p_nit_ci: input.nit_ci,
      p_phone: input.phone ?? null,
      p_email: input.email ?? null,
      p_is_active: input.is_active ?? null,
    })

    if (error) throw error
    return parseSingleRpcRow<CustomerRecord>(data as CustomerRecord[] | CustomerRecord | null)
  },

  async remove(input: { customer_id: string; soft_delete?: boolean }) {
    const { data, error } = await supabase.rpc('customers_delete', {
      p_customer_id: input.customer_id,
      p_soft_delete: input.soft_delete ?? true,
    })

    if (error) throw error
    return data as string
  },
}
