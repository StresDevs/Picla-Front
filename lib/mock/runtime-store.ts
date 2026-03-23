import { mockBranches, mockCustomers, mockProducts } from '@/lib/mock/data'
import type { Part, ProductKit, ProductKitItem, ProductPriceTier } from '@/types/database'

export type TransferActionType = 'anulacion' | 'devolucion' | 'reposicion'
export type TransferEventType = 'envio' | TransferActionType
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
}

export const ADMIN_MODE_EVENT = 'mock-admin-mode-changed'

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

    if (tiers.length > 0) {
      return {
        ...product,
        kit_price: kitPrice,
      }
    }

    return {
      ...product,
      kit_price: kitPrice,
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
      id: `evt-envio-${transfer.id}`,
      transfer_id: transfer.id,
      event_type: 'envio',
      part_id: transfer.part_id,
      part_name: transfer.part_name,
      category: transfer.category,
      from_branch_id: transfer.from_branch_id,
      to_branch_id: transfer.to_branch_id,
      quantity: transfer.quantity,
      reason: transfer.notes || 'Envio registrado',
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
  const isReturn = eventType === 'devolucion'

  const event: TransferHistoryRecord = {
    id: `evt-${eventType}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    transfer_id: transfer.id,
    event_type: eventType,
    part_id: transfer.part_id,
    part_name: transfer.part_name,
    category: transfer.category,
    from_branch_id: isReturn ? transfer.to_branch_id : transfer.from_branch_id,
    to_branch_id: isReturn ? transfer.from_branch_id : transfer.to_branch_id,
    quantity: transfer.quantity,
    reason,
    user_name: 'Usuario Demo',
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
  return readJSON<ProductKit[]>(KEYS.kits, [])
}

export function saveKits(kits: ProductKit[]) {
  writeJSON(KEYS.kits, kits)
}

export function createKit(input: NewKitInput) {
  const now = new Date().toISOString()
  const newKit: ProductKit = {
    id: `kit-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    code: input.code,
    name: input.name,
    description: input.description,
    branch_id: input.branch_id,
    items: input.items,
    created_at: now,
    updated_at: now,
  }

  const current = getKits()
  const next = [newKit, ...current]
  saveKits(next)
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

export function saveTransfers(transfers: ProductTransferRecord[]) {
  writeJSON(KEYS.transfers, transfers)
}

export function addTransfer(transfer: ProductTransferRecord) {
  const current = getTransfers()
  const next = [transfer, ...current]
  writeJSON(KEYS.transfers, next)
  addTransferHistoryEvent(transfer, 'envio', transfer.notes || 'Envio registrado')
}

export function addTransfersBulk(inputs: NewTransferInput[]) {
  const created: ProductTransferRecord[] = inputs.map(toTransferRecord)
  const current = getTransfers()
  writeJSON(KEYS.transfers, [...created, ...current])

  created.forEach((record) => {
    addTransferHistoryEvent(record, 'envio', record.notes || 'Envio masivo registrado')
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
  return readJSON<TransferHistoryRecord[]>(KEYS.transferHistory, [])
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
  return readJSON<QuotationRecord[]>(KEYS.quotations, [])
}

export function saveQuotations(quotations: QuotationRecord[]) {
  writeJSON(KEYS.quotations, quotations)
}

export function createQuotation(input: {
  customer_id: string
  branch_id: string
  quoted_by: string
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

  const quotationItems: QuotationItemRecord[] = input.items.map((item) => {
    const part = products.find((p) => p.id === item.part_id)
    const qty = Math.max(1, Math.floor(item.quantity || 1))
    const price = Number(Math.max(0, item.unit_price).toFixed(2))
    const lineTotal = Number((qty * price).toFixed(2))

    return {
      id: `q-item-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      part_id: item.part_id,
      part_code: part?.code || 'N/A',
      part_name: part?.name || 'Producto',
      quantity: qty,
      unit_price: price,
      line_total: lineTotal,
    }
  })

  const total = Number(quotationItems.reduce((sum, item) => sum + item.line_total, 0).toFixed(2))
  const now = new Date().toISOString()

  const created: QuotationRecord = {
    id: `cot-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    customer_id: customer.id,
    customer_name: customer.full_name,
    branch_id: branch.id,
    branch_name: branch.name,
    quoted_by: input.quoted_by,
    items: quotationItems,
    total_amount: total,
    status: 'active',
    created_at: now,
    updated_at: now,
  }

  const current = getQuotations()
  saveQuotations([created, ...current])

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

  const next = [...current]
  next[index] = {
    ...next[index],
    status: 'cancelled',
    updated_at: new Date().toISOString(),
  }

  saveQuotations(next)
  return { ok: true as const, quotation: next[index] }
}

export function convertQuotationToSale(input: {
  quotation_id: string
  payment_method: 'cash' | 'qr' | 'credit'
  sale_currency: 'BOB' | 'USD'
  exchange_rate: number
  paid_amount: number
  user_name: string
}) {
  const quotations = getQuotations()
  const index = quotations.findIndex((item) => item.id === input.quotation_id)

  if (index < 0) {
    return { ok: false as const, error: 'Cotización no encontrada' }
  }

  const quotation = quotations[index]
  if (quotation.status !== 'active') {
    return { ok: false as const, error: 'Solo cotizaciones activas se pueden convertir en venta' }
  }

  const safeExchangeRate = input.exchange_rate > 0 ? input.exchange_rate : 1
  const totalBob = quotation.total_amount
  const totalUsd = Number((totalBob / safeExchangeRate).toFixed(2))

  const sale: SaleRecord = {
    id: `sale-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    branch_id: quotation.branch_id,
    user_name: input.user_name,
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

  return {
    ok: true as const,
    quotation: next[index],
    sale,
  }
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
    max_open_credits_per_customer: 2,
  }

  writeJSON(KEYS.settings, initial)
  return initial
}

export function saveAppSettings(settings: AppSettingsRecord) {
  writeJSON(KEYS.settings, settings)
}

export function getTransferFilterOptions() {
  const transfers = getTransfers()
  const products = getProducts()

  const productMap = new Map(products.map((product) => [product.id, product]))

  const categories = [...new Set(transfers.map((item) => item.category || productMap.get(item.part_id)?.category).filter(Boolean))] as string[]
  const productNames = [...new Set(transfers.map((item) => item.part_name).filter(Boolean))]

  return {
    categories,
    productNames,
    branches: mockBranches,
  }
}
