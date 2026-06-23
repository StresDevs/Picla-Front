'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { POSSubnav } from '@/components/modules/pos/pos-subnav'
import { EmptyState } from '@/components/common/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ACTIVE_ROLE_EVENT, getActiveUserContext } from '@/lib/mock/runtime-store'
import { getSupabaseClient } from '@/lib/supabase/client'
import { posService, type POSQueuedSale, type POSSaleRecord, type POSSaleItem } from '@/lib/supabase/pos'
import { ShoppingCart, ChevronDown, FileSearch, Download, FileSpreadsheet, Truck, Pencil, AlertTriangle, HandCoins, CheckCircle2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface SaleCreditInfo {
  credit_id: string
  total_amount: number
  paid_amount: number
  balance: number
  status: 'active' | 'overdue' | 'paid'
  due_date: string
  seller_name: string
  notes: string | null
}
import { generateSaleInvoicePdf, generateCashSessionPdf } from '@/lib/pdf/generators'
import { exportToExcel } from '@/lib/excel/export'
import { getAppSettings } from '@/lib/mock/runtime-store'
import { SearchableStringPick } from '@/components/modules/inventory/part-combobox'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'

const paymentLabels: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  qr: 'QR/Transferencia',
  credit: 'Crédito',
}

const deliveryLabels: Record<string, string> = {
  pending: 'Pendiente',
  partial: 'Parcial',
  delivered: 'Entregado',
}

