import { supabase } from './client'
import { Credit, CreditPayment } from '@/types/database'

export const creditsService = {
  async getByBranch(branchId: string) {
    const { data, error } = await supabase
      .from('credits')
      .select('*')
      .eq('branch_id', branchId)
      .order('created_date', { ascending: false })
    
    if (error) throw error
    return (data as Credit[]) || []
  },

  async create(credit: Omit<Credit, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('credits')
      .insert([credit])
      .select()
      .single()
    
    if (error) throw error
    return data as Credit
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('credits')
      .select(`
        *,
        credit_payments(*)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, credit: Partial<Credit>) {
    const { data, error } = await supabase
      .from('credits')
      .update(credit)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Credit
  },

  async getOverdue() {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('credits')
      .select('*')
      .lt('due_date', today)
      .eq('status', 'active')
    
    if (error) throw error
    return (data as Credit[]) || []
  },
}

export const creditPaymentsService = {
  async addPayment(payment: Omit<CreditPayment, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('credit_payments')
      .insert([payment])
      .select()
      .single()
    
    if (error) throw error

    // Update credit balance
    const creditData = await supabase
      .from('credits')
      .select('paid_amount, total_amount')
      .eq('id', payment.credit_id)
      .single()
    
    if (creditData.data) {
      const newPaidAmount = (creditData.data.paid_amount || 0) + payment.amount
      const newBalance = creditData.data.total_amount - newPaidAmount
      const status = newBalance <= 0 ? 'paid' : 'active'

      await supabase
        .from('credits')
        .update({
          paid_amount: newPaidAmount,
          balance: Math.max(0, newBalance),
          status,
        })
        .eq('id', payment.credit_id)
    }

    return data as CreditPayment
  },

  async getByCredit(creditId: string) {
    const { data, error } = await supabase
      .from('credit_payments')
      .select('*')
      .eq('credit_id', creditId)
      .order('payment_date', { ascending: false })
    
    if (error) throw error
    return (data as CreditPayment[]) || []
  },
}
