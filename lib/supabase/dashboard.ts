import { supabase } from './client'

export interface DashboardSaleDay {
  date: string
  total: number
  count: number
}

export interface DashboardSaleByMethod {
  method: string
  total: number
}

export interface DashboardTopProduct {
  name: string
  quantity: number
  total: number
}

export interface DashboardSummary {
  sales_today: number
  sales_today_count: number
  sales_week: number
  credits_active_count: number
  credits_active_balance: number
  credits_overdue_count: number
  low_stock_count: number
  zero_stock_count: number
  sales_last_7_days: DashboardSaleDay[]
  sales_by_method: DashboardSaleByMethod[]
  top_products_week: DashboardTopProduct[]
}

export const dashboardService = {
  async getSummary(branchId?: string | null): Promise<DashboardSummary> {
    const { data, error } = await supabase.rpc('get_dashboard_summary', {
      p_branch_id: branchId ?? null,
    })

    if (error) throw error

    const raw = (Array.isArray(data) ? data[0] : data) as DashboardSummary | null

    return raw ?? {
      sales_today: 0,
      sales_today_count: 0,
      sales_week: 0,
      credits_active_count: 0,
      credits_active_balance: 0,
      credits_overdue_count: 0,
      low_stock_count: 0,
      zero_stock_count: 0,
      sales_last_7_days: [],
      sales_by_method: [],
      top_products_week: [],
    }
  },
}
