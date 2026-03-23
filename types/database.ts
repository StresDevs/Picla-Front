// Tipos para el sistema de gestión de repuestos

export interface Branch {
  id: string
  name: string
  location: string
  manager: string
  phone: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  full_name: string
  password_hash: string
  branch_id: string
  role: 'admin' | 'manager' | 'employee'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  full_name: string
  nit_ci: string
  phone: string
  email: string
  branch_id: string
  created_at: string
  updated_at: string
}

export interface Part {
  id: string
  code: string
  name: string
  description: string
  category: string
  price: number
  cost: number
  image_url: string
  branch_id: string
  kit_price?: number
  price_tiers?: ProductPriceTier[]
  created_at: string
  updated_at: string
}

export interface ProductPriceTier {
  id: string
  min_quantity: number
  price: number
}

export interface ProductKitItem {
  id: string
  part_id: string
  quantity: number
  kit_price: number
}

export interface ProductKit {
  id: string
  code: string
  name: string
  description: string
  branch_id: string
  items: ProductKitItem[]
  created_at: string
  updated_at: string
}

export interface Inventory {
  id: string
  part_id: string
  branch_id: string
  quantity: number
  min_quantity: number
  max_quantity: number
  last_restock: string
  created_at: string
  updated_at: string
}

export interface CashRegister {
  id: string
  user_id: string
  branch_id: string
  opening_balance: number
  closing_balance: number | null
  expected_amount: number | null
  difference: number | null
  status: 'open' | 'closed'
  opened_at: string
  closed_at: string | null
  created_at: string
  updated_at: string
}

export interface CashTransaction {
  id: string
  cash_register_id: string
  transaction_type: string
  amount: number
  description: string
  payment_method: string
  created_at: string
}

export interface CashExpense {
  id: string
  cash_register_id: string
  branch_id: string
  description: string
  amount: number
  receipt_url: string
  expense_date: string
  created_at: string
  updated_at: string
}

export interface Sale {
  id: string
  sale_date: string
  cash_register_id: string
  branch_id: string
  customer_id: string
  total_amount: number
  payment_method: 'cash' | 'qr' | 'credit'
  status: 'completed' | 'pending' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface SaleItem {
  id: string
  sale_id: string
  part_id: string
  quantity: number
  unit_price: number
  total: number
  created_at: string
}

export interface ProductTransfer {
  id: string
  part_id: string
  from_branch_id: string
  to_branch_id: string
  quantity: number
  status: 'pending' | 'completed' | 'rejected' | 'anulled' | 'returned' | 'replenished'
  user_id: string
  transfer_date: string
  received_date: string | null
  notes: string
  created_at: string
  updated_at: string
}

export interface SalesReturn {
  id: string
  sale_id: string
  part_id: string
  quantity: number
  reason: string
  branch_id: string
  return_date: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface Credit {
  id: string
  customer_id: string
  sale_id: string
  branch_id: string
  total_amount: number
  paid_amount: number
  balance: number
  status: 'active' | 'paid' | 'overdue'
  created_date: string
  due_date: string
  created_at: string
  updated_at: string
}

export interface CreditPayment {
  id: string
  credit_id: string
  amount: number
  payment_date: string
  payment_method: string
  created_at: string
}

export interface AuditLog {
  id: string
  branch_id: string
  user_id: string
  action: string
  entity_type: string
  entity_id: string
  changes: Record<string, any>
  created_at: string
}


