import { mockBranches, mockCustomers, mockProducts } from '@/lib/mock/data'
import type { Part, ProductKit, ProductKitItem, ProductPriceTier } from '@/types/database'

export type TransferActionType = 'anulacion' | 'devolucion' | 'reposicion'
export type TransferEventType = 'traspaso' | 'envio' | TransferActionType
export type TransferStatus = 'completed' | 'anulled' | 'returned' | 'replenished'

export interface ProductTransferRecord {
  id: string
  part_id: string
  part_name: string
  category: string
  from_branch_id: string
  to_branch_id: string
  quantity: number
  status: TransferStatus
  user_name: string
  transfer_date: string
  notes: string
  resolution_reason?: string
}

export interface TransferHistoryRecord {
  id: string
  transfer_id: string
  event_type: TransferEventType
  part_id: string
  part_name: string
  category: string
  from_branch_id: string
  to_branch_id: string
  quantity: number
  reason: string
  user_name: string
  event_date: string
}

export interface InventorySnapshotRecord {
  id: string
  snapshot_date: string
  branch_id: string
  part_id: string
  part_name: string
  category: string
  opening_stock: number
  recorded_at: string
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
  user_role?: AppUserRole
  total_amount: number
  payment_method: 'cash' | 'qr' | 'credit'
  created_at: string
  sale_currency?: 'BOB' | 'USD'
  exchange_rate?: number
  total_amount_bob?: number
  total_amount_usd?: number
  paid_amount?: number
}

export type CreditStatus = 'registered' | 'overdue' | 'paid'