const statusConfig: Record<string, { label: string; className: string }> = {
  completed: { label: 'Completada', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  voided: { label: 'Anulada', className: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  cancelled: { label: 'Cancelada', className: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30' },
}

const queueStatusConfig: Record<string, { label: string; className: string }> = {
  queued: { label: 'En cola', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  approved: { label: 'Aprobada', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  rejected: { label: 'Rechazada', className: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  cancelled: { label: 'Cancelada', className: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30' },
}

function toLocalDateKey(value: string) {
  const dt = new Date(value)
  const year = dt.getFullYear()
  const month = String(dt.getMonth() + 1).padStart(2, '0')
  const day = String(dt.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

interface BranchOption { id: string; name: string }

export default function POSSalesHistoryPage() {
  const [sales, setSales] = useState<POSSaleRecord[]>([])
  const [queuedSales, setQueuedSales] = useState<POSQueuedSale[]>([])
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [activeBranchId, setActiveBranchId] = useState(() => getActiveUserContext().branch_id)
  const [activeRole, setActiveRole] = useState(() => getActiveUserContext().role)
  const [branchFilter, setBranchFilter] = useState(() => getActiveUserContext().branch_id)
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null)
  const [salesPage, setSalesPage] = useState(1)
  const [deliveryDialogSale, setDeliveryDialogSale] = useState<POSSaleRecord | null>(null)
  const [deliveryQtys, setDeliveryQtys] = useState<Record<string, string>>({})
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [isSubmittingDelivery, setIsSubmittingDelivery] = useState(false)
  const [deliveryFeedback, setDeliveryFeedback] = useState<string | null>(null)

  const [creditMap, setCreditMap] = useState<Map<string, SaleCreditInfo>>(new Map())

  const [editDialogSale, setEditDialogSale] = useState<POSSaleRecord | null>(null)
  const [editSection, setEditSection] = useState<'return' | 'void'>('return')
  const [editReturnChecked, setEditReturnChecked] = useState<Set<string>>(new Set())
  const [editReturnQtys, setEditReturnQtys] = useState<Record<string, string>>({})
  const [editReturnReason, setEditReturnReason] = useState('')
  const [editVoidReason, setEditVoidReason] = useState('')
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)
  const [editFeedback, setEditFeedback] = useState<string | null>(null)

  const [isProcessingQueue, setIsProcessingQueue] = useState(false)

  const canApproveQueue = activeRole === 'admin' || activeRole === 'manager' || activeRole === 'employee'

  const loadData = async (branchId?: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const target = branchId ?? activeBranchId
      const [salesData, queueData] = await Promise.all([
        posService.getSales(target, true),
        posService.getQueuedSales({ branch_id: target }),
      ])
      setSales(salesData)
      setQueuedSales(queueData)

      // Load credit info for sales that have a credit record
      if (salesData.length > 0) {
        const supabase = getSupabaseClient()
        const saleIds = salesData.map((s) => s.sale_id)
        const { data: creditsData } = await supabase
          .from('credits')
          .select('id, sale_id, total_amount, paid_amount, balance, status, due_date, seller_name, notes')
          .in('sale_id', saleIds)
        if (creditsData && creditsData.length > 0) {
          const map = new Map<string, SaleCreditInfo>()
          for (const c of creditsData) {
            map.set(c.sale_id as string, {
              credit_id: c.id as string,
              total_amount: Number(c.total_amount),
              paid_amount: Number(c.paid_amount),
              balance: Number(c.balance),
              status: c.status as SaleCreditInfo['status'],
              due_date: c.due_date as string,
              seller_name: c.seller_name as string,
              notes: c.notes as string | null,
            })
          }
          setCreditMap(map)
        } else {
          setCreditMap(new Map())
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el historial')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const supabase = getSupabaseClient()

    const syncContext = () => {
      const ctx = getActiveUserContext()
      setActiveBranchId(ctx.branch_id)
      setActiveRole(ctx.role)
      setBranchFilter(ctx.branch_id)
      void loadData(ctx.branch_id)
    }

    const loadBranches = async () => {
      const { data } = await supabase.from('branches').select('id, name').order('name')
      if (data) setBranches(data as BranchOption[])
    }

    syncContext()
    void loadBranches()
    window.addEventListener(ACTIVE_ROLE_EVENT, syncContext)
    window.addEventListener('focus', syncContext)
    return () => {
      window.removeEventListener(ACTIVE_ROLE_EVENT, syncContext)
      window.removeEventListener('focus', syncContext)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void loadData(branchFilter !== 'all' ? branchFilter : activeBranchId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchFilter])

  const saleNumberMap = useMemo(() => {
    const map = new Map<string, string>()
    const grouped = new Map<string, POSSaleRecord[]>()

    sales.forEach((sale) => {
      const key = toLocalDateKey(sale.created_at)
      const list = grouped.get(key) ?? []
      list.push(sale)
      grouped.set(key, list)
    })

    grouped.forEach((list) => {
      list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      list.forEach((sale, index) => {
        map.set(sale.sale_id, `N${index + 1}`)
      })
    })

    return map
  }, [sales])

  const queueNumberMap = useMemo(() => {
    const map = new Map<string, string>()
    const grouped = new Map<string, POSQueuedSale[]>()

    queuedSales.forEach((queue) => {
      const key = toLocalDateKey(queue.created_at)
      const list = grouped.get(key) ?? []
      list.push(queue)
      grouped.set(key, list)
    })

    grouped.forEach((list) => {
      list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      list.forEach((queue, index) => {
        map.set(queue.queue_id, `Cola ${index + 1}`)
      })
    })

    return map
  }, [queuedSales])

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      if (paymentFilter !== 'all' && sale.payment_method !== paymentFilter) return false
      if (statusFilter !== 'all' && sale.status !== statusFilter) return false
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const saleNumber = (saleNumberMap.get(sale.sale_id) ?? '').toLowerCase()
        const matchId = saleNumber.includes(term)
        const matchCustomer = (sale.customer_name ?? '').toLowerCase().includes(term)
        if (!matchId && !matchCustomer) return false
      }
      if (dateFrom) {
        const from = new Date(`${dateFrom}T00:00:00`)
        if (new Date(sale.created_at) < from) return false
      }
      if (dateTo) {
        const to = new Date(`${dateTo}T23:59:59.999`)
        if (new Date(sale.created_at) > to) return false
      }
      return true
    })
  }, [sales, paymentFilter, statusFilter, searchTerm, dateFrom, dateTo, saleNumberMap])

  const filteredQueue = useMemo(() => {
    return queuedSales.filter((q) => {
      if (paymentFilter !== 'all' && q.payment_method !== paymentFilter) return false
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const queueNumber = (queueNumberMap.get(q.queue_id) ?? '').toLowerCase()
        const matchId = queueNumber.includes(term)
        const matchCustomer = (q.customer_name ?? '').toLowerCase().includes(term)
        if (!matchId && !matchCustomer) return false
      }
      return true
    })
  }, [queuedSales, paymentFilter, searchTerm, queueNumberMap])

  const totalSales = filteredSales.reduce((acc, s) => acc + Number(s.total_amount || 0), 0)
  const activeBranchName = branches.find((b) => b.id === activeBranchId)?.name ?? activeBranchId

  const SALES_PER_PAGE = 15
  const totalSalesPages = Math.max(1, Math.ceil(filteredSales.length / SALES_PER_PAGE))
  const paginatedSales = useMemo(() => {
    const start = (salesPage - 1) * SALES_PER_PAGE
    return filteredSales.slice(start, start + SALES_PER_PAGE)
  }, [filteredSales, salesPage])

  useEffect(() => {
    setSalesPage(1)
  }, [paymentFilter, statusFilter, searchTerm, dateFrom, dateTo, branchFilter])

  const resolveSaleNumber = (saleId: string) => saleNumberMap.get(saleId) ?? null
  const resolveQueueNumber = (queueId: string) => queueNumberMap.get(queueId) ?? null

  const approveQueuedSale = async (queueId: string) => {
    setIsProcessingQueue(true)

    try {
      const result = await posService.approveQueuedSale({ queue_id: queueId })
      await loadData(branchFilter !== 'all' ? branchFilter : activeBranchId)
      let saleNumber = 'N0'
      if (result?.sale_id) {
        try {
          saleNumber = await posService.getSaleReceiptNumber(result.sale_id, activeBranchId)
        } catch {
          saleNumber = 'N0'
        }
      }
      toast({
        title: 'Venta aprobada',
        description: `Venta en cola aprobada. Venta creada: ${saleNumber}`,
      })
    } catch (approveError) {
      toast({
        title: 'No se pudo aprobar la venta',
        description: approveError instanceof Error ? approveError.message : 'No se pudo aprobar la venta en cola',
        variant: 'destructive',
      })
    } finally {
      setIsProcessingQueue(false)
    }
  }

  const rejectQueuedSale = async (queueId: string) => {
    setIsProcessingQueue(true)

    try {
      await posService.rejectQueuedSale({ queue_id: queueId, reason: 'Rechazada desde historial' })
      await loadData(branchFilter !== 'all' ? branchFilter : activeBranchId)
      toast({
        title: 'Venta rechazada',
        description: 'Venta en cola rechazada correctamente.',
      })
    } catch (rejectError) {
      toast({
        title: 'No se pudo rechazar la venta',
        description: rejectError instanceof Error ? rejectError.message : 'No se pudo rechazar la venta en cola',
        variant: 'destructive',
      })
    } finally {
      setIsProcessingQueue(false)
    }
  }

  const openDeliveryDialog = (sale: POSSaleRecord) => {
    const pendingItems = (sale.items || []).filter(
      (item) => Number(item.delivered_quantity || 0) < Number(item.quantity || 0),
    )
    const initialQtys: Record<string, string> = {}
    for (const item of pendingItems) {
      const remaining = Number(item.quantity) - Number(item.delivered_quantity || 0)
      initialQtys[item.id] = String(remaining)
    }
    setDeliveryQtys(initialQtys)
    setDeliveryNotes('')
    setDeliveryFeedback(null)
    setDeliveryDialogSale(sale)
  }

  const submitDelivery = async () => {
    if (!deliveryDialogSale) return

    const itemsToDeliver = Object.entries(deliveryQtys)
      .map(([saleItemId, qty]) => ({ sale_item_id: saleItemId, quantity: Number(qty) }))
      .filter((entry) => entry.quantity > 0)

    if (itemsToDeliver.length === 0) {
      setDeliveryFeedback('Ingresa al menos una cantidad mayor a 0 para entregar.')
      return
    }

    setIsSubmittingDelivery(true)
    setDeliveryFeedback(null)

    try {
      await posService.registerDelivery({
        sale_id: deliveryDialogSale.sale_id,
        notes: deliveryNotes.trim() || null,
        items: itemsToDeliver,
      })

      setDeliveryDialogSale(null)
      void loadData(branchFilter !== 'all' ? branchFilter : activeBranchId)
    } catch (err) {
      setDeliveryFeedback(err instanceof Error ? err.message : 'No se pudo registrar la entrega')
    } finally {
      setIsSubmittingDelivery(false)
    }
  }

  const openEditDialog = (sale: POSSaleRecord) => {
    setEditDialogSale(sale)
    setEditSection('return')
    setEditReturnChecked(new Set())
    const initQtys: Record<string, string> = {}
    for (const item of (sale.items || [])) {
      initQtys[item.id] = String(item.quantity)
    }
    setEditReturnQtys(initQtys)
    setEditReturnReason('')
    setEditVoidReason('')
    setEditFeedback(null)
  }

  const submitReturnFromEdit = async () => {
    if (!editDialogSale || editReturnChecked.size === 0 || !editReturnReason.trim()) {
      setEditFeedback('Selecciona al menos un ítem y escribe el motivo.')
      return
    }
    const items = Array.from(editReturnChecked)
      .map((id) => ({ sale_item_id: id, quantity: Number(editReturnQtys[id] || 1) }))
      .filter((i) => i.quantity > 0)
    if (items.length === 0) return
    setIsSubmittingEdit(true)
    setEditFeedback(null)
    try {
      await posService.createReturn({
        sale_id: editDialogSale.sale_id,
        reason: editReturnReason.trim(),
        items,
      })
      setEditDialogSale(null)
      void loadData(branchFilter !== 'all' ? branchFilter : activeBranchId)
    } catch (err) {
      setEditFeedback(err instanceof Error ? err.message : 'No se pudo registrar la devolución')
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  const submitVoidSale = async () => {
    if (!editDialogSale || !editVoidReason.trim()) {
      setEditFeedback('Escribe el motivo de la anulación.')
      return
    }
    setIsSubmittingEdit(true)
    setEditFeedback(null)
    try {
      await posService.voidSale({ sale_id: editDialogSale.sale_id, reason: editVoidReason.trim() })
      setEditDialogSale(null)
      void loadData(branchFilter !== 'all' ? branchFilter : activeBranchId)
    } catch (err) {
      setEditFeedback(err instanceof Error ? err.message : 'No se pudo anular la venta')
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  const getSaleBadge = (sale: POSSaleRecord) => {
    const credit = creditMap.get(sale.sale_id)
    if (credit) {
      if (credit.status === 'paid') {
        return { label: 'Crédito pagado', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' }
      }
      if (credit.status === 'overdue') {
        return { label: 'Crédito vencido', className: 'bg-rose-500/15 text-rose-400 border-rose-500/30' }
      }
      return { label: 'A crédito', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' }
    }
    return statusConfig[sale.status] ?? { label: sale.status, className: 'bg-muted text-muted-foreground' }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Historial de Ventas"
          description="Ventas completadas, anuladas y cola por sucursal"
        />
        <POSSubnav />

        {error ? (
          <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        ) : null}

        {/* Filters */}
        <Card className="card-filter">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-300 uppercase tracking-wide">Filtros</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            <div className="space-y-1 xl:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Buscar</label>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nro. de venta o cliente..."
                className="h-9"
              />
            </div>

            {activeRole === 'admin' && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Sucursal</label>
                <SearchableStringPick
                  value={branchFilter}
                  onValueChange={setBranchFilter}
                  options={[
                    { value: activeBranchId, label: 'Sucursal activa' },
                    ...branches.map((b) => ({ value: b.id, label: b.name })),
                  ]}
                  placeholder="Seleccionar sucursal"
                  searchPlaceholder="Buscar sucursal..."
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Método de pago</label>
              <SearchableStringPick
                value={paymentFilter}
                onValueChange={setPaymentFilter}
                options={[
                  { value: 'all', label: 'Todos' },
                  { value: 'cash', label: 'Efectivo' },
                  { value: 'card', label: 'Tarjeta' },
                  { value: 'qr', label: 'QR/Transferencia' },
                  { value: 'credit', label: 'Crédito' },
                ]}
                placeholder="Todos los métodos"
                searchPlaceholder="Buscar método..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Estado</label>
              <SearchableStringPick
                value={statusFilter}
                onValueChange={setStatusFilter}
                options={[
                  { value: 'all', label: 'Todos' },
                  { value: 'completed', label: 'Completada' },
                  { value: 'voided', label: 'Anulada' },
                ]}
                placeholder="Todos los estados"
                searchPlaceholder="Buscar estado..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Desde</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Hasta</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={filteredSales.length === 0}
              onClick={() => {
                const branchName = branches.find((b) => b.id === activeBranchId)?.name || activeBranchId
                const settings = getAppSettings()
                generateCashSessionPdf({
                  branchName,
                  sessionDate: new Date().toLocaleDateString('es-BO'),
                  cashier: 'N/A',
                  exchangeRate: settings.usd_to_bob_rate,
                  sales: filteredSales.map((sale) => {
                    const items = (sale.items || []).map((item) => {
                      const bob = Number(item.line_total || 0)
                      return {
                        code: '',
                        name: item.part_name,
                        quantity: Number(item.quantity || 0),
                        unit: 'PZA',
                        unitPrice: Number(item.unit_price || 0),
                        totalBob: bob,
                        totalUsd: settings.usd_to_bob_rate > 0 ? bob / settings.usd_to_bob_rate : 0,
                      }
                    })
                    const subtotal = items.reduce((s, i) => s + i.totalBob, 0)
                    const total = Number(sale.total_amount || 0)
                    return {
                      saleId: sale.sale_id,
                      date: sale.created_at,
                      customer: sale.customer_name ?? 'Mostrador',
                      paymentMethod: paymentLabels[sale.payment_method] ?? sale.payment_method,
                      items,
                      subtotalBob: subtotal,
                      discount: subtotal - total > 0.01 ? subtotal - total : 0,
                      totalBob: total,
                      totalUsd: settings.usd_to_bob_rate > 0 ? total / settings.usd_to_bob_rate : 0,
                    }
                  }),
                })
              }}
            >
              <Download className="mr-2 h-4 w-4" /> Descargar informe PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={filteredSales.length === 0}
              onClick={() => {
                const branchName = branches.find((b) => b.id === activeBranchId)?.name || activeBranchId
                const settings = getAppSettings()
                let counter = 0
                const rows: Array<Array<string | number>> = []

                for (const sale of filteredSales) {
                  for (const item of (sale.items || [])) {
                    counter += 1
                    const bob = Number(item.line_total || 0)
                    rows.push([
                      counter,
                      '',
                      item.part_name,
                      Number(item.quantity || 0),
                      'PZA',
                      Number(item.unit_price || 0),
                      settings.usd_to_bob_rate > 0 ? bob / settings.usd_to_bob_rate : 0,
                      bob,
                    ])
                  }
                }

                exportToExcel({
                  fileName: `cierre_caja_${branchName.replace(/\s+/g, '_')}`,
                  headers: ['#', 'Codigo', 'Producto', 'Cant.', 'U.M.', 'P. Unit.', 'Total ($)', 'Total (Bs)'],
                  rows,
                })
              }}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Descargar Excel
            </Button>
          </div>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Ventas filtradas', value: filteredSales.length, color: 'text-foreground' },
            { label: 'Total (Bs)', value: `Bs ${totalSales.toFixed(2)}`, color: 'text-emerald-400' },
            { label: 'Anuladas', value: filteredSales.filter((s) => s.status === 'voided').length, color: 'text-rose-400' },
            { label: 'En cola', value: filteredQueue.length, color: 'text-amber-400' },
          ].map((kpi) => (
            <Card key={kpi.label} className="border-border/60 bg-card/70">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className={`text-2xl font-semibold mt-1 ${kpi.color}`}>{kpi.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs: Ventas / Cola */}
        <Tabs defaultValue="sales">
          <TabsList className="mb-4">
            <TabsTrigger value="sales">
              Ventas <Badge variant="secondary" className="ml-2">{filteredSales.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="queue">
              Cola <Badge variant="secondary" className="ml-2">{filteredQueue.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sales">
            <div className="space-y-2">
              {isLoading ? (
                <Card className="border-border/60 overflow-hidden">
                  <div className="space-y-0">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex gap-4 px-4 py-3 border-b border-border/40 animate-pulse">
                        <div className="h-4 bg-muted/50 rounded w-36" />
                        <div className="h-4 bg-muted/50 rounded w-28" />
                        <div className="h-4 bg-muted/50 rounded w-20" />
                        <div className="h-4 bg-muted/50 rounded w-16 ml-auto" />
                      </div>
                    ))}
                  </div>
                </Card>
              ) : filteredSales.length === 0 ? (
                <Card className="border-border/60">
                  <EmptyState
                    icon={ShoppingCart}
                    title="Sin ventas"
                    description={`No hay ventas para los filtros seleccionados en ${activeBranchName}.`}
                  />
                </Card>
              ) : (
                <>
                  {paginatedSales.map((sale) => {
                    const badge = getSaleBadge(sale)
                    const isExpanded = expandedSaleId === sale.sale_id
                    const branchName = branches.find((b) => b.id === activeBranchId)?.name || activeBranchId
                    const saleNumber = resolveSaleNumber(sale.sale_id) ?? 'N0'
                    const hasDeliveryPending = sale.delivery_status !== 'delivered'

                    return (
                      <div key={sale.sale_id} className="rounded-xl border border-border/60 bg-card overflow-hidden">
                        <button
                          type="button"
                          className="w-full flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-left hover:bg-primary/5 transition-colors cursor-pointer"
                          onClick={() => setExpandedSaleId((prev) => prev === sale.sale_id ? null : sale.sale_id)}
                          aria-expanded={isExpanded}
                        >
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(sale.created_at).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                          <span className="text-xs font-mono text-muted-foreground">{saleNumber}</span>
                          <span className="text-sm font-medium flex-1 min-w-[120px]">{sale.customer_name ?? 'Mostrador'}</span>
                          <span className="text-xs text-muted-foreground">{paymentLabels[sale.payment_method] ?? sale.payment_method}</span>
                          <Badge variant="outline" className={`text-xs ${badge.className}`}>{badge.label}</Badge>
                          {hasDeliveryPending && (
                            <Badge variant="outline" className="text-xs bg-sky-500/15 text-sky-400 border-sky-500/30">
                              <Truck className="w-3 h-3 mr-1" />{deliveryLabels[sale.delivery_status] ?? sale.delivery_status}
                            </Badge>
                          )}
                          <span className="font-semibold text-sm text-primary ml-auto">
                            Bs {Number(sale.total_amount || 0).toFixed(2)}
                          </span>
                          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>

                        {isExpanded && (
                          <div className="border-t border-border/50 px-4 py-3 space-y-3 bg-muted/10">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground">
                              <div><span className="font-medium text-foreground">Modo:</span> {sale.sale_mode === 'advance' ? 'Adelantada' : 'Inmediata'}</div>
                              <div><span className="font-medium text-foreground">Entrega:</span> {deliveryLabels[sale.delivery_status] ?? sale.delivery_status}</div>
                              <div><span className="font-medium text-foreground">Método:</span> {paymentLabels[sale.payment_method] ?? sale.payment_method}</div>
                            </div>

                            {creditMap.has(sale.sale_id) && (() => {
                              const credit = creditMap.get(sale.sale_id)!
                              const isPaid = credit.status === 'paid'
                              const isOverdue = credit.status === 'overdue'
                              const borderClass = isPaid
                                ? 'border-emerald-500/30 bg-emerald-500/8'
                                : isOverdue
                                ? 'border-rose-500/30 bg-rose-500/8'
                                : 'border-amber-500/30 bg-amber-500/8'
                              const titleClass = isPaid ? 'text-emerald-300' : isOverdue ? 'text-rose-300' : 'text-amber-300'
                              return (
                                <div className={`rounded-lg border ${borderClass} px-3 py-2.5 text-xs space-y-2`}>
                                  <div className="flex items-center gap-2">
                                    <HandCoins className={`h-3.5 w-3.5 ${titleClass}`} />
                                    <span className={`font-semibold ${titleClass}`}>
                                      {isPaid ? 'Crédito pagado en su totalidad' : isOverdue ? 'Crédito vencido' : 'Venta a crédito'}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-muted-foreground">
                                    <div>
                                      <span className="font-medium text-foreground">Total crédito:</span>{' '}
                                      Bs {credit.total_amount.toFixed(2)}
                                    </div>
                                    <div>
                                      <span className="font-medium text-foreground">Pagado:</span>{' '}
                                      <span className="text-emerald-400">Bs {credit.paid_amount.toFixed(2)}</span>
                                    </div>
                                    <div>
                                      <span className="font-medium text-foreground">Saldo:</span>{' '}
                                      <span className={credit.balance > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                                        Bs {credit.balance.toFixed(2)}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="font-medium text-foreground">Vencimiento:</span>{' '}
                                      <span className={isOverdue ? 'text-rose-400' : ''}>
                                        {new Date(credit.due_date).toLocaleDateString('es-BO')}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="font-medium text-foreground">Vendedor:</span>{' '}
                                      {credit.seller_name}
                                    </div>
                                    {credit.notes && (
                                      <div className="sm:col-span-3">
                                        <span className="font-medium text-foreground">Notas:</span>{' '}
                                        {credit.notes}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })()}

                            {sale.sale_mode === 'advance' && sale.payment_method !== 'credit' && (
                              <div className="flex gap-3 text-xs">
                                <span className="text-amber-400">Anticipo: Bs {Number(sale.advance_amount || 0).toFixed(2)}</span>
                                <span className="text-rose-400">Pendiente: Bs {Number(sale.pending_amount || 0).toFixed(2)}</span>
                              </div>
                            )}

                            <div className="rounded-lg border border-border/50 overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-muted/30 border-border/40">
                                    <TableHead className="text-xs py-2">#</TableHead>
                                    <TableHead className="text-xs py-2">Producto</TableHead>
                                    <TableHead className="text-xs py-2 text-right">Cant.</TableHead>
                                    <TableHead className="text-xs py-2 text-right">Entregado</TableHead>
                                    <TableHead className="text-xs py-2 text-right">P.Unit</TableHead>
                                    <TableHead className="text-xs py-2 text-right">Total</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {(sale.items || []).map((item, idx) => {
                                    const delivered = Number(item.delivered_quantity || 0)
                                    const total = Number(item.quantity || 0)
                                    const isFullyDelivered = delivered >= total
                                    return (
                                      <TableRow key={item.id} className="border-border/40">
                                        <TableCell className="text-xs py-2 text-muted-foreground">{idx + 1}</TableCell>
                                        <TableCell className="text-sm py-2">{item.part_name}</TableCell>
                                        <TableCell className="text-sm py-2 text-right">{total}</TableCell>
                                        <TableCell className="text-sm py-2 text-right">
                                          <span className={isFullyDelivered ? 'text-emerald-400' : 'text-amber-400'}>
                                            {delivered}/{total}
                                          </span>
                                        </TableCell>
                                        <TableCell className="text-sm py-2 text-right">Bs {Number(item.unit_price || 0).toFixed(2)}</TableCell>
                                        <TableCell className="text-sm py-2 text-right font-medium">Bs {Number(item.line_total || 0).toFixed(2)}</TableCell>
                                      </TableRow>
                                    )
                                  })}
                                </TableBody>
                              </Table>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    generateSaleInvoicePdf({
                                      saleId: sale.sale_id,
                                      saleNumber,
                                      date: sale.created_at,
                                      customer: sale.customer_name ?? 'Mostrador',
                                      paymentMethod: paymentLabels[sale.payment_method] ?? sale.payment_method,
                                      branchName,
                                      items: (sale.items || []).map((item) => ({
                                        code: '',
                                        name: item.part_name,
                                        quantity: Number(item.quantity),
                                        unitPrice: Number(item.unit_price || 0),
                                        lineTotal: Number(item.line_total || 0),
                                      })),
                                      total: Number(sale.total_amount || 0),
                                      exchangeRate: getAppSettings().usd_to_bob_rate,
                                    })
                                  }}
                                >
                                  <Download className="mr-1 h-3 w-3" /> PDF
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    exportToExcel({
                                      fileName: `recibo_${saleNumber}_${branchName.replace(/\s+/g, '_')}`,
                                      headers: ['#', 'Codigo', 'Producto', 'Cant.', 'P. Unit.', 'Total'],
                                      rows: (sale.items || []).map((item, index) => [
                                        index + 1,
                                        '',
                                        item.part_name,
                                        Number(item.quantity),
                                        Number(item.unit_price || 0),
                                        Number(item.line_total || 0),
                                      ]),
                                    })
                                  }}
                                >
                                  <FileSpreadsheet className="mr-1 h-3 w-3" /> Excel
                                </Button>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                {hasDeliveryPending && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-sky-500/40 text-sky-400 hover:bg-sky-500/10"
                                    onClick={(e) => { e.stopPropagation(); openDeliveryDialog(sale) }}
                                  >
                                    <Truck className="mr-1 h-3 w-3" /> Registrar entrega
                                  </Button>
                                )}
                                {activeRole === 'admin' && sale.status === 'completed' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-orange-500/40 text-orange-400 hover:bg-orange-500/10"
                                    onClick={(e) => { e.stopPropagation(); openEditDialog(sale) }}
                                  >
                                    <Pencil className="mr-1 h-3 w-3" /> Editar venta
                                  </Button>
                                )}
                                <p className="text-sm font-bold text-primary">
                                  Total: Bs {Number(sale.total_amount || 0).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {totalSalesPages > 1 && (
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => { e.preventDefault(); setSalesPage((p) => Math.max(1, p - 1)) }}
                            aria-disabled={salesPage === 1}
                            className={salesPage === 1 ? 'pointer-events-none opacity-50' : ''}
                          />
                        </PaginationItem>
                        {Array.from({ length: totalSalesPages }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              isActive={page === salesPage}
                              onClick={(e) => { e.preventDefault(); setSalesPage(page) }}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => { e.preventDefault(); setSalesPage((p) => Math.min(totalSalesPages, p + 1)) }}
                            aria-disabled={salesPage === totalSalesPages}
                            className={salesPage === totalSalesPages ? 'pointer-events-none opacity-50' : ''}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="queue">
            <Card className="border-border/60 overflow-hidden">
              {isLoading ? (
                <div className="space-y-0">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex gap-4 px-4 py-3 border-b border-border/40 animate-pulse">
                      <div className="h-4 bg-muted/50 rounded w-36" />
                      <div className="h-4 bg-muted/50 rounded w-28" />
                      <div className="h-4 bg-muted/50 rounded w-16 ml-auto" />
                    </div>
                  ))}
                </div>
              ) : filteredQueue.length === 0 ? (
                <EmptyState
                  icon={FileSearch}
                  title="Sin ventas en cola"
                  description="No hay ventas en cola para los filtros seleccionados."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 bg-muted/20">
                      <TableHead className="text-xs font-medium">Fecha</TableHead>
                      <TableHead className="text-xs font-medium">Nro. Cola</TableHead>
                      <TableHead className="text-xs font-medium">Cliente</TableHead>
                      <TableHead className="text-xs font-medium">Rol creador</TableHead>
                      <TableHead className="text-xs font-medium">Método</TableHead>
                      <TableHead className="text-xs font-medium">Estado</TableHead>
                      <TableHead className="text-xs font-medium text-right">Total (Bs)</TableHead>
                      {canApproveQueue && <TableHead className="text-xs font-medium text-right">Acciones</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQueue.map((q) => {
                      const qs = queueStatusConfig[q.status] ?? { label: q.status, className: 'bg-muted text-muted-foreground' }
                      return (
                        <TableRow key={q.queue_id} className="border-border/40 hover:bg-primary/5 transition-colors">
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(q.created_at).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {resolveQueueNumber(q.queue_id) ?? 'Cola'}
                          </TableCell>
                          <TableCell className="text-sm">{q.customer_name ?? 'Mostrador'}</TableCell>
                          <TableCell className="text-xs">{q.created_by_role === 'admin' ? 'Administrador' : q.created_by_role === 'manager' ? 'Encargado' : q.created_by_role === 'employee' ? 'Empleado' : 'Solo lectura'}</TableCell>
                          <TableCell className="text-sm">{paymentLabels[q.payment_method] ?? q.payment_method}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs ${qs.className}`}>
                              {qs.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-sm">
                            Bs {Number(q.total_amount_bob || 0).toFixed(2)}
                          </TableCell>
                          {canApproveQueue && (
                            <TableCell className="text-right">
                              {q.status === 'queued' ? (
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="success"
                                    size="sm"
                                    onClick={() => approveQueuedSale(q.queue_id)}
                                    disabled={isProcessingQueue}
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-2" /> Convertir en venta
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => rejectQueuedSale(q.queue_id)}
                                    disabled={isProcessingQueue}
                                  >
                                    Rechazar
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delivery items dialog */}
      <Dialog open={deliveryDialogSale !== null} onOpenChange={(open) => { if (!open) setDeliveryDialogSale(null) }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-sky-400" />
              Registrar entrega de ítems
            </DialogTitle>
          </DialogHeader>

          {deliveryDialogSale && (() => {
            const pendingItems = (deliveryDialogSale.items || []).filter(
              (item: POSSaleItem) => Number(item.delivered_quantity || 0) < Number(item.quantity || 0),
            )

            return (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Cliente: <span className="text-foreground font-medium">{deliveryDialogSale.customer_name ?? 'Mostrador'}</span>
                </p>

                {pendingItems.length === 0 ? (
                  <p className="text-sm text-emerald-400 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                    Todos los ítems de esta venta ya fueron entregados.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      Ítems pendientes de entrega — ingresa la cantidad a entregar ahora:
                    </p>
                    {pendingItems.map((item: POSSaleItem) => {
                      const remaining = Number(item.quantity) - Number(item.delivered_quantity || 0)
                      return (
                        <div key={item.id} className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 p-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.part_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Pendiente: {remaining} de {Number(item.quantity)} — Ya entregado: {Number(item.delivered_quantity || 0)}
                            </p>
                          </div>
                          <div className="shrink-0 w-24">
                            <Input
                              type="number"
                              min={0}
                              max={remaining}
                              value={deliveryQtys[item.id] ?? '0'}
                              onChange={(e) => {
                                const val = Math.min(Number(e.target.value), remaining)
                                setDeliveryQtys((prev) => ({ ...prev, [item.id]: String(Math.max(0, val)) }))
                              }}
                              className="h-8 text-center"
                            />
                          </div>
                        </div>
                      )
                    })}

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Notas de entrega (opcional)</label>
                      <Input
                        placeholder="Observaciones..."
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                      />
                    </div>

                    {deliveryFeedback && (
                      <p className="text-sm text-rose-400 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3">
                        {deliveryFeedback}
                      </p>
                    )}
                  </div>
                )}

                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeliveryDialogSale(null)}>Cancelar</Button>
                  {pendingItems.length > 0 && (
                    <Button
                      onClick={() => void submitDelivery()}
                      disabled={isSubmittingDelivery}
                      className="bg-sky-600 hover:bg-sky-700 text-white"
                    >
                      <Truck className="mr-2 h-4 w-4" />
                      {isSubmittingDelivery ? 'Registrando...' : 'Confirmar entrega'}
                    </Button>
                  )}
                </DialogFooter>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Edit sale dialog — admin only */}
      <Dialog open={editDialogSale !== null} onOpenChange={(open) => { if (!open) setEditDialogSale(null) }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-4 h-4 text-orange-400" />
              Editar venta {editDialogSale ? (resolveSaleNumber(editDialogSale.sale_id) ?? '') : ''}
            </DialogTitle>
          </DialogHeader>

          {editDialogSale && (() => {
            const sale = editDialogSale
            return (
              <div className="space-y-4">
                <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-xs space-y-1">
                  <p><span className="text-muted-foreground">Cliente:</span> <span className="font-medium">{sale.customer_name ?? 'Mostrador'}</span></p>
                  <p><span className="text-muted-foreground">Fecha:</span> {new Date(sale.created_at).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  <p><span className="text-muted-foreground">Total:</span> <span className="font-semibold text-primary">Bs {Number(sale.total_amount || 0).toFixed(2)}</span></p>
                </div>

                {/* Section toggle */}
                <div className="flex rounded-lg border border-border/60 overflow-hidden">
                  <button
                    type="button"
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${editSection === 'return' ? 'bg-primary/10 text-primary border-r border-border/60' : 'text-muted-foreground hover:bg-muted/30 border-r border-border/60'}`}
                    onClick={() => { setEditSection('return'); setEditFeedback(null) }}
                  >
                    Registrar devolución
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${editSection === 'void' ? 'bg-rose-500/10 text-rose-400' : 'text-muted-foreground hover:bg-muted/30'}`}
                    onClick={() => { setEditSection('void'); setEditFeedback(null) }}
                  >
                    Anular venta
                  </button>
                </div>

                {editSection === 'return' && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">Marca los productos a devolver e ingresa la cantidad.</p>
                    {(sale.items || []).map((item) => {
                      const isChecked = editReturnChecked.has(item.id)
                      const qty = editReturnQtys[item.id] ?? String(item.quantity)
                      return (
                        <label
                          key={item.id}
                          className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${isChecked ? 'border-primary/40 bg-primary/5' : 'border-border/60 bg-muted/20 hover:border-border'}`}
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 shrink-0"
                            checked={isChecked}
                            onChange={(e) => {
                              setEditReturnChecked((prev) => {
                                const next = new Set(prev)
                                if (e.target.checked) next.add(item.id)
                                else next.delete(item.id)
                                return next
                              })
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.part_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Qty: {Number(item.quantity)} · Bs {Number(item.unit_price || 0).toFixed(2)} c/u
                            </p>
                          </div>
                          <div className="shrink-0 flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Cant.:</span>
                            <Input
                              type="number"
                              min={1}
                              max={Number(item.quantity)}
                              value={qty}
                              disabled={!isChecked}
                              className="w-20 h-8 text-center"
                              onClick={(e) => e.preventDefault()}
                              onChange={(e) => setEditReturnQtys((prev) => ({ ...prev, [item.id]: e.target.value }))}
                            />
                          </div>
                        </label>
                      )
                    })}

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Motivo de devolución <span className="text-rose-400">*</span>
                      </label>
                      <Input
                        placeholder="Motivo (requerido)"
                        value={editReturnReason}
                        onChange={(e) => setEditReturnReason(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {editSection === 'void' && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                      <p>Anular la venta revierte el movimiento de caja e inventario. Esta acción no se puede deshacer.</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Motivo de anulación <span className="text-rose-400">*</span>
                      </label>
                      <Input
                        placeholder="Motivo (requerido)"
                        value={editVoidReason}
                        onChange={(e) => setEditVoidReason(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {editFeedback && (
                  <p className="text-sm text-rose-400 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3">
                    {editFeedback}
                  </p>
                )}

                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditDialogSale(null)} disabled={isSubmittingEdit}>
                    Cancelar
                  </Button>
                  {editSection === 'return' ? (
                    <Button
                      onClick={() => void submitReturnFromEdit()}
                      disabled={isSubmittingEdit || editReturnChecked.size === 0}
                    >
                      {isSubmittingEdit ? 'Registrando...' : 'Registrar devolución'}
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      onClick={() => void submitVoidSale()}
                      disabled={isSubmittingEdit || !editVoidReason.trim()}
                    >
                      {isSubmittingEdit ? 'Anulando...' : 'Confirmar anulación'}
                    </Button>
                  )}
                </DialogFooter>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>

    </MainLayout>
  )
}
