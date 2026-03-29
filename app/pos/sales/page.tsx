'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  CheckCircle2,
  Plus,
  Trash2,
  DollarSign,
  QrCode,
  CreditCard,
  ShoppingCart,
  Search,
  Boxes,
  PackageSearch,
  ShieldCheck,
} from 'lucide-react'
import {
  ACTIVE_ROLE_EVENT,
  addSale,
  addTemporaryKitAudit,
  approveQueuedSale,
  canRoleCompleteSale,
  canRoleEditKitInPOS,
  createQueuedSale,
  getActiveUserContext,
  getAppSettings,
  getCustomers,
  getKits,
  getProducts,
  getQueuedSales,
  linkTemporaryKitToSale,
  rejectQueuedSale,
  type AppUserRole,
  type QueuedSaleRecord,
} from '@/lib/mock/runtime-store'
import { printMockInvoice } from '@/lib/mock/invoice'
import { mockBranches } from '@/lib/mock/data'
import type { Part, ProductKit } from '@/types/database'

interface Customer {
  id: string
  full_name: string
  nit_ci: string
}

interface KitSaleItem {
  id: string
  partId: string
  name: string
  quantity: number
  baseKitPrice: number
  salePrice: number
}

interface ProductCartItem {
  id: string
  type: 'product'
  partId: string
  name: string
  code: string
  unitPrice: number
  quantity: number
}

interface KitCartItem {
  id: string
  type: 'kit'
  kitId: string
  temporaryKitAuditId?: string
  name: string
  code: string
  category?: string
  quantity: number
  items: KitSaleItem[]
}

type CartItem = ProductCartItem | KitCartItem

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Efectivo', icon: DollarSign },
  { id: 'qr', label: 'QR/Transferencia', icon: QrCode },
  { id: 'credit', label: 'Crédito', icon: CreditCard },
] as const