export interface CreditRecord {
  id: string
  customer_id: string
  customer_name: string
  branch_id: string
  branch_name: string
  seller_name: string
  product_name: string
  total_amount: number
  paid_amount: number
  balance: number
  status: CreditStatus
  due_date: string
  reminder_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

export type QuotationStatus = 'active' | 'cancelled' | 'converted'

export interface QuotationItemRecord {
  id: string
  part_id: string
  part_code: string
  part_name: string
  quantity: number
  unit_price: number
  line_total: number
}

export interface QuotationRecord {
  id: string
  customer_id: string
  customer_name: string
  branch_id: string
  branch_name: string
  quoted_by: string
  expires_at: string
  items: QuotationItemRecord[]
  total_amount: number
  status: QuotationStatus
  converted_sale_id?: string
  created_at: string
  updated_at: string
}

export interface AppSettingsRecord {
  company_name: string
  company_email: string
  company_phone: string
  default_currency: 'BOB' | 'USD'
  usd_to_bob_rate: number
  max_open_credits_per_customer: number
}

export type AppUserRole = 'admin' | 'manager' | 'employee' | 'read_only'

export interface ActiveUserContext {
  role: AppUserRole
  user_name: string
  branch_id: string
}

export interface UserRecord {
  id: string
  email: string
  full_name: string
  password_hash: string
  branch_id: string
  role: AppUserRole
  shift_start: string
  shift_end: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DeviceSessionRecord {
  id: string
  user_email: string
  user_name: string
  role: AppUserRole
  branch_id: string
  device_name: string
  browser: string
  os: string
  ip_address: string
  login_at: string
  status: 'active' | 'closed'
}

export interface QueuedSaleLine {
  id: string
  type: 'product' | 'kit'
  name: string
  quantity: number
  unit_price: number
  total_price: number
}

export interface QueuedSaleRecord {
  id: string
  branch_id: string
  created_by_name: string
  created_by_role: AppUserRole
  payment_method: 'cash' | 'qr' | 'credit'
  sale_currency: 'BOB' | 'USD'
  exchange_rate: number
  total_amount_bob: number
  total_amount_usd: number
  customer_name: string
  lines: QueuedSaleLine[]
  status: 'queued' | 'approved' | 'rejected'
  created_at: string
  approved_at?: string
  approved_by?: string
  approved_sale_id?: string
}

export interface InventoryExitRecord {
  id: string
  branch_id: string
  branch_name: string
  product_id: string
  product_name: string
  category: string
  quantity: number
  reason: string
  source_type: 'adjustment_error' | 'damage' | 'internal_use' | 'other'
  source_reference?: string
  user_name: string
  created_at: string
}

export interface InventoryCrudLogRecord {
  id: string
  entity_type: 'product' | 'kit' | 'transfer' | 'inventory_exit' | 'quotation' | 'sale'
  action: 'create' | 'update' | 'delete'
  entity_id: string
  entity_name: string
  branch_id?: string
  user_name: string
  details?: string
  created_at: string
}

export interface TemporaryKitAuditRecord {
  id: string
  name: string
  category: string
  branch_id: string
  created_by_name: string
  created_by_role: AppUserRole
  items_count: number
  estimated_total: number
  related_sale_id?: string
  created_at: string
}

export interface PayrollConfigRecord {
  id: string
  role: AppUserRole
  branch_id: string
  amount: number
  periodicity: 'monthly' | 'biweekly' | 'weekly'
  active: boolean
  created_at: string
  updated_at: string
}

export interface PayrollPaymentRecord {
  id: string
  user_id: string
  user_name: string
  role: AppUserRole
  branch_id: string
  amount: number
  period_label: string
  status: 'pending' | 'confirmed'
  created_at: string
  confirmed_at?: string
  confirmed_by?: string
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

interface NewTransferInput {
  part_id: string
  part_name: string
  category: string
  from_branch_id: string
  to_branch_id: string
  quantity: number
  user_name: string
  notes: string
}

interface NewKitInput {
  code: string
  name: string
  description: string
  category?: string
  branch_id: string
  items: ProductKitItem[]
}

const KEYS = {
  products: 'mock_products_v2',
  kits: 'mock_kits_v1',
  transfers: 'mock_transfers_v2',
  transferHistory: 'mock_transfer_history_v2',
  returns: 'mock_returns_v1',
  sales: 'mock_sales_v1',
  users: 'mock_users_v1',
  customers: 'mock_customers_v1',
  credits: 'mock_credits_v1',
  quotations: 'mock_quotations_v1',
  settings: 'mock_settings_v1',
  adminMode: 'mock_admin_mode_v1',
  inventorySnapshots: 'mock_inventory_snapshots_v1',
  readOnlyMode: 'mock_read_only_mode_v1',
  deviceSessions: 'mock_device_sessions_v1',
  activeRole: 'mock_active_role_v1',
  activeUserName: 'mock_active_user_name_v1',
  activeBranchId: 'mock_active_branch_id_v1',
  queuedSales: 'mock_queued_sales_v1',
  inventoryExits: 'mock_inventory_exits_v1',
  inventoryCrudLogs: 'mock_inventory_crud_logs_v1',
  temporaryKitsAudit: 'mock_temporary_kits_audit_v1',
  payrollConfigs: 'mock_payroll_configs_v1',
  payrollPayments: 'mock_payroll_payments_v1',
}

export const ADMIN_MODE_EVENT = 'mock-admin-mode-changed'
export const READ_ONLY_MODE_EVENT = 'mock-read-only-mode-changed'
export const ACTIVE_ROLE_EVENT = 'mock-active-role-changed'

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

function withDefaultPriceTiers(products: Part[]): Part[] {
  return products.map((product) => {
    const tiers = Array.isArray(product.price_tiers) ? product.price_tiers : []
    const kitPrice = typeof product.kit_price === 'number' && product.kit_price > 0
      ? Number(product.kit_price.toFixed(2))
      : Number((product.price * 0.85).toFixed(2))
    const quotationMin = typeof product.quotation_min_price === 'number' && product.quotation_min_price > 0
      ? Number(product.quotation_min_price.toFixed(2))
      : Number((product.price * 0.9).toFixed(2))
    const quotationMax = typeof product.quotation_max_price === 'number' && product.quotation_max_price >= quotationMin
      ? Number(product.quotation_max_price.toFixed(2))
      : Number((product.price * 1.2).toFixed(2))
    const trackingMode = product.tracking_mode || 'none'

    if (tiers.length > 0) {
      return {
        ...product,
        kit_price: kitPrice,
        quotation_min_price: quotationMin,
        quotation_max_price: quotationMax,
        tracking_mode: trackingMode,
      }
    }

    return {
      ...product,
      kit_price: kitPrice,
      quotation_min_price: quotationMin,
      quotation_max_price: quotationMax,
      tracking_mode: trackingMode,
      price_tiers: [
        {
          id: `tier-${product.id}-1`,
          min_quantity: 1,
          price: product.price,
        },
      ],
    }
  })
}

function getBranchId(index: number) {
  return mockBranches[index]?.id ?? 'branch-1'
}

function getSeedTransfers(): ProductTransferRecord[] {
  const products = getProducts()

  const p1 = products[0]
  const p2 = products[1]
  const p3 = products[5] ?? products[2]

  if (!p1 || !p2 || !p3) return []

  return [
    {
      id: 'trf-seed-001',
      part_id: p1.id,
      part_name: p1.name,
      category: p1.category,
      from_branch_id: getBranchId(0),
      to_branch_id: getBranchId(1),
      quantity: 8,
      status: 'completed',
      user_name: 'Jefe de Inventario',
      transfer_date: '2026-03-20T10:30:00.000Z',
      notes: 'Reposicion semanal de filtros',
    },
    {
      id: 'trf-seed-002',
      part_id: p2.id,
      part_name: p2.name,
      category: p2.category,
      from_branch_id: getBranchId(0),
      to_branch_id: getBranchId(2),
      quantity: 6,
      status: 'returned',
      user_name: 'Jefe de Inventario',
      transfer_date: '2026-03-21T14:15:00.000Z',
      notes: 'Pedido por faltante de frenos',
      resolution_reason: 'Se devolvio por error en especificacion de modelo',
    },
    {
      id: 'trf-seed-003',
      part_id: p3.id,
      part_name: p3.name,
      category: p3.category,
      from_branch_id: getBranchId(1),
      to_branch_id: getBranchId(3),
      quantity: 20,
      status: 'anulled',
      user_name: 'Encargado Norte',
      transfer_date: '2026-03-22T09:05:00.000Z',
      notes: 'Campana de mantenimiento preventivo',
      resolution_reason: 'Anulado por duplicidad de solicitud',
    },
  ]
}

function getSeedKits(): ProductKit[] {
  const products = getProducts()
  const sparkPlug = products.find((item) => item.name.toLowerCase().includes('buj'))
  const cableSet = products.find((item) => item.name.toLowerCase().includes('correa')) || products[1]
  const oil = products.find((item) => item.name.toLowerCase().includes('aceite'))
  const filter = products.find((item) => item.name.toLowerCase().includes('filtro'))

  const kits: ProductKit[] = []

  if (sparkPlug && cableSet) {
    kits.push({
      id: 'kit-seed-001',
      code: 'KIT-ENC-001',
      name: 'Kit de Encendido',
      description: '6 bujias + cables con precio especial de paquete',
      category: 'Mantenimiento',
      branch_id: 'branch-1',
      items: [
        {
          id: 'kit-item-001',
          part_id: sparkPlug.id,
          quantity: 6,
          kit_price: sparkPlug.kit_price || Number((sparkPlug.price * 0.8).toFixed(2)),
        },
        {
          id: 'kit-item-002',
          part_id: cableSet.id,
          quantity: 1,
          kit_price: cableSet.kit_price || Number((cableSet.price * 0.75).toFixed(2)),
        },
      ],
      created_at: '2026-03-22T09:00:00.000Z',
      updated_at: '2026-03-22T09:00:00.000Z',
    })
  }

  if (oil && filter) {
    kits.push({
      id: 'kit-seed-002',
      code: 'KIT-MNT-001',
      name: 'Kit Mantenimiento Basico',
      description: 'Cambio de aceite y filtro con descuento',
      category: 'Servicio',
      branch_id: 'branch-1',
      items: [
        {
          id: 'kit-item-003',
          part_id: oil.id,
          quantity: 4,
          kit_price: oil.kit_price || Number((oil.price * 0.88).toFixed(2)),
        },
        {
          id: 'kit-item-004',
          part_id: filter.id,
          quantity: 1,
          kit_price: filter.kit_price || Number((filter.price * 0.82).toFixed(2)),
        },
      ],
      created_at: '2026-03-22T10:00:00.000Z',
      updated_at: '2026-03-22T10:00:00.000Z',
    })
  }

  return kits
}

function getSeedInventorySnapshots(): InventorySnapshotRecord[] {
  const products = getProducts().slice(0, 6)
  const branches = mockBranches.slice(0, 3)
  const daysBack = [0, 1, 2, 3, 4]

  const snapshots: InventorySnapshotRecord[] = []

  const getDayIso = (daysAgo: number) => {
    const date = new Date()
    date.setHours(7, 30, 0, 0)
    date.setDate(date.getDate() - daysAgo)
    return date.toISOString()
  }

  daysBack.forEach((daysAgo) => {
    branches.forEach((branch, branchIndex) => {
      products.forEach((product, productIndex) => {
        const baseQty = 120 - productIndex * 9 - daysAgo * 5 + branchIndex * 4
        const opening_stock = Math.max(12, Math.round(baseQty))

        snapshots.push({
          id: `snap-${branch.id}-${product.id}-${daysAgo}`,
          snapshot_date: getDayIso(daysAgo),
          branch_id: branch.id,
          part_id: product.id,
          part_name: product.name,
          category: product.category,
          opening_stock,
          recorded_at: getDayIso(daysAgo),
        })
      })
    })
  })

  return snapshots.sort(
    (a, b) => new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime()
  )
}

function getSeedDeviceSessions(): DeviceSessionRecord[] {
  const users = getUsers()
  const employee = users.find((item) => item.role === 'employee')
  const readOnly = users.find((item) => item.role === 'read_only')

  const now = Date.now()

  return [
    {
      id: 'dev-seed-001',
      user_email: employee?.email || 'empleado@picla.com',
      user_name: employee?.full_name || 'Empleado Demo',
      role: employee?.role || 'employee',
      branch_id: employee?.branch_id || 'branch-1',
      device_name: 'Desktop Oficina',
      browser: 'Chrome 124',
      os: 'Windows',
      ip_address: '192.168.1.18',
      login_at: new Date(now - 1000 * 60 * 40).toISOString(),
      status: 'active',
    },
    {
      id: 'dev-seed-002',
      user_email: readOnly?.email || 'consulta@picla.com',
      user_name: readOnly?.full_name || 'Usuario Solo Lectura',
      role: readOnly?.role || 'read_only',
      branch_id: readOnly?.branch_id || 'branch-2',
      device_name: 'Tablet Mostrador',
      browser: 'Edge 123',
      os: 'Android',
      ip_address: '192.168.1.39',
      login_at: new Date(now - 1000 * 60 * 60 * 15).toISOString(),
      status: 'closed',
    },
  ]
}

function getSeedCredits(): CreditRecord[] {
  const customers = getCustomers()
  const now = Date.now()

  const c1 = customers[0]
  const c2 = customers[1]

  if (!c1 || !c2) return []

  return [
    {
      id: 'cr-seed-001',
      customer_id: c1.id,
      customer_name: c1.full_name,
      branch_id: 'branch-1',
      branch_name: 'Sucursal Centro',
      seller_name: 'Vendedor Demo',
      product_name: 'Pastillas de Freno',
      total_amount: 1500,
      paid_amount: 500,
      balance: 1000,
      status: 'registered',
      due_date: new Date(now + 1000 * 60 * 60 * 24 * 8).toISOString(),
      reminder_date: new Date(now + 1000 * 60 * 60 * 24 * 5).toISOString(),
      notes: 'Pago semanal acordado',
      created_at: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(),
      updated_at: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(),
    },
    {
      id: 'cr-seed-002',
      customer_id: c1.id,
      customer_name: c1.full_name,
      branch_id: 'branch-1',
      branch_name: 'Sucursal Centro',
      seller_name: 'Vendedor Demo',
      product_name: 'Filtro de Aire',
      total_amount: 700,
      paid_amount: 0,
      balance: 700,
      status: 'overdue',
      due_date: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(),
      reminder_date: new Date(now - 1000 * 60 * 60 * 24 * 4).toISOString(),
      notes: 'Sin pagos registrados',
      created_at: new Date(now - 1000 * 60 * 60 * 24 * 20).toISOString(),
      updated_at: new Date(now - 1000 * 60 * 60 * 24 * 4).toISOString(),
    },
    {
      id: 'cr-seed-003',
      customer_id: c2.id,
      customer_name: c2.full_name,
      branch_id: 'branch-2',
      branch_name: 'Sucursal Norte',
      seller_name: 'Vendedor Norte',
      product_name: 'Aceite Motor 5W-40',
      total_amount: 720,
      paid_amount: 720,
      balance: 0,
      status: 'paid',
      due_date: new Date(now - 1000 * 60 * 60 * 24 * 3).toISOString(),
      created_at: new Date(now - 1000 * 60 * 60 * 24 * 14).toISOString(),
      updated_at: new Date(now - 1000 * 60 * 60 * 24 * 1).toISOString(),
    },
  ]
}

function seedCreditsIfNeeded() {
  const existing = readJSON<CreditRecord[] | null>(KEYS.credits, null)
  if (existing && existing.length > 0) return
  writeJSON(KEYS.credits, getSeedCredits())
}

function seedQuotationsIfNeeded() {
  const existing = readJSON<QuotationRecord[] | null>(KEYS.quotations, null)
  if (existing && existing.length > 0) return
  writeJSON(KEYS.quotations, [])
}

function seedKitsIfNeeded() {
  const existing = readJSON<ProductKit[] | null>(KEYS.kits, null)
  if (existing && existing.length > 0) return

  writeJSON(KEYS.kits, getSeedKits())
}

function getSeedTransferHistory(transfers: ProductTransferRecord[]): TransferHistoryRecord[] {
  const history: TransferHistoryRecord[] = []

  for (const transfer of transfers) {
    history.push({
      id: `evt-traspaso-${transfer.id}`,
      transfer_id: transfer.id,
      event_type: 'traspaso',
      part_id: transfer.part_id,
      part_name: transfer.part_name,
      category: transfer.category,
      from_branch_id: transfer.from_branch_id,
      to_branch_id: transfer.to_branch_id,
      quantity: transfer.quantity,
      reason: transfer.notes || 'Traspaso registrado',
      user_name: transfer.user_name,
      event_date: transfer.transfer_date,
    })

    if (transfer.status === 'anulled') {
      history.push({
        id: `evt-anulacion-${transfer.id}`,
        transfer_id: transfer.id,
        event_type: 'anulacion',
        part_id: transfer.part_id,
        part_name: transfer.part_name,
        category: transfer.category,
        from_branch_id: transfer.from_branch_id,
        to_branch_id: transfer.to_branch_id,
        quantity: transfer.quantity,
        reason: transfer.resolution_reason || 'Anulado por control interno',
        user_name: transfer.user_name,
        event_date: '2026-03-22T10:00:00.000Z',
      })
    }

    if (transfer.status === 'returned') {
      history.push({
        id: `evt-devolucion-${transfer.id}`,
        transfer_id: transfer.id,
        event_type: 'devolucion',
        part_id: transfer.part_id,
        part_name: transfer.part_name,
        category: transfer.category,
        from_branch_id: transfer.to_branch_id,
        to_branch_id: transfer.from_branch_id,
        quantity: transfer.quantity,
        reason: transfer.resolution_reason || 'Devolucion por ajuste de pedido',
        user_name: transfer.user_name,
        event_date: '2026-03-21T16:00:00.000Z',
      })
    }
  }

  history.sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
  return history
}

function seedTransfersIfNeeded() {
  const existingTransfers = readJSON<ProductTransferRecord[] | null>(KEYS.transfers, null)
  const existingHistory = readJSON<TransferHistoryRecord[] | null>(KEYS.transferHistory, null)

  if (existingTransfers && existingTransfers.length > 0 && existingHistory && existingHistory.length > 0) {
    return
  }

  const seedTransfers = getSeedTransfers()
  const seedHistory = getSeedTransferHistory(seedTransfers)

  writeJSON(KEYS.transfers, seedTransfers)
  writeJSON(KEYS.transferHistory, seedHistory)
}

function seedInventorySnapshotsIfNeeded() {
  const existingSnapshots = readJSON<InventorySnapshotRecord[] | null>(KEYS.inventorySnapshots, null)
  if (existingSnapshots && existingSnapshots.length > 0) return

  const seed = getSeedInventorySnapshots()
  writeJSON(KEYS.inventorySnapshots, seed)
}

function seedDeviceSessionsIfNeeded() {
  const existingSessions = readJSON<DeviceSessionRecord[] | null>(KEYS.deviceSessions, null)
  if (existingSessions && existingSessions.length > 0) return

  writeJSON(KEYS.deviceSessions, getSeedDeviceSessions())
}

function normalizeTransferEventType(value: TransferEventType) {
  return value === 'envio' ? 'traspaso' : value
}

function seedQueuedSalesIfNeeded() {
  const existing = readJSON<QueuedSaleRecord[] | null>(KEYS.queuedSales, null)
  if (existing) return
  writeJSON(KEYS.queuedSales, [])
}

function getSeedInventoryExits(): InventoryExitRecord[] {
  const products = getProducts()
  const first = products[0]
  const second = products[1]

  if (!first || !second) return []

  return [
    {
      id: 'out-seed-001',
      branch_id: 'branch-1',
      branch_name: 'Sucursal Centro',
      product_id: first.id,
      product_name: first.name,
      category: first.category,
      quantity: 3,
      reason: 'Ajuste por error de venta',
      source_type: 'adjustment_error',
      source_reference: 'VT-2026-022',
      user_name: 'Encargado Centro',
      created_at: '2026-03-19T11:25:00.000Z',
    },
    {
      id: 'out-seed-002',
      branch_id: 'branch-2',
      branch_name: 'Sucursal Norte',
      product_id: second.id,
      product_name: second.name,
      category: second.category,
      quantity: 2,
      reason: 'Uso interno de taller',
      source_type: 'internal_use',
      source_reference: 'MNT-2026-004',
      user_name: 'Supervisor Norte',
      created_at: '2026-03-20T15:45:00.000Z',
    },
  ]
}

function seedInventoryExitsIfNeeded() {
  const existing = readJSON<InventoryExitRecord[] | null>(KEYS.inventoryExits, null)
  if (existing && existing.length > 0) return
  writeJSON(KEYS.inventoryExits, getSeedInventoryExits())
}

function seedInventoryCrudLogsIfNeeded() {
  const existing = readJSON<InventoryCrudLogRecord[] | null>(KEYS.inventoryCrudLogs, null)
  if (existing) return
  writeJSON(KEYS.inventoryCrudLogs, [])
}

function seedTemporaryKitsAuditIfNeeded() {
  const existing = readJSON<TemporaryKitAuditRecord[] | null>(KEYS.temporaryKitsAudit, null)
  if (existing) return
  writeJSON(KEYS.temporaryKitsAudit, [])
}

function seedPayrollConfigsIfNeeded() {
  const existing = readJSON<PayrollConfigRecord[] | null>(KEYS.payrollConfigs, null)
  if (existing && existing.length > 0) return

  const now = new Date().toISOString()
  const seed: PayrollConfigRecord[] = [
    {
      id: 'paycfg-001',
      role: 'manager',
      branch_id: 'branch-1',
      amount: 4200,
      periodicity: 'monthly',
      active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'paycfg-002',
      role: 'employee',
      branch_id: 'branch-1',
      amount: 3200,
      periodicity: 'monthly',
      active: true,
      created_at: now,
      updated_at: now,
    },
  ]

  writeJSON(KEYS.payrollConfigs, seed)
}

function seedPayrollPaymentsIfNeeded() {
  const existing = readJSON<PayrollPaymentRecord[] | null>(KEYS.payrollPayments, null)
  if (existing && existing.length > 0) return

  const users = getUsers()
  const manager = users.find((item) => item.role === 'manager')
  const employee = users.find((item) => item.role === 'employee')

  const seed: PayrollPaymentRecord[] = []

  if (manager) {
    seed.push({
      id: 'payroll-001',
      user_id: manager.id,
      user_name: manager.full_name,
      role: manager.role,
      branch_id: manager.branch_id,
      amount: 4200,
      period_label: 'Marzo 2026',
      status: 'confirmed',
      created_at: '2026-03-25T09:00:00.000Z',
      confirmed_at: '2026-03-26T09:15:00.000Z',
      confirmed_by: 'Administrador Principal',
    })
  }

  if (employee) {
    seed.push({
      id: 'payroll-002',
      user_id: employee.id,
      user_name: employee.full_name,
      role: employee.role,
      branch_id: employee.branch_id,
      amount: 3200,
      period_label: 'Marzo 2026',
      status: 'pending',
      created_at: '2026-03-27T10:20:00.000Z',
    })
  }

  writeJSON(KEYS.payrollPayments, seed)
}

function toTransferRecord(input: NewTransferInput): ProductTransferRecord {
  return {
    id: `trf-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    part_id: input.part_id,
    part_name: input.part_name,
    category: input.category,
    from_branch_id: input.from_branch_id,
    to_branch_id: input.to_branch_id,
    quantity: input.quantity,
    status: 'completed',
    user_name: input.user_name,
    transfer_date: new Date().toISOString(),
    notes: input.notes,
  }
}

function addTransferHistoryEvent(transfer: ProductTransferRecord, eventType: TransferEventType, reason: string) {
  const current = getTransferHistory()
  const normalizedType = normalizeTransferEventType(eventType)
  const isReturn = normalizedType === 'devolucion'

  const event: TransferHistoryRecord = {
    id: `evt-${normalizedType}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    transfer_id: transfer.id,
    event_type: normalizedType,
    part_id: transfer.part_id,
    part_name: transfer.part_name,
    category: transfer.category,
    from_branch_id: isReturn ? transfer.to_branch_id : transfer.from_branch_id,
    to_branch_id: isReturn ? transfer.from_branch_id : transfer.to_branch_id,
    quantity: transfer.quantity,
    reason,
    user_name: transfer.user_name || getActiveUserContext().user_name,
    event_date: new Date().toISOString(),
  }

  writeJSON(KEYS.transferHistory, [event, ...current])
}

export function getProducts(): Part[] {
  const seeded = readJSON<Part[] | null>(KEYS.products, null)
  if (seeded && seeded.length > 0) return withDefaultPriceTiers(seeded)

  const initial = withDefaultPriceTiers(mockProducts as Part[])
  writeJSON(KEYS.products, initial)
  return initial
}

export function saveProducts(products: Part[]) {
  writeJSON(KEYS.products, withDefaultPriceTiers(products))
}

export function getKits(): ProductKit[] {
  seedKitsIfNeeded()
  return readJSON<ProductKit[]>(KEYS.kits, []).map((kit) => ({
    ...kit,
    category: kit.category || 'General',
  }))
}

export function saveKits(kits: ProductKit[]) {
  writeJSON(
    KEYS.kits,
    kits.map((kit) => ({
      ...kit,
      category: kit.category || 'General',
    })),
  )
}

export function createKit(input: NewKitInput) {
  const now = new Date().toISOString()
  const newKit: ProductKit = {
    id: `kit-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    code: input.code,
    name: input.name,
    description: input.description,
    category: input.category || 'General',
    branch_id: input.branch_id,
    items: input.items,
    created_at: now,
    updated_at: now,
  }

  const current = getKits()
  const next = [newKit, ...current]
  saveKits(next)
  addInventoryCrudLog({
    entity_type: 'kit',
    action: 'create',
    entity_id: newKit.id,
    entity_name: newKit.name,
    branch_id: newKit.branch_id,
    user_name: getActiveUserContext().user_name,
    details: `Categoría: ${newKit.category}`,
  })
  return newKit
}

export function getAdminMode() {
  return readJSON<boolean>(KEYS.adminMode, false)
}

export function setAdminMode(enabled: boolean) {
  writeJSON(KEYS.adminMode, enabled)

  if (hasWindow()) {
    window.dispatchEvent(new CustomEvent<boolean>(ADMIN_MODE_EVENT, { detail: enabled }))
  }
}

export function getReadOnlyMode() {
  return readJSON<boolean>(KEYS.readOnlyMode, false)
}

export function setReadOnlyMode(enabled: boolean) {
  writeJSON(KEYS.readOnlyMode, enabled)

  if (hasWindow()) {
    window.dispatchEvent(new CustomEvent<boolean>(READ_ONLY_MODE_EVENT, { detail: enabled }))
  }
}

function getDefaultRoleFromLegacyFlags(): AppUserRole {
  if (getReadOnlyMode()) return 'read_only'
  if (getAdminMode()) return 'admin'
  return 'employee'
}

export function getActiveUserRole(): AppUserRole {
  return readJSON<AppUserRole>(KEYS.activeRole, getDefaultRoleFromLegacyFlags())
}

export function getActiveUserContext(): ActiveUserContext {
  const role = getActiveUserRole()
  const fallbackName =
    role === 'admin'
      ? 'Administrador Principal'
      : role === 'manager'
      ? 'Encargado Demo'
      : role === 'read_only'
      ? 'Usuario Solo Lectura'
      : 'Empleado Demo'

  return {
    role,
    user_name: readJSON<string>(KEYS.activeUserName, fallbackName),
    branch_id: readJSON<string>(KEYS.activeBranchId, 'branch-1'),
  }
}

export function setActiveUserContext(context: Partial<ActiveUserContext>) {
  const current = getActiveUserContext()
  const next: ActiveUserContext = {
    role: context.role || current.role,
    user_name: context.user_name || current.user_name,
    branch_id: context.branch_id || current.branch_id,
  }

  writeJSON(KEYS.activeRole, next.role)
  writeJSON(KEYS.activeUserName, next.user_name)
  writeJSON(KEYS.activeBranchId, next.branch_id)

  // Compatibilidad temporal con switches legacy.
  writeJSON(KEYS.adminMode, next.role === 'admin')
  writeJSON(KEYS.readOnlyMode, next.role === 'read_only')

  if (hasWindow()) {
    window.dispatchEvent(new CustomEvent<ActiveUserContext>(ACTIVE_ROLE_EVENT, { detail: next }))
    window.dispatchEvent(new CustomEvent<boolean>(ADMIN_MODE_EVENT, { detail: next.role === 'admin' }))
    window.dispatchEvent(new CustomEvent<boolean>(READ_ONLY_MODE_EVENT, { detail: next.role === 'read_only' }))
  }

  return next
}

export function setActiveUserRole(role: AppUserRole) {
  return setActiveUserContext({ role })
}

export function canRoleCompleteSale(role: AppUserRole) {
  return role === 'admin' || role === 'manager'
}

export function canRoleApproveQueuedSale(role: AppUserRole) {
  return role === 'admin' || role === 'manager'
}

export function canRoleEditKitInPOS(role: AppUserRole) {
  return role === 'admin' || role === 'manager'
}

export function canRoleAdjustQuotationPrices(role: AppUserRole) {
  return role === 'admin' || role === 'manager' || role === 'employee'
}

function normalizeUserRecord(user: UserRecord): UserRecord {
  return {
    ...user,
    role: user.role || 'employee',
    shift_start: user.shift_start || '08:00',
    shift_end: user.shift_end || '18:00',
  }
}

function toMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number)
  const safeHours = Number.isFinite(hours) ? Math.max(0, Math.min(23, hours)) : 0
  const safeMinutes = Number.isFinite(minutes) ? Math.max(0, Math.min(59, minutes)) : 0
  return safeHours * 60 + safeMinutes
}

export function isUserWithinAssignedSchedule(user: Pick<UserRecord, 'role' | 'shift_start' | 'shift_end'>, at = new Date()) {
  if (user.role === 'admin' || user.role === 'manager') return true

  const currentMinutes = at.getHours() * 60 + at.getMinutes()
  const start = toMinutes(user.shift_start || '08:00')
  const end = toMinutes(user.shift_end || '18:00')

  if (start <= end) {
    return currentMinutes >= start && currentMinutes <= end
  }

  return currentMinutes >= start || currentMinutes <= end
}

export function canUserAccessNowByEmail(email: string, at = new Date()) {
  const users = getUsers()
  const user = users.find((item) => item.email.toLowerCase() === email.toLowerCase())

  if (!user) {
    return {
      allowed: true,
      reason: 'Usuario no registrado en mock local; validación final se hará en backend.',
      user: null,
    }
  }

  if (!user.is_active) {
    return {
      allowed: false,
      reason: 'El usuario está inactivo.',
      user,
    }
  }

  if (!isUserWithinAssignedSchedule(user, at)) {
    return {
      allowed: false,
      reason: `Acceso fuera de horario permitido (${user.shift_start} - ${user.shift_end}).`,
      user,
    }
  }

  return {
    allowed: true,
    reason: 'Acceso permitido por validación mock.',
    user,
  }
}

export function getEffectiveProductPrice(product: Part, quantity: number) {
  const tiers = [...(product.price_tiers || [])].sort((a, b) => a.min_quantity - b.min_quantity)
  if (tiers.length === 0) return product.price

  let effective = tiers[0].price
  for (const tier of tiers) {
    if (quantity >= tier.min_quantity) {
      effective = tier.price
    }
  }

  return effective
}

export function normalizePriceTiers(tiers: ProductPriceTier[]): ProductPriceTier[] {
  const normalized = tiers
    .filter((tier) => tier.min_quantity > 0 && tier.price > 0)
    .map((tier) => ({
      ...tier,
      min_quantity: Math.floor(tier.min_quantity),
      price: Number(tier.price.toFixed(2)),
    }))

  const byQty = new Map<number, ProductPriceTier>()
  for (const tier of normalized) {
    byQty.set(tier.min_quantity, tier)
  }

  return [...byQty.values()].sort((a, b) => a.min_quantity - b.min_quantity)
}

export function getTransfers(): ProductTransferRecord[] {
  seedTransfersIfNeeded()
  return readJSON<ProductTransferRecord[]>(KEYS.transfers, [])
}

export function getInventorySnapshots(): InventorySnapshotRecord[] {
  seedInventorySnapshotsIfNeeded()
  return readJSON<InventorySnapshotRecord[]>(KEYS.inventorySnapshots, [])
}

export function addInventorySnapshots(records: InventorySnapshotRecord[]) {
  const current = getInventorySnapshots()
  writeJSON(KEYS.inventorySnapshots, [...records, ...current])
}

export function getDeviceSessions(): DeviceSessionRecord[] {
  seedDeviceSessionsIfNeeded()
  return readJSON<DeviceSessionRecord[]>(KEYS.deviceSessions, [])
}

export function addDeviceSession(record: Omit<DeviceSessionRecord, 'id' | 'login_at'> & { login_at?: string }) {
  const now = record.login_at || new Date().toISOString()
  const created: DeviceSessionRecord = {
    ...record,
    id: `dev-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    login_at: now,
  }

  const current = getDeviceSessions()
  writeJSON(KEYS.deviceSessions, [created, ...current])
  return created
}

export function saveTransfers(transfers: ProductTransferRecord[]) {
  writeJSON(KEYS.transfers, transfers)
}

export function addTransfer(transfer: ProductTransferRecord) {
  const current = getTransfers()
  const next = [transfer, ...current]
  writeJSON(KEYS.transfers, next)
  addTransferHistoryEvent(transfer, 'traspaso', transfer.notes || 'Traspaso registrado')
  addInventoryCrudLog({
    entity_type: 'transfer',
    action: 'create',
    entity_id: transfer.id,
    entity_name: transfer.part_name,
    branch_id: transfer.from_branch_id,
    user_name: transfer.user_name,
    details: `${transfer.quantity} unidades hacia ${transfer.to_branch_id}`,
  })
}

export function addTransfersBulk(inputs: NewTransferInput[]) {
  const created: ProductTransferRecord[] = inputs.map(toTransferRecord)
  const current = getTransfers()
  writeJSON(KEYS.transfers, [...created, ...current])

  created.forEach((record) => {
    addTransferHistoryEvent(record, 'traspaso', record.notes || 'Traspaso masivo registrado')
    addInventoryCrudLog({
      entity_type: 'transfer',
      action: 'create',
      entity_id: record.id,
      entity_name: record.part_name,
      branch_id: record.from_branch_id,
      user_name: record.user_name,
      details: `${record.quantity} unidades hacia ${record.to_branch_id}`,
    })
  })

  return created
}

export function createTransfer(input: NewTransferInput) {
  const record = toTransferRecord(input)
  addTransfer(record)
  return record
}

export function getTransferHistory(): TransferHistoryRecord[] {
  seedTransfersIfNeeded()
  const history = readJSON<TransferHistoryRecord[]>(KEYS.transferHistory, [])
  const normalized = history.map((event) => ({
    ...event,
    event_type: normalizeTransferEventType(event.event_type),
  }))
  writeJSON(KEYS.transferHistory, normalized)
  return normalized
}

export function applyTransferAction(params: {
  transferId: string
  actionType: TransferActionType
  reason: string
  userName?: string
}) {
  const current = getTransfers()
  const index = current.findIndex((item) => item.id === params.transferId)
  if (index < 0) {
    return { ok: false as const, error: 'Transferencia no encontrada' }
  }

  const statusByAction: Record<TransferActionType, TransferStatus> = {
    anulacion: 'anulled',
    devolucion: 'returned',
    reposicion: 'replenished',
  }

  const updatedTransfer: ProductTransferRecord = {
    ...current[index],
    status: statusByAction[params.actionType],
    resolution_reason: params.reason,
    user_name: params.userName || current[index].user_name,
  }

  const next = [...current]
  next[index] = updatedTransfer
  writeJSON(KEYS.transfers, next)

  addTransferHistoryEvent(updatedTransfer, params.actionType, params.reason)
  addInventoryCrudLog({
    entity_type: 'transfer',
    action: 'update',
    entity_id: updatedTransfer.id,
    entity_name: updatedTransfer.part_name,
    branch_id: updatedTransfer.from_branch_id,
    user_name: params.userName || getActiveUserContext().user_name,
    details: `Acción ${params.actionType}: ${params.reason}`,
  })

  return { ok: true as const, transfer: updatedTransfer }
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
  addInventoryCrudLog({
    entity_type: 'sale',
    action: 'create',
    entity_id: sale.id,
    entity_name: `Venta ${sale.id}`,
    branch_id: sale.branch_id,
    user_name: sale.user_name,
    details: `Total Bs ${sale.total_amount.toFixed(2)} | Método ${sale.payment_method}`,
  })
}

export function getCredits(): CreditRecord[] {
  seedCreditsIfNeeded()
  return readJSON<CreditRecord[]>(KEYS.credits, [])
}

export function saveCredits(credits: CreditRecord[]) {
  writeJSON(KEYS.credits, credits)
}

export function getCustomerOpenCreditsCount(customerId: string) {
  return getCredits().filter(
    (credit) =>
      credit.customer_id === customerId &&
      (credit.status === 'registered' || credit.status === 'overdue')
  ).length
}

export function validateCustomerCreditLimit(customerId: string) {
  const settings = getAppSettings()
  const openCount = getCustomerOpenCreditsCount(customerId)
  const limit = settings.max_open_credits_per_customer

  return {
    limit,
    openCount,
    blocked: openCount >= limit,
  }
}

export function createCredit(input: {
  customer_id: string
  product_name: string
  branch_id: string
  seller_name: string
  total_amount: number
  paid_amount: number
  due_days: number
  reminder_date?: string
  notes?: string
}) {
  const customers = getCustomers()
  const branches = mockBranches
  const customer = customers.find((item) => item.id === input.customer_id)
  const branch = branches.find((item) => item.id === input.branch_id)

  if (!customer) {
    return { ok: false as const, error: 'Cliente no encontrado' }
  }

  if (!branch) {
    return { ok: false as const, error: 'Sucursal no encontrada' }
  }

  const limitCheck = validateCustomerCreditLimit(customer.id)
  if (limitCheck.blocked) {
    return {
      ok: false as const,
      error: `El cliente ya alcanzó el límite de ${limitCheck.limit} créditos abiertos/vencidos.`,
    }
  }

  const now = new Date()
  const dueDate = new Date(now)
  dueDate.setDate(dueDate.getDate() + Math.max(1, Math.floor(input.due_days || 1)))

  const total = Number(input.total_amount.toFixed(2))
  const paid = Number(Math.max(0, input.paid_amount).toFixed(2))
  const balance = Number(Math.max(total - paid, 0).toFixed(2))

  const created: CreditRecord = {
    id: `cr-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    customer_id: customer.id,
    customer_name: customer.full_name,
    branch_id: branch.id,
    branch_name: branch.name,
    seller_name: input.seller_name,
    product_name: input.product_name,
    total_amount: total,
    paid_amount: paid,
    balance,
    status: balance <= 0 ? 'paid' : 'registered',
    due_date: dueDate.toISOString(),
    reminder_date: input.reminder_date,
    notes: input.notes,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  }

  const current = getCredits()
  saveCredits([created, ...current])

  return { ok: true as const, credit: created }
}

export function getQuotations(): QuotationRecord[] {
  seedQuotationsIfNeeded()
  const quotations = readJSON<QuotationRecord[]>(KEYS.quotations, [])
  const normalized = quotations.map((quotation) => ({
    ...quotation,
    expires_at: quotation.expires_at || new Date(new Date(quotation.created_at).getTime() + 1000 * 60 * 60 * 24 * 7).toISOString(),
  }))

  writeJSON(KEYS.quotations, normalized)
  return normalized
}

export function saveQuotations(quotations: QuotationRecord[]) {
  writeJSON(KEYS.quotations, quotations)
}

const MAX_ACTIVE_QUOTATIONS_PER_USER = 3

export function getMaxActiveQuotationsPerUser() {
  return MAX_ACTIVE_QUOTATIONS_PER_USER
}

export function isQuotationActive(quotation: Pick<QuotationRecord, 'status' | 'expires_at'>, now = new Date()) {
  if (quotation.status !== 'active') return false
  return new Date(quotation.expires_at).getTime() >= now.getTime()
}

export function createQuotation(input: {
  customer_id: string
  branch_id: string
  quoted_by: string
  expires_at: string
  items: Array<{ part_id: string; quantity: number; unit_price: number }>
}) {
  const customers = getCustomers()
  const products = getProducts()
  const customer = customers.find((item) => item.id === input.customer_id)
  const branch = mockBranches.find((item) => item.id === input.branch_id)

  if (!customer) {
    return { ok: false as const, error: 'Cliente no encontrado' }
  }

  if (!branch) {
    return { ok: false as const, error: 'Sucursal no encontrada' }
  }

  if (!input.items.length) {
    return { ok: false as const, error: 'Debe agregar al menos un producto a la cotización' }
  }

  if (!input.expires_at) {
    return { ok: false as const, error: 'Debes definir una fecha límite para la cotización.' }
  }

  const expiration = new Date(input.expires_at)
  if (Number.isNaN(expiration.getTime())) {
    return { ok: false as const, error: 'La fecha límite de cotización no es válida.' }
  }

  const nowDate = new Date()
  const expirationEndOfDay = new Date(expiration)
  expirationEndOfDay.setHours(23, 59, 59, 999)

  if (expirationEndOfDay.getTime() < nowDate.getTime()) {
    return { ok: false as const, error: 'La fecha límite debe ser hoy o una fecha futura.' }
  }

  const current = getQuotations()
  const activeByUser = current.filter(
    (quotation) =>
      quotation.quoted_by.trim().toLowerCase() === input.quoted_by.trim().toLowerCase() &&
      isQuotationActive(quotation)
  ).length

  if (activeByUser >= MAX_ACTIVE_QUOTATIONS_PER_USER) {
    return {
      ok: false as const,
      error: `El usuario ${input.quoted_by} ya alcanzó el límite de ${MAX_ACTIVE_QUOTATIONS_PER_USER} cotizaciones activas.`,
    }
  }

  const quotationItems: QuotationItemRecord[] = []

  for (const item of input.items) {
    const part = products.find((p) => p.id === item.part_id)
    const qty = Math.max(1, Math.floor(item.quantity || 1))
    const price = Number(Math.max(0, item.unit_price).toFixed(2))

    if (part) {
      const minQuotationPrice = part.quotation_min_price ?? Number((part.price * 0.9).toFixed(2))
      const maxQuotationPrice = part.quotation_max_price ?? Number((part.price * 1.2).toFixed(2))

      if (price < minQuotationPrice || price > maxQuotationPrice) {
        return {
          ok: false as const,
          error: `El precio de ${part.name} debe estar entre Bs ${minQuotationPrice.toFixed(2)} y Bs ${maxQuotationPrice.toFixed(2)} para cotización.`,
        }
      }
    }

    const lineTotal = Number((qty * price).toFixed(2))
    quotationItems.push({
      id: `q-item-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      part_id: item.part_id,
      part_code: part?.code || 'N/A',
      part_name: part?.name || 'Producto',
      quantity: qty,
      unit_price: price,
      line_total: lineTotal,
    })
  }

