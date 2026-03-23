import { mockProducts, mockCustomers } from '@/lib/mock/data'
import type { Part } from '@/types/database'

export interface ProductTransferRecord {
  id: string
  part_id: string
  part_name: string
  from_branch_id: string
  to_branch_id: string
  quantity: number
  status: 'completed'
  user_name: string
  transfer_date: string
  notes: string
}

export interface ReturnRecord {
  id: string
  part_id: string
  part_name: string
  quantity: number
  reason: string
  customer_name: string
  status: 'completed'
  created_at: string
}

export interface SaleRecord {
  id: string
  branch_id: string
  user_name: string
  total_amount: number
  payment_method: 'cash' | 'qr' | 'credit'
  created_at: string
  sale_currency?: 'BOB' | 'USD'
  exchange_rate?: number
  total_amount_bob?: number
  total_amount_usd?: number
  paid_amount?: number
}

export interface AppSettingsRecord {
  company_name: string
  company_email: string
  company_phone: string
  default_currency: 'BOB' | 'USD'
  usd_to_bob_rate: number
}

interface UserRecord {
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

interface CustomerRecord {
  id: string
  full_name: string
  nit_ci: string
  phone: string
  email: string
  branch_id: string
  created_at: string
  updated_at: string
}

const KEYS = {
  products: 'mock_products_v1',
  transfers: 'mock_transfers_v1',
  returns: 'mock_returns_v1',
  sales: 'mock_sales_v1',
  users: 'mock_users_v1',
  customers: 'mock_customers_v1',
  settings: 'mock_settings_v1',
}

function hasWindow() {
  return typeof window !== 'undefined'
}

function readJSON<T>(key: string, fallback: T): T {
  if (!hasWindow()) return fallback
  const raw = window.localStorage.getItem(key)
  if (!raw) return fallback

  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJSON<T>(key: string, value: T) {
  if (!hasWindow()) return
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function getProducts(): Part[] {
  const seeded = readJSON<Part[] | null>(KEYS.products, null)
  if (seeded && seeded.length > 0) return seeded

  const initial = mockProducts as Part[]
  writeJSON(KEYS.products, initial)
  return initial
}

export function saveProducts(products: Part[]) {
  writeJSON(KEYS.products, products)
}

export function getTransfers(): ProductTransferRecord[] {
  return readJSON<ProductTransferRecord[]>(KEYS.transfers, [])
}

export function addTransfer(transfer: ProductTransferRecord) {
  const current = getTransfers()
  writeJSON(KEYS.transfers, [transfer, ...current])
}

export function getReturns(): ReturnRecord[] {
  return readJSON<ReturnRecord[]>(KEYS.returns, [])
}

export function addReturn(returnRecord: ReturnRecord) {
  const current = getReturns()
  writeJSON(KEYS.returns, [returnRecord, ...current])
}

export function getSales(): SaleRecord[] {
  return readJSON<SaleRecord[]>(KEYS.sales, [])
}

export function addSale(sale: SaleRecord) {
  const current = getSales()
  writeJSON(KEYS.sales, [sale, ...current])
}

export function getUsers(): UserRecord[] {
  const seeded = readJSON<UserRecord[] | null>(KEYS.users, null)
  if (seeded && seeded.length > 0) return seeded

  const now = new Date().toISOString()
  const initial: UserRecord[] = [
    {
      id: 'usr-1',
      email: 'admin@example.com',
      full_name: 'Administrador Principal',
      password_hash: '******',
      branch_id: 'branch-1',
      role: 'admin',
      is_active: true,
      created_at: now,
      updated_at: now,
    },
  ]

  writeJSON(KEYS.users, initial)
  return initial
}

export function saveUsers(users: UserRecord[]) {
  writeJSON(KEYS.users, users)
}

export function getCustomers(): CustomerRecord[] {
  const seeded = readJSON<CustomerRecord[] | null>(KEYS.customers, null)
  if (seeded && seeded.length > 0) return seeded

  const initial = mockCustomers as CustomerRecord[]
  writeJSON(KEYS.customers, initial)
  return initial
}

export function saveCustomers(customers: CustomerRecord[]) {
  writeJSON(KEYS.customers, customers)
}

export function getAppSettings(): AppSettingsRecord {
  const seeded = readJSON<AppSettingsRecord | null>(KEYS.settings, null)
  if (seeded) return seeded

  const initial: AppSettingsRecord = {
    company_name: 'Mi Tienda de Repuestos',
    company_email: 'info@repuestos.com',
    company_phone: '555-0000',
    default_currency: 'BOB',
    usd_to_bob_rate: 6.96,
  }

  writeJSON(KEYS.settings, initial)
  return initial
}

export function saveAppSettings(settings: AppSettingsRecord) {
  writeJSON(KEYS.settings, settings)
}