export default function POSSalesPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [parts, setParts] = useState<Part[]>([])
  const [kits, setKits] = useState<ProductKit[]>([])
  const [queuedSales, setQueuedSales] = useState<QueuedSaleRecord[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [catalogType, setCatalogType] = useState<'products' | 'kits'>('products')
  const [activeRole, setActiveRole] = useState<AppUserRole>('employee')
  const [activeUserName, setActiveUserName] = useState('Usuario Demo')
  const [activeBranchId, setActiveBranchId] = useState('branch-1')
  const [kitCategoryFilter, setKitCategoryFilter] = useState('all')
  const [feedback, setFeedback] = useState<string | null>(null)

  const [selectedPayment, setSelectedPayment] = useState<'cash' | 'qr' | 'credit'>('cash')
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)
  const [paymentCurrency, setPaymentCurrency] = useState<'BOB' | 'USD'>('BOB')
  const [exchangeRate, setExchangeRate] = useState(6.96)
  const [printInvoiceOnSale, setPrintInvoiceOnSale] = useState(true)

  const [activeKit, setActiveKit] = useState<ProductKit | null>(null)
  const [isKitDialogOpen, setIsKitDialogOpen] = useState(false)
  const [kitDraftItems, setKitDraftItems] = useState<KitSaleItem[]>([])
  const [kitDiscountMode, setKitDiscountMode] = useState<'manual' | 'automatic'>('manual')
  const [kitDiscountPercent, setKitDiscountPercent] = useState(0)
  const [isTemporaryKitOpen, setIsTemporaryKitOpen] = useState(false)
  const [temporaryKitName, setTemporaryKitName] = useState('')
  const [temporaryKitCategory, setTemporaryKitCategory] = useState('Temporal')
  const [temporaryKitItems, setTemporaryKitItems] = useState<KitSaleItem[]>([])

  useEffect(() => {
    setParts(getProducts())
    setKits(getKits())
    setQueuedSales(getQueuedSales())
    setCustomers(getCustomers())

    const settings = getAppSettings()
    setExchangeRate(settings.usd_to_bob_rate)
    setPaymentCurrency(settings.default_currency)

    const syncActiveContext = () => {
      const context = getActiveUserContext()
      setActiveRole(context.role)
      setActiveUserName(context.user_name)
      setActiveBranchId(context.branch_id)
      setQueuedSales(getQueuedSales())
    }

    syncActiveContext()
    window.addEventListener(ACTIVE_ROLE_EVENT, syncActiveContext)
    window.addEventListener('focus', syncActiveContext)

    if (parts.length > 0) {
      const part = parts[0]
      setTemporaryKitItems([
        {
          id: `tmp-kit-${Date.now()}`,
          partId: part.id,
          name: part.name,
          quantity: 1,
          baseKitPrice: part.kit_price || part.price,
          salePrice: part.kit_price || part.price,
        },
      ])
    }

    return () => {
      window.removeEventListener(ACTIVE_ROLE_EVENT, syncActiveContext)
      window.removeEventListener('focus', syncActiveContext)
    }
  }, [parts.length])

  const productsById = useMemo(() => new Map(parts.map((part) => [part.id, part])), [parts])

  const filteredParts = useMemo(() => {
    return parts.filter(
      (part) =>
        part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.code.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [parts, searchTerm])

  const filteredKits = useMemo(() => {
    return kits.filter(
      (kit) =>
        (kitCategoryFilter === 'all' || (kit.category || 'General') === kitCategoryFilter) &&
        (kit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          kit.code.toLowerCase().includes(searchTerm.toLowerCase())),
    )
  }, [kits, searchTerm, kitCategoryFilter])

  const kitCategories = useMemo(() => {
    return ['all', ...new Set(kits.map((kit) => kit.category || 'General'))]
  }, [kits])

  const canCompleteSale = canRoleCompleteSale(activeRole)
  const canConfigureKit = canRoleEditKitInPOS(activeRole)
  const canQueueSale = activeRole === 'read_only'
  const queuedPending = useMemo(
    () => queuedSales.filter((item) => item.status === 'queued'),
    [queuedSales],
  )

  const openKitConfigurator = (kit: ProductKit) => {
    const draft: KitSaleItem[] = kit.items.map((kitItem) => {
      const part = productsById.get(kitItem.part_id)
      const baseKitPrice = part?.kit_price || part?.price || kitItem.kit_price

      return {
        id: `draft-${kitItem.id}`,
        partId: kitItem.part_id,
        name: part?.name || kitItem.part_id,
        quantity: kitItem.quantity,
        baseKitPrice,
        salePrice: baseKitPrice,
      }
    })

    setActiveKit(kit)
    setKitDraftItems(draft)
    setKitDiscountPercent(0)
    setKitDiscountMode('manual')
    setIsKitDialogOpen(true)
  }

  const applyAutomaticDiscount = (percent: number) => {
    const bounded = Math.max(0, Math.min(100, percent))
    setKitDiscountPercent(bounded)

    setKitDraftItems((prev) => {
      const factor = 1 - bounded / 100
      return prev.map((item) => ({
        ...item,
        salePrice: Number((item.baseKitPrice * factor).toFixed(2)),
      }))
    })
  }

  const addProductToCart = (part: Part) => {
    const existing = cart.find((item) => item.type === 'product' && item.partId === part.id)
    if (existing && existing.type === 'product') {
      setCart((prev) =>
        prev.map((item) =>
          item.id === existing.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      )
      return
    }

    const newItem: ProductCartItem = {
      id: `cart-product-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      type: 'product',
      partId: part.id,
      name: part.name,
      code: part.code,
      unitPrice: part.price,
      quantity: 1,
    }

    setCart((prev) => [...prev, newItem])
  }

  const addKitToCart = () => {
    if (!activeKit || kitDraftItems.length === 0) return

    const newItem: KitCartItem = {
      id: `cart-kit-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      type: 'kit',
      kitId: activeKit.id,
      name: activeKit.name,
      code: activeKit.code,
      category: activeKit.category || 'General',
      quantity: 1,
      items: kitDraftItems,
    }

    setCart((prev) => [...prev, newItem])
    setIsKitDialogOpen(false)
  }

  const addKitDraftLine = () => {
    if (!canConfigureKit) return
    const fallback = parts[0]
    if (!fallback) return

    setKitDraftItems((prev) => [
      ...prev,
      {
        id: `draft-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
        partId: fallback.id,
        name: fallback.name,
        quantity: 1,
        baseKitPrice: fallback.kit_price || fallback.price,
        salePrice: fallback.kit_price || fallback.price,
      },
    ])
  }

  const removeKitDraftLine = (lineId: string) => {
    if (!canConfigureKit) return
    setKitDraftItems((prev) => (prev.length <= 1 ? prev : prev.filter((line) => line.id !== lineId)))
  }

  const addTemporaryKitItem = () => {
    if (!canConfigureKit) return
    const fallback = parts[0]
    if (!fallback) return

    setTemporaryKitItems((prev) => [
      ...prev,
      {
        id: `tmp-line-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
        partId: fallback.id,
        name: fallback.name,
        quantity: 1,
        baseKitPrice: fallback.kit_price || fallback.price,
        salePrice: fallback.kit_price || fallback.price,
      },
    ])
  }

  const removeTemporaryKitItem = (id: string) => {
    if (!canConfigureKit) return
    setTemporaryKitItems((prev) => prev.filter((item) => item.id !== id))
  }

  const updateTemporaryKitItem = (id: string, patch: Partial<KitSaleItem>) => {
    if (!canConfigureKit) return
    setTemporaryKitItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  const createTemporaryKitForCart = () => {
    if (!canConfigureKit) return
    if (!temporaryKitName.trim() || temporaryKitItems.length === 0) return

    const validItems = temporaryKitItems.filter((item) => item.quantity > 0 && item.salePrice > 0)
    if (validItems.length === 0) return

    const estimatedTotal = validItems.reduce((sum, item) => sum + item.salePrice * item.quantity, 0)
    const audit = addTemporaryKitAudit({
      name: temporaryKitName.trim(),
      category: temporaryKitCategory.trim() || 'Temporal',
      branch_id: activeBranchId,
      created_by_name: activeUserName,
      created_by_role: activeRole,
      items_count: validItems.length,
      estimated_total: Number(estimatedTotal.toFixed(2)),
    })

    const cartItem: KitCartItem = {
      id: `cart-temp-kit-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      type: 'kit',
      kitId: `temp-kit-${audit.id}`,
      temporaryKitAuditId: audit.id,
      name: temporaryKitName.trim(),
      code: `TEMP-${new Date().getTime()}`,
      category: temporaryKitCategory.trim() || 'Temporal',
      quantity: 1,
      items: validItems,
    }

    setCart((prev) => [...prev, cartItem])
    setIsTemporaryKitOpen(false)
    setTemporaryKitName('')
    setTemporaryKitCategory('Temporal')
  }

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id))
  }

  const updateProductPrice = (itemId: string, newPrice: string) => {
    if (!canCompleteSale) return
    const price = Number(newPrice)
    if (!price || price <= 0) return

    setCart((prev) =>
      prev.map((item) =>
        item.id === itemId && item.type === 'product'
          ? { ...item, unitPrice: Number(price.toFixed(2)) }
          : item
      )
    )
  }

  const updateCartQuantity = (itemId: string, quantity: string) => {
    const qty = Number(quantity)
    if (!qty || qty <= 0) return

    setCart((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity: qty } : item))
    )
  }

  const kitPreviewTotals = useMemo(() => {
    const base = kitDraftItems.reduce((sum, item) => sum + item.baseKitPrice * item.quantity, 0)
    const sale = kitDraftItems.reduce((sum, item) => sum + item.salePrice * item.quantity, 0)
    return { base, sale }
  }, [kitDraftItems])

  const total = cart.reduce((sum, item) => {
    if (item.type === 'product') {
      return sum + item.unitPrice * item.quantity
    }

    const kitLine = item.items.reduce((lineSum, lineItem) => lineSum + lineItem.salePrice * lineItem.quantity, 0)
    return sum + kitLine * item.quantity
  }, 0)

  const safeExchangeRate = exchangeRate > 0 ? exchangeRate : 1
  const totalInBob = total
  const totalInUsd = totalInBob / safeExchangeRate
  const amountToCharge = paymentCurrency === 'USD' ? totalInUsd : totalInBob

  const formatCurrency = (value: number, currency: 'BOB' | 'USD') => {
    return currency === 'USD'
      ? `$${value.toFixed(2)}`
      : `Bs ${value.toFixed(2)}`
  }

  const handleCompleteSale = () => {
    if (!cart.length) {
      setFeedback('Agrega productos o kits al carrito antes de continuar.')
      return
    }

    const lines = cart.flatMap((item) => {
      if (item.type === 'product') {
        return [
          {
            id: item.id,
            type: 'product' as const,
            name: item.name,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total_price: item.unitPrice * item.quantity,
          },
        ]
      }

      return item.items.map((line) => ({
        id: `${item.id}-${line.id}`,
        type: 'kit' as const,
        name: `${item.name} - ${line.name}`,
        quantity: line.quantity * item.quantity,
        unit_price: line.salePrice,
        total_price: line.salePrice * line.quantity * item.quantity,
      }))
    })

    const saleId = `sale-${Date.now()}`
    const customerName = selectedCustomer
      ? customers.find((customer) => customer.id === selectedCustomer)?.full_name || 'Cliente crédito'
      : 'Cliente contado'

    const paymentMethodLabel = PAYMENT_METHODS.find((method) => method.id === selectedPayment)?.label || selectedPayment

    if (canQueueSale) {
      createQueuedSale({
        branch_id: activeBranchId,
        created_by_name: activeUserName,
        created_by_role: activeRole,
        payment_method: selectedPayment,
        sale_currency: paymentCurrency,
        exchange_rate: safeExchangeRate,
        total_amount_bob: Number(totalInBob.toFixed(2)),
        total_amount_usd: Number(totalInUsd.toFixed(2)),
        customer_name: customerName,
        lines: lines.map((line) => ({
          ...line,
          total_price: Number(line.total_price.toFixed(2)),
          unit_price: Number(line.unit_price.toFixed(2)),
        })),
      })

      setQueuedSales(getQueuedSales())
      setCart([])
      setSelectedCustomer(null)
      setFeedback('Venta encolada correctamente. Queda pendiente de aprobación por encargado/admin.')
      return
    }

    if (!canCompleteSale) {
      setFeedback('Tu rol no puede confirmar ventas. Solo encargado y admin tienen este permiso.')
      return
    }

    addSale({
      id: saleId,
      branch_id: activeBranchId,
      user_name: activeUserName,
      user_role: activeRole,
      total_amount: totalInBob,
      payment_method: selectedPayment,
      sale_currency: paymentCurrency,
      exchange_rate: safeExchangeRate,
      total_amount_bob: totalInBob,
      total_amount_usd: totalInUsd,
      paid_amount: amountToCharge,
      created_at: new Date().toISOString(),
    })

    if (printInvoiceOnSale) {
      printMockInvoice({
        invoiceNumber: saleId,
        customerName,
        branchName: mockBranches.find((branch) => branch.id === activeBranchId)?.name || activeBranchId,
        cashierName: activeUserName,
        paymentMethod: paymentMethodLabel,
        currency: paymentCurrency,
        total: amountToCharge,
        lines: lines.map((line) => ({
          name: line.name,
          quantity: line.quantity,
          unitPrice: line.unit_price,
        })),
      })
    }

    cart
      .filter((item): item is KitCartItem => item.type === 'kit' && Boolean(item.temporaryKitAuditId))
      .forEach((item) => {
        if (item.temporaryKitAuditId) {
          linkTemporaryKitToSale({
            temp_kit_id: item.temporaryKitAuditId,
            sale_id: saleId,
          })
        }
      })

    setCart([])
    setSelectedCustomer(null)
    setFeedback(`Venta ${saleId} registrada correctamente.`)
  }

  const handleApproveQueuedSale = (queuedSaleId: string) => {
    const result = approveQueuedSale({
      queued_sale_id: queuedSaleId,
      approved_by: activeUserName,
      approved_by_role: activeRole,
    })

    if (!result.ok) {
      setFeedback(result.error)
      return
    }

    setQueuedSales(getQueuedSales())
    setFeedback(`Venta en cola ${queuedSaleId} aprobada como ${result.sale.id}.`)
  }

  const handleRejectQueuedSale = (queuedSaleId: string) => {
    const result = rejectQueuedSale({
      queued_sale_id: queuedSaleId,
      rejected_by: activeUserName,
      rejected_by_role: activeRole,
    })

    if (!result.ok) {
      setFeedback(result.error)
      return
    }

    setQueuedSales(getQueuedSales())
    setFeedback(`Venta en cola ${queuedSaleId} rechazada.`)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Punto de Venta" description="Ventas rápidas con registro mock persistente" />

        <Card>
          <CardContent className="pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className={`h-5 w-5 ${canCompleteSale ? 'text-emerald-500' : canQueueSale ? 'text-amber-500' : 'text-muted-foreground'}`} />
              <div>
                <p className="text-sm font-semibold">Rol activo: {activeRole}</p>
                <p className="text-xs text-muted-foreground">
                  {canCompleteSale
                    ? 'Puede confirmar ventas y aprobar cola.'
                    : canQueueSale
                    ? 'Puede encolar ventas para aprobación de encargado/admin.'
                    : 'Solo consulta operativa en POS; no puede confirmar ventas.'}
                </p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
              Usuario: {activeUserName}
            </div>
          </CardContent>
        </Card>

        {feedback ? (
          <div className="rounded-lg border border-primary/25 bg-primary/10 px-3 py-2 text-sm text-primary">
            {feedback}
          </div>
        ) : null}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <section className="xl:col-span-3 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle>Catálogo POS</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant={catalogType === 'products' ? 'default' : 'outline'} onClick={() => setCatalogType('products')}>
                      Productos
                    </Button>
                    <Button variant={catalogType === 'kits' ? 'default' : 'outline'} onClick={() => setCatalogType('kits')}>
                      Kits
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative max-w-xl">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input className="pl-9" placeholder={catalogType === 'products' ? 'Buscar producto por nombre o código' : 'Buscar kit por nombre o código'} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>

                {catalogType === 'kits' ? (
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="w-full md:max-w-xs">
                      <Select value={kitCategoryFilter} onValueChange={setKitCategoryFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {kitCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category === 'all' ? 'Todas las categorías' : category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={() => setIsTemporaryKitOpen(true)} disabled={!canConfigureKit}>
                      <Plus className="mr-2 h-4 w-4" /> Kit temporal
                    </Button>
                  </div>
                ) : null}

                {catalogType === 'products' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-5 gap-4">
                    {filteredParts.map((part) => (
                      <article key={part.id} className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/90 hover:border-primary/60 transition-all duration-300 hover:-translate-y-1">
                        <div className="relative aspect-[3/4] overflow-hidden">
                          <img src={part.image_url || '/placeholder.svg'} alt={part.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" onError={(e) => { e.currentTarget.src = '/placeholder.svg' }} />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                          <div className="absolute top-3 left-3">
                            <Badge className="bg-primary/90 text-primary-foreground">{part.code}</Badge>
                          </div>
                          <div className="absolute bottom-3 left-3 right-3">
                            <p className="text-white text-sm font-semibold line-clamp-2">{part.name}</p>
                            <p className="text-white/80 text-xs">{part.category}</p>
                          </div>
                        </div>
                        <div className="p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">Costo Bs {part.cost.toFixed(2)}</p>
                            <div className="text-right">
                              <p className="text-lg font-bold text-primary">Bs {part.price.toFixed(2)}</p>
                              <p className="text-[11px] text-muted-foreground">${(part.price / safeExchangeRate).toFixed(2)} USD</p>
                            </div>
                          </div>
                          <Button className="w-full" size="sm" onClick={() => addProductToCart(part)}>
                            <Plus className="w-4 h-4 mr-2" /> Agregar
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredKits.map((kit) => {
                      const kitTotal = kit.items.reduce((sum, item) => sum + item.kit_price * item.quantity, 0)
                      return (
                        <article key={kit.id} className="rounded-2xl border border-border/70 bg-card/90 p-4 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="font-semibold">{kit.name}</p>
                              <p className="text-xs text-muted-foreground">{kit.code}</p>
                            </div>
                            <Badge className="bg-primary/15 text-primary">Bs {kitTotal.toFixed(2)}</Badge>
                          </div>
                          <p className="text-xs text-emerald-500">Categoría: {kit.category || 'General'}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">{kit.description || 'Sin descripción'}</p>
                          <div className="text-xs text-muted-foreground">{kit.items.length} componentes</div>
                          <Button className="w-full" onClick={() => openKitConfigurator(kit)}>
                            <PackageSearch className="mr-2 h-4 w-4" /> Ver kit
                          </Button>
                        </article>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <aside className="xl:col-span-1">
            <Card className="xl:sticky xl:top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-primary" />Carrito</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Carrito vacío</p>
                ) : (
                  <>
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                      {cart.map((item) => (
                        <div key={item.id} className="rounded-xl border border-border/70 p-3 bg-muted/20">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <p className="text-sm font-semibold">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.code}</p>
                            </div>
                            <Button variant="ghost" size="icon-sm" onClick={() => removeFromCart(item.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="mt-2 space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <p className="text-[11px] text-muted-foreground">Cantidad</p>
                                <Input
                                  type="number"
                                  min={1}
                                  value={item.quantity}
                                  onChange={(event) => updateCartQuantity(item.id, event.target.value)}
                                />
                              </div>

                              {item.type === 'product' ? (
                                <div>
                                  <p className="text-[11px] text-muted-foreground">Precio unitario</p>
                                  {canCompleteSale ? (
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={item.unitPrice}
                                      onBlur={(event) => updateProductPrice(item.id, event.target.value)}
                                    />
                                  ) : (
                                    <div className="h-9 rounded-md border border-border/70 bg-muted/10 px-3 py-2 text-sm">
                                      Bs {item.unitPrice.toFixed(2)}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div>
                                  <p className="text-[11px] text-muted-foreground">Total kit</p>
                                  <div className="h-9 rounded-md border border-border/70 bg-muted/10 px-3 py-2 text-sm">
                                    Bs {(item.items.reduce((sum, line) => sum + line.salePrice * line.quantity, 0)).toFixed(2)}
                                  </div>
                                </div>
                              )}
                            </div>

                            {item.type === 'kit' ? (
                              <div className="rounded-md border border-border/70 bg-muted/10 p-2 space-y-1">
                                {item.items.map((line) => (
                                  <div key={line.id} className="flex justify-between text-xs">
                                    <span>{line.name} x {line.quantity}</span>
                                    <span>Bs {(line.salePrice * line.quantity).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>

                          <p className="text-sm font-bold text-primary mt-2">
                            Bs {(item.type === 'product' ? item.unitPrice * item.quantity : item.items.reduce((sum, line) => sum + line.salePrice * line.quantity, 0) * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {!canCompleteSale ? (
                      <p className="text-xs text-muted-foreground">Solo encargado o admin pueden editar precios y confirmar venta.</p>
                    ) : null}

                    <div className="border-t border-border pt-3">
                      <p className="text-sm text-muted-foreground">Total base (BOB)</p>
                      <p className="text-2xl font-bold text-primary">Bs {totalInBob.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground mt-1">Equivalente USD: ${totalInUsd.toFixed(2)} (TC: {safeExchangeRate.toFixed(2)})</p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Moneda de pago</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={paymentCurrency === 'BOB' ? 'default' : 'outline'}
                          onClick={() => setPaymentCurrency('BOB')}
                        >
                          Bolivianos
                        </Button>
                        <Button
                          variant={paymentCurrency === 'USD' ? 'default' : 'outline'}
                          onClick={() => setPaymentCurrency('USD')}
                        >
                          Dólares
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Monto a cobrar: <span className="font-semibold text-foreground">{formatCurrency(amountToCharge, paymentCurrency)}</span>
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Método de pago</p>
                      {PAYMENT_METHODS.map((method) => (
                        <Button key={method.id} variant={selectedPayment === method.id ? 'default' : 'outline'} className="w-full justify-start" onClick={() => setSelectedPayment(method.id)}>
                          <method.icon className="w-4 h-4 mr-2" /> {method.label}
                        </Button>
                      ))}
                    </div>

                    {selectedPayment === 'credit' && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full">{selectedCustomer ? 'Cambiar cliente' : 'Seleccionar cliente'}</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Clientes para crédito</DialogTitle></DialogHeader>
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {customers.map((customer) => (
                              <Button key={customer.id} variant="outline" className="w-full justify-start text-left" onClick={() => setSelectedCustomer(customer.id)}>
                                <div>
                                  <p className="font-semibold">{customer.full_name}</p>
                                  <p className="text-xs text-muted-foreground">{customer.nit_ci}</p>
                                </div>
                              </Button>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}

                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={printInvoiceOnSale}
                        onChange={(event) => setPrintInvoiceOnSale(event.target.checked)}
                      />
                      Imprimir factura al completar venta
                    </label>

                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleCompleteSale}
                      disabled={(selectedPayment === 'credit' && !selectedCustomer) || (!canCompleteSale && !canQueueSale)}
                    >
                      {canCompleteSale ? 'Completar venta' : canQueueSale ? 'Enviar venta a cola' : 'Sin permiso para vender'}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>

        {canCompleteSale ? (
          <Card>
            <CardHeader>
              <CardTitle>Ventas en cola (solo lectura)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {queuedPending.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay ventas pendientes de aprobación.</p>
              ) : (
                queuedPending.map((queuedSale) => (
                  <div key={queuedSale.id} className="rounded-lg border border-border/70 bg-muted/20 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{queuedSale.id}</p>
                        <p className="text-xs text-muted-foreground">Creada por {queuedSale.created_by_name} ({queuedSale.created_by_role})</p>
                        <p className="text-xs text-muted-foreground">Cliente: {queuedSale.customer_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-primary">Bs {queuedSale.total_amount_bob.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{queuedSale.lines.length} líneas</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => handleApproveQueuedSale(queuedSale.id)}>
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Aprobar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleRejectQueuedSale(queuedSale.id)}>
                        Rechazar
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Dialog open={isKitDialogOpen} onOpenChange={setIsKitDialogOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{activeKit?.name || 'Configurar kit'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant={kitDiscountMode === 'manual' ? 'default' : 'outline'} onClick={() => setKitDiscountMode('manual')}>
                Modo manual
              </Button>
              <Button variant={kitDiscountMode === 'automatic' ? 'default' : 'outline'} onClick={() => setKitDiscountMode('automatic')}>
                Modo automático
              </Button>
              <Button variant="outline" onClick={addKitDraftLine} disabled={!canConfigureKit}>
                <Plus className="mr-2 h-4 w-4" /> Agregar línea
              </Button>
            </div>

            {kitDiscountMode === 'automatic' ? (
              <Card>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Descuento global (%)</p>
                    <p className="text-sm font-semibold">{kitDiscountPercent}%</p>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={kitDiscountPercent}
                    onChange={(event) => {
                      if (!canConfigureKit) return
                      applyAutomaticDiscount(Number(event.target.value || 0))
                    }}
                    disabled={!canConfigureKit}
                  />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={kitDiscountPercent}
                    onChange={(event) => {
                      if (!canConfigureKit) return
                      applyAutomaticDiscount(Number(event.target.value))
                    }}
                    className="w-full"
                    disabled={!canConfigureKit}
                  />
                </CardContent>
              </Card>
            ) : null}

            {!canConfigureKit ? (
              <p className="text-xs text-foreground/80">Solo encargado o admin pueden aumentar/quitar productos del kit en POS.</p>
            ) : null}

            <div className="space-y-2">
              {kitDraftItems.map((item) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 rounded-lg border border-border/70 p-2">
                  <div className="md:col-span-5">
                    <Select
                      value={item.partId}
                      onValueChange={(value) => {
                        if (!canConfigureKit) return
                        const part = productsById.get(value)
                        if (!part) return
                        setKitDraftItems((prev) =>
                          prev.map((line) =>
                            line.id === item.id
                              ? {
                                  ...line,
                                  partId: value,
                                  name: part.name,
                                  baseKitPrice: part.kit_price || part.price,
                                  salePrice: kitDiscountMode === 'automatic'
                                    ? Number(((part.kit_price || part.price) * (1 - kitDiscountPercent / 100)).toFixed(2))
                                    : part.kit_price || part.price,
                                }
                              : line
                          )
                        )
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {parts.map((part) => (
                          <SelectItem key={part.id} value={part.id}>{part.name} ({part.code})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      disabled={!canConfigureKit}
                      onChange={(event) => {
                        if (!canConfigureKit) return
                        const qty = Number(event.target.value || 1)
                        setKitDraftItems((prev) =>
                          prev.map((line) => (line.id === item.id ? { ...line, quantity: qty } : line))
                        )
                      }}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <div className="h-9 rounded-md border border-border/70 bg-muted/10 px-3 py-2 text-sm text-foreground">
                      Bs {item.baseKitPrice.toFixed(2)}
                    </div>
                  </div>
                  <div className="md:col-span-3">
                    {canConfigureKit ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={item.salePrice}
                        disabled={kitDiscountMode === 'automatic'}
                        onChange={(event) => {
                          const price = Number(event.target.value || 0)
                          setKitDraftItems((prev) =>
                            prev.map((line) =>
                              line.id === item.id
                                ? { ...line, salePrice: Number(price.toFixed(2)) }
                                : line
                            )
                          )
                        }}
                      />
                    ) : (
                      <div className="h-9 rounded-md border border-border/70 bg-muted/10 px-3 py-2 text-sm text-foreground">
                        Bs {item.salePrice.toFixed(2)}
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-12 flex justify-end">
                    <Button size="sm" variant="destructive" onClick={() => removeKitDraftLine(item.id)} disabled={!canConfigureKit || kitDraftItems.length <= 1}>
                      <Trash2 className="mr-2 h-4 w-4" /> Quitar línea
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-border/70 p-3 text-sm space-y-1">
              <p>Total base del kit: <span className="font-semibold">Bs {kitPreviewTotals.base.toFixed(2)}</span></p>
              <p>Total aplicado: <span className="font-semibold text-primary">Bs {kitPreviewTotals.sale.toFixed(2)}</span></p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="destructive" onClick={() => setIsKitDialogOpen(false)}>Cancelar</Button>
              <Button onClick={addKitToCart}><Boxes className="mr-2 h-4 w-4" /> Agregar kit al carrito</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isTemporaryKitOpen} onOpenChange={setIsTemporaryKitOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Crear kit temporal (solo para esta venta)</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <p className="text-sm font-medium">Nombre del kit temporal</p>
                <Input value={temporaryKitName} onChange={(event) => setTemporaryKitName(event.target.value)} placeholder="Ej. Combo express de frenos" disabled={!canConfigureKit} />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Categoría</p>
                <Input value={temporaryKitCategory} onChange={(event) => setTemporaryKitCategory(event.target.value)} placeholder="Temporal" disabled={!canConfigureKit} />
              </div>
            </div>

            <div className="space-y-2 rounded-lg border border-border/70 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Productos del kit temporal</p>
                <Button variant="outline" size="sm" onClick={addTemporaryKitItem} disabled={!canConfigureKit}>
                  <Plus className="mr-2 h-4 w-4" /> Agregar
                </Button>
              </div>

              {temporaryKitItems.map((item) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 rounded-lg border border-border/60 p-2">
                  <div className="md:col-span-5">
                    <Select
                      value={item.partId}
                      onValueChange={(value) => {
                        const part = productsById.get(value)
                        if (!part) return
                        updateTemporaryKitItem(item.id, {
                          partId: part.id,
                          name: part.name,
                          baseKitPrice: part.kit_price || part.price,
                          salePrice: part.kit_price || part.price,
                        })
                      }}
                      disabled={!canConfigureKit}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {parts.map((part) => (
                          <SelectItem key={part.id} value={part.id}>{part.name} ({part.code})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      disabled={!canConfigureKit}
                      onChange={(event) => updateTemporaryKitItem(item.id, { quantity: Number(event.target.value || 1) })}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <Input
                      type="number"
                      min={0.01}
                      step="0.01"
                      value={item.salePrice}
                      disabled={!canConfigureKit}
                      onChange={(event) => updateTemporaryKitItem(item.id, { salePrice: Number(event.target.value || 0) })}
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center justify-end">
                    <Button size="sm" variant="destructive" onClick={() => removeTemporaryKitItem(item.id)} disabled={!canConfigureKit || temporaryKitItems.length <= 1}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {!canConfigureKit ? (
              <p className="text-xs text-muted-foreground">Solo encargado o admin pueden crear kits temporales.</p>
            ) : null}

            <div className="flex justify-end gap-2">
              <Button variant="destructive" onClick={() => setIsTemporaryKitOpen(false)}>Cancelar</Button>
              <Button onClick={createTemporaryKitForCart} disabled={!canConfigureKit || !temporaryKitName.trim() || temporaryKitItems.length === 0}>
                Crear y agregar al carrito
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