  const total = Number(quotationItems.reduce((sum, item) => sum + item.line_total, 0).toFixed(2))
  const now = new Date().toISOString()

  const created: QuotationRecord = {
    id: `cot-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    customer_id: customer.id,
    customer_name: customer.full_name,
    branch_id: branch.id,
    branch_name: branch.name,
    quoted_by: input.quoted_by,
    expires_at: expirationEndOfDay.toISOString(),
    items: quotationItems,
    total_amount: total,
    status: 'active',
    created_at: now,
    updated_at: now,
  }

  saveQuotations([created, ...current])
  addInventoryCrudLog({
    entity_type: 'quotation',
    action: 'create',
    entity_id: created.id,
    entity_name: created.customer_name,
    branch_id: created.branch_id,
    user_name: created.quoted_by,
    details: `Total Bs ${created.total_amount.toFixed(2)}`,
  })

  return { ok: true as const, quotation: created }
}

export function cancelQuotation(quotationId: string) {
  const current = getQuotations()
  const index = current.findIndex((item) => item.id === quotationId)

  if (index < 0) {
    return { ok: false as const, error: 'Cotización no encontrada' }
  }

  if (current[index].status !== 'active') {
    return { ok: false as const, error: 'Solo se pueden anular cotizaciones activas' }
  }

  if (!isQuotationActive(current[index])) {
    return { ok: false as const, error: 'La cotización ya venció y no se puede anular como activa.' }
  }

  const next = [...current]
  next[index] = {
    ...next[index],
    status: 'cancelled',
    updated_at: new Date().toISOString(),
  }

  saveQuotations(next)
  addInventoryCrudLog({
    entity_type: 'quotation',
    action: 'update',
    entity_id: next[index].id,
    entity_name: next[index].customer_name,
    branch_id: next[index].branch_id,
    user_name: getActiveUserContext().user_name,
    details: 'Cotización anulada',
  })
  return { ok: true as const, quotation: next[index] }
}

export function convertQuotationToSale(input: {
  quotation_id: string
  payment_method: 'cash' | 'qr' | 'credit'
  sale_currency: 'BOB' | 'USD'
  exchange_rate: number
  paid_amount: number
  user_name: string
  user_role?: AppUserRole
}) {
  const role = input.user_role || getActiveUserRole()
  if (role !== 'admin') {
    return { ok: false as const, error: 'Solo administradores pueden convertir cotizaciones en venta.' }
  }

  const quotations = getQuotations()
  const index = quotations.findIndex((item) => item.id === input.quotation_id)

  if (index < 0) {
    return { ok: false as const, error: 'Cotización no encontrada' }
  }

  const quotation = quotations[index]
  if (quotation.status !== 'active') {
    return { ok: false as const, error: 'Solo cotizaciones activas se pueden convertir en venta' }
  }

  if (!isQuotationActive(quotation)) {
    return { ok: false as const, error: 'La cotización está vencida y no puede convertirse en venta.' }
  }

  const safeExchangeRate = input.exchange_rate > 0 ? input.exchange_rate : 1
  const totalBob = quotation.total_amount
  const totalUsd = Number((totalBob / safeExchangeRate).toFixed(2))

  const sale: SaleRecord = {
    id: `sale-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    branch_id: quotation.branch_id,
    user_name: input.user_name,
    user_role: role,
    total_amount: totalBob,
    payment_method: input.payment_method,
    sale_currency: input.sale_currency,
    exchange_rate: safeExchangeRate,
    total_amount_bob: totalBob,
    total_amount_usd: totalUsd,
    paid_amount: Number(Math.max(0, input.paid_amount).toFixed(2)),
    created_at: new Date().toISOString(),
  }

