import { supabase } from './client'

export interface ReportSaleDay {
  sale_date: string
  branch_id: string
  branch_name: string
  payment_method: string
  total_amount: number
  sale_count: number
  avg_sale: number
}

export interface ReportTopProduct {
  part_id: string
  part_code: string
  part_name: string
  category_name: string
  units_sold: number
  revenue: number
  avg_price: number
}

export interface ReportCapitalSummary {
  branch_id: string
  branch_name: string
  total_products: number
  total_stock: number
  capital_cost: number
  capital_retail: number
  potential_profit: number
  profit_margin: number
  low_stock_count: number
  zero_stock_count: number
}

export interface ReportCapitalProduct {
  part_id: string
  part_code: string
  part_name: string
  category_name: string
  branch_id: string
  branch_name: string
  stock: number
  min_stock: number
  unit_cost: number
  unit_price: number
  kit_price: number
  capital_cost: number
  capital_retail: number
  potential_profit: number
  stock_status: 'sin_stock' | 'stock_bajo' | 'normal'
  last_restock: string | null
}

export interface ReportCapitalCategory {
  category_name: string
  branch_id: string
  branch_name: string
  product_count: number
  total_stock: number
  capital_cost: number
  capital_retail: number
  potential_profit: number
}

export interface ReportAgingDetail {
  credit_id: string
  branch_id: string
  branch_name: string
  customer_id: string
  customer_name: string
  customer_nit: string
  customer_phone: string | null
  seller_name: string
  product_name: string
  total_amount: number
  paid_amount: number
  balance: number
  status: 'active' | 'overdue'
  due_date: string
  created_date: string
  days_overdue: number
  aging_bucket: string
  notes: string | null
}

export interface ReportAgingSummary {
  branch_id: string
  branch_name: string
  total_credits: number
  total_balance: number
  overdue_count: number
  overdue_balance: number
  active_count: number
  active_balance: number
  avg_days_overdue: number
}

export const reportsService = {
  async getSalesByDay(input?: {
    branch_id?: string | null
    date_from?: string | null
    date_to?: string | null
    payment_method?: string | null
  }): Promise<ReportSaleDay[]> {
    const { data, error } = await supabase.rpc('get_report_sales_by_day', {
      p_branch_id: input?.branch_id ?? null,
      p_date_from: input?.date_from ?? null,
      p_date_to: input?.date_to ?? null,
      p_payment_method: input?.payment_method ?? null,
    })

    if (error) throw error
    return (data || []) as ReportSaleDay[]
  },

  async getTopProducts(input?: {
    branch_id?: string | null
    date_from?: string | null
    date_to?: string | null
    limit?: number
  }): Promise<ReportTopProduct[]> {
    const { data, error } = await supabase.rpc('get_report_top_products', {
      p_branch_id: input?.branch_id ?? null,
      p_date_from: input?.date_from ?? null,
      p_date_to: input?.date_to ?? null,
      p_limit: input?.limit ?? 20,
    })

    if (error) throw error
    return (data || []) as ReportTopProduct[]
  },

  async getCapitalSummary(input?: {
    branch_id?: string | null
  }): Promise<ReportCapitalSummary[]> {
    const { data, error } = await supabase.rpc('get_report_capital_summary', {
      p_branch_id: input?.branch_id ?? null,
    })

    if (error) throw error
    return (data || []) as ReportCapitalSummary[]
  },

  async getCapitalProducts(input?: {
    branch_id?: string | null
    category_id?: string | null
    search?: string | null
    sort_by?: string | null
    limit?: number
  }): Promise<ReportCapitalProduct[]> {
    const { data, error } = await supabase.rpc('get_report_capital_products', {
      p_branch_id: input?.branch_id ?? null,
      p_category_id: input?.category_id ?? null,
      p_search: input?.search ?? null,
      p_sort_by: input?.sort_by ?? 'capital_cost',
      p_limit: input?.limit ?? 100,
    })

    if (error) throw error
    return (data || []) as ReportCapitalProduct[]
  },

  async getCapitalByCategory(input?: {
    branch_id?: string | null
  }): Promise<ReportCapitalCategory[]> {
    const { data, error } = await supabase.rpc('get_report_capital_by_category', {
      p_branch_id: input?.branch_id ?? null,
    })

    if (error) throw error
    return (data || []) as ReportCapitalCategory[]
  },

  async getAgingDetail(input?: {
    branch_id?: string | null
    status?: string | null
  }): Promise<ReportAgingDetail[]> {
    const { data, error } = await supabase.rpc('get_report_aging_detail', {
      p_branch_id: input?.branch_id ?? null,
      p_status: input?.status ?? null,
    })

    if (error) throw error
    return (data || []) as ReportAgingDetail[]
  },

  async getAgingSummary(input?: {
    branch_id?: string | null
  }): Promise<ReportAgingSummary[]> {
    const { data, error } = await supabase.rpc('get_report_aging_summary', {
      p_branch_id: input?.branch_id ?? null,
    })

    if (error) throw error
    return (data || []) as ReportAgingSummary[]
  },
}
