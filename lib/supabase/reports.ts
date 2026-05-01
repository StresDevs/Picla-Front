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
}