  addSale(sale)

  const next = [...quotations]
  next[index] = {
    ...quotation,
    status: 'converted',
    converted_sale_id: sale.id,
    updated_at: new Date().toISOString(),
  }

  saveQuotations(next)
  addInventoryCrudLog({
    entity_type: 'quotation',
    action: 'update',
    entity_id: next[index].id,
    entity_name: next[index].customer_name,
    branch_id: next[index].branch_id,
    user_name: input.user_name,
    details: `Convertida a venta ${sale.id}`,
  })

  return {
    ok: true as const,
    quotation: next[index],
    sale,
  }
}

export function getUsers(): UserRecord[] {
  const seeded = readJSON<UserRecord[] | null>(KEYS.users, null)
  if (seeded && seeded.length > 0) {
    const normalized = seeded.map((item) => normalizeUserRecord(item))
    writeJSON(KEYS.users, normalized)
    return normalized
  }

  const now = new Date().toISOString()
  const initial: UserRecord[] = [
    {
      id: 'usr-1',
      email: 'admin@picla.com',
      full_name: 'Administrador Principal',
      password_hash: '******',
      branch_id: 'branch-1',
      role: 'admin',
      shift_start: '00:00',
      shift_end: '23:59',
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'usr-2',
      email: 'encargado@picla.com',
      full_name: 'Encargado Centro',
      password_hash: '******',
      branch_id: 'branch-1',
      role: 'manager',
      shift_start: '07:30',
      shift_end: '20:00',
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'usr-3',
      email: 'empleado@picla.com',
      full_name: 'Operador Mostrador',
      password_hash: '******',
      branch_id: 'branch-1',
      role: 'employee',
      shift_start: '08:00',
      shift_end: '18:00',
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'usr-4',
      email: 'consulta@picla.com',
      full_name: 'Consulta Inventarios',
      password_hash: '******',
      branch_id: 'branch-2',
      role: 'read_only',
      shift_start: '07:00',
      shift_end: '17:00',
      is_active: true,
      created_at: now,
      updated_at: now,
    },
  ]

  writeJSON(KEYS.users, initial)
  return initial
}

export function saveUsers(users: UserRecord[]) {
  writeJSON(KEYS.users, users.map((item) => normalizeUserRecord(item)))
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
    max_open_credits_per_customer: 2,
  }

  writeJSON(KEYS.settings, initial)
  return initial
}

export function saveAppSettings(settings: AppSettingsRecord) {
  writeJSON(KEYS.settings, settings)
}

export function getInventoryCrudLogs() {
  seedInventoryCrudLogsIfNeeded()
  return readJSON<InventoryCrudLogRecord[]>(KEYS.inventoryCrudLogs, [])
}

export function addInventoryCrudLog(input: Omit<InventoryCrudLogRecord, 'id' | 'created_at'>) {
  const current = getInventoryCrudLogs()
  const created: InventoryCrudLogRecord = {
    ...input,
    id: `crud-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    created_at: new Date().toISOString(),
  }

  writeJSON(KEYS.inventoryCrudLogs, [created, ...current])
  return created
}

export function getInventoryExits() {
  seedInventoryExitsIfNeeded()
  return readJSON<InventoryExitRecord[]>(KEYS.inventoryExits, [])
}

export function addInventoryExit(input: Omit<InventoryExitRecord, 'id' | 'created_at' | 'branch_name'> & { created_at?: string }) {
  const branchName = mockBranches.find((branch) => branch.id === input.branch_id)?.name || input.branch_id
  const created: InventoryExitRecord = {
    ...input,
    id: `out-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    branch_name: branchName,
    created_at: input.created_at || new Date().toISOString(),
  }

  const current = getInventoryExits()
  writeJSON(KEYS.inventoryExits, [created, ...current])
  addInventoryCrudLog({
    entity_type: 'inventory_exit',
    action: 'create',
    entity_id: created.id,
    entity_name: created.product_name,
    branch_id: created.branch_id,
    user_name: created.user_name,
    details: `${created.quantity} uds | ${created.source_type} | Ref: ${created.source_reference || 'N/A'}`,
  })

  return created
}

export function getQueuedSales() {
  seedQueuedSalesIfNeeded()
  return readJSON<QueuedSaleRecord[]>(KEYS.queuedSales, [])
}

export function createQueuedSale(input: Omit<QueuedSaleRecord, 'id' | 'status' | 'created_at'>) {
  const current = getQueuedSales()
  const created: QueuedSaleRecord = {
    ...input,
    id: `qs-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    status: 'queued',
    created_at: new Date().toISOString(),
  }

  writeJSON(KEYS.queuedSales, [created, ...current])
  return created
}

export function approveQueuedSale(input: {
  queued_sale_id: string
  approved_by: string
  approved_by_role: AppUserRole
}) {
  if (!canRoleApproveQueuedSale(input.approved_by_role)) {
    return { ok: false as const, error: 'Solo encargado o admin pueden aprobar ventas en cola.' }
  }

  const queued = getQueuedSales()
  const index = queued.findIndex((item) => item.id === input.queued_sale_id)
  if (index < 0) {
    return { ok: false as const, error: 'Venta en cola no encontrada.' }
  }

  const current = queued[index]
  if (current.status !== 'queued') {
    return { ok: false as const, error: 'La venta ya fue procesada previamente.' }
  }

  const sale: SaleRecord = {
    id: `sale-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    branch_id: current.branch_id,
    user_name: input.approved_by,
    user_role: input.approved_by_role,
    total_amount: Number(current.total_amount_bob.toFixed(2)),
    payment_method: current.payment_method,
    sale_currency: current.sale_currency,
    exchange_rate: current.exchange_rate,
    total_amount_bob: Number(current.total_amount_bob.toFixed(2)),
    total_amount_usd: Number(current.total_amount_usd.toFixed(2)),
    paid_amount: current.sale_currency === 'USD'
      ? Number(current.total_amount_usd.toFixed(2))
      : Number(current.total_amount_bob.toFixed(2)),
    created_at: new Date().toISOString(),
  }

  addSale(sale)

  const next = [...queued]
  next[index] = {
    ...current,
    status: 'approved',
    approved_at: sale.created_at,
    approved_by: input.approved_by,
    approved_sale_id: sale.id,
  }
  writeJSON(KEYS.queuedSales, next)

  return { ok: true as const, queuedSale: next[index], sale }
}

export function rejectQueuedSale(input: {
  queued_sale_id: string
  rejected_by: string
  rejected_by_role: AppUserRole
}) {
  if (!canRoleApproveQueuedSale(input.rejected_by_role)) {
    return { ok: false as const, error: 'Solo encargado o admin pueden rechazar ventas en cola.' }
  }

  const queued = getQueuedSales()
  const index = queued.findIndex((item) => item.id === input.queued_sale_id)
  if (index < 0) {
    return { ok: false as const, error: 'Venta en cola no encontrada.' }
  }

  const next = [...queued]
  next[index] = {
    ...next[index],
    status: 'rejected',
    approved_at: new Date().toISOString(),
    approved_by: input.rejected_by,
  }

  writeJSON(KEYS.queuedSales, next)
  return { ok: true as const, queuedSale: next[index] }
}

export function getTemporaryKitsAudit() {
  seedTemporaryKitsAuditIfNeeded()
  return readJSON<TemporaryKitAuditRecord[]>(KEYS.temporaryKitsAudit, [])
}

export function addTemporaryKitAudit(input: Omit<TemporaryKitAuditRecord, 'id' | 'created_at'>) {
  const current = getTemporaryKitsAudit()
  const created: TemporaryKitAuditRecord = {
    ...input,
    id: `tk-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    created_at: new Date().toISOString(),
  }

  writeJSON(KEYS.temporaryKitsAudit, [created, ...current])
  return created
}

export function linkTemporaryKitToSale(params: { temp_kit_id: string; sale_id: string }) {
  const current = getTemporaryKitsAudit()
  const next = current.map((item) =>
    item.id === params.temp_kit_id ? { ...item, related_sale_id: params.sale_id } : item,
  )
  writeJSON(KEYS.temporaryKitsAudit, next)
}

export function getPayrollConfigs() {
  seedPayrollConfigsIfNeeded()
  return readJSON<PayrollConfigRecord[]>(KEYS.payrollConfigs, [])
}

export function savePayrollConfigs(configs: PayrollConfigRecord[]) {
  writeJSON(KEYS.payrollConfigs, configs)
}

export function upsertPayrollConfig(input: Omit<PayrollConfigRecord, 'id' | 'created_at' | 'updated_at'> & { id?: string }) {
  const now = new Date().toISOString()
  const current = getPayrollConfigs()

  if (input.id) {
    const next = current.map((item) =>
      item.id === input.id
        ? {
            ...item,
            role: input.role,
            branch_id: input.branch_id,
            amount: Number(input.amount.toFixed(2)),
            periodicity: input.periodicity,
            active: input.active,
            updated_at: now,
          }
        : item,
    )
    savePayrollConfigs(next)
    return next.find((item) => item.id === input.id) || null
  }

  const created: PayrollConfigRecord = {
    id: `paycfg-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    role: input.role,
    branch_id: input.branch_id,
    amount: Number(input.amount.toFixed(2)),
    periodicity: input.periodicity,
    active: input.active,
    created_at: now,
    updated_at: now,
  }

  savePayrollConfigs([created, ...current])
  return created
}

export function getPayrollPayments() {
  seedPayrollPaymentsIfNeeded()
  return readJSON<PayrollPaymentRecord[]>(KEYS.payrollPayments, [])
}

export function createPayrollPayment(input: Omit<PayrollPaymentRecord, 'id' | 'status' | 'created_at'>) {
  const current = getPayrollPayments()
  const created: PayrollPaymentRecord = {
    ...input,
    id: `payroll-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    status: 'pending',
    created_at: new Date().toISOString(),
  }

  writeJSON(KEYS.payrollPayments, [created, ...current])
  return created
}

export function confirmPayrollPayment(input: {
  payroll_payment_id: string
  confirmed_by: string
  confirmed_by_role: AppUserRole
}) {
  if (input.confirmed_by_role !== 'admin') {
    return { ok: false as const, error: 'Solo admin puede confirmar pagos de sueldos.' }
  }

  const current = getPayrollPayments()
  const index = current.findIndex((item) => item.id === input.payroll_payment_id)
  if (index < 0) {
    return { ok: false as const, error: 'Pago de sueldo no encontrado.' }
  }

  if (current[index].status === 'confirmed') {
    return { ok: false as const, error: 'Este pago ya fue confirmado.' }
  }

  const next = [...current]
  next[index] = {
    ...next[index],
    status: 'confirmed',
    confirmed_at: new Date().toISOString(),
    confirmed_by: input.confirmed_by,
  }

  writeJSON(KEYS.payrollPayments, next)
  return { ok: true as const, payment: next[index] }
}

export function getConfirmedPayrollTotal(params?: {
  startDate?: string
  endDate?: string
  branchId?: string
}) {
  const payments = getPayrollPayments().filter((item) => item.status === 'confirmed')
  const start = params?.startDate ? new Date(`${params.startDate}T00:00:00`) : null
  const end = params?.endDate ? new Date(`${params.endDate}T23:59:59.999`) : null

  return payments
    .filter((payment) => {
      const confirmedAt = payment.confirmed_at ? new Date(payment.confirmed_at) : null
      const byDate =
        (!start || (confirmedAt && confirmedAt.getTime() >= start.getTime())) &&
        (!end || (confirmedAt && confirmedAt.getTime() <= end.getTime()))
      const byBranch = !params?.branchId || payment.branch_id === params.branchId
      return byDate && byBranch
    })
    .reduce((sum, payment) => sum + payment.amount, 0)
}

export function getTransferFilterOptions() {
  const events = getTransferHistory()

  const categories = [...new Set(events.map((item) => item.category).filter(Boolean))] as string[]
  const productNames = [...new Set(events.map((item) => item.part_name).filter(Boolean))]

  return {
    categories,
    productNames,
    branches: mockBranches,
  }
}
