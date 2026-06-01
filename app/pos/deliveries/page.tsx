'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { POSSubnav } from '@/components/modules/pos/pos-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ACTIVE_ROLE_EVENT, getActiveUserContext } from '@/lib/mock/runtime-store'
import { posService, type POSPendingDelivery } from '@/lib/supabase/pos'
import { Truck, PackageCheck, CheckCheck, Trash2, AlertTriangle } from 'lucide-react'
import { EmptyState } from '@/components/common/empty-state'

const paymentLabels: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  qr: 'QR/Transferencia',
  credit: 'Crédito',
}

function toLocalDateKey(value: string) {
  const dt = new Date(value)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

export default function POSDeliveriesPage() {
  const [pendingDeliveries, setPendingDeliveries] = useState<POSPendingDelivery[]>([])
  const [activeBranchId, setActiveBranchId] = useState('')
  const [activeRole, setActiveRole] = useState('')

  // Delivery dialog
  const [deliveryDialogSale, setDeliveryDialogSale] = useState<POSPendingDelivery | null>(null)
  const [deliveryQtys, setDeliveryQtys] = useState<Record<string, string>>({})
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  // Force-complete confirm dialog (admin only)
  const [forceDialogSale, setForceDialogSale] = useState<POSPendingDelivery | null>(null)
  const [isForcing, setIsForcing] = useState(false)
  const [forceFeedback, setForceFeedback] = useState<string | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async (branchId?: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const targetBranch = branchId || getActiveUserContext().branch_id
      const data = await posService.getPendingDeliveries(targetBranch)
      setPendingDeliveries(data)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar entregas pendientes')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const syncContext = () => {
      const context = getActiveUserContext()
      setActiveBranchId(context.branch_id)
      setActiveRole(context.role)
      void loadData(context.branch_id)
    }
    syncContext()
    window.addEventListener(ACTIVE_ROLE_EVENT, syncContext)
    window.addEventListener('focus', syncContext)
    return () => {
      window.removeEventListener(ACTIVE_ROLE_EVENT, syncContext)
      window.removeEventListener('focus', syncContext)
    }
  }, [])

  const saleNumberMap = useMemo(() => {
    const map = new Map<string, string>()
    const grouped = new Map<string, POSPendingDelivery[]>()
    pendingDeliveries.forEach((d) => {
      const key = toLocalDateKey(d.created_at)
      const list = grouped.get(key) ?? []
      list.push(d)
      grouped.set(key, list)
    })
    grouped.forEach((list) => {
      list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      list.forEach((d, idx) => map.set(d.sale_id, `N${idx + 1}`))
    })
    return map
  }, [pendingDeliveries])

  const getPendingItems = (delivery: POSPendingDelivery) =>
    delivery.items.filter((item) => Number(item.delivered_quantity || 0) < Number(item.quantity || 0))

  const openDeliveryDialog = (delivery: POSPendingDelivery) => {
    const pending = getPendingItems(delivery)
    const initQtys: Record<string, string> = {}
    for (const item of pending) {
      const remaining = Number(item.quantity) - Number(item.delivered_quantity || 0)
      initQtys[item.sale_item_id] = String(remaining)
    }
    setDeliveryQtys(initQtys)
    setDeliveryNotes('')
    setFeedback(null)
    setDeliveryDialogSale(delivery)
  }

  const fillAllQtys = () => {
    if (!deliveryDialogSale) return
    const pending = getPendingItems(deliveryDialogSale)
    const filled: Record<string, string> = {}
    for (const item of pending) {
      filled[item.sale_item_id] = String(Number(item.quantity) - Number(item.delivered_quantity || 0))
    }
    setDeliveryQtys(filled)
  }

  const submitDelivery = async () => {
    if (!deliveryDialogSale) return
    const itemsToDeliver = Object.entries(deliveryQtys)
      .map(([saleItemId, qty]) => ({ sale_item_id: saleItemId, quantity: Number(qty) }))
      .filter((entry) => entry.quantity > 0)
    if (itemsToDeliver.length === 0) {
      setFeedback('Ingresa al menos una cantidad mayor a 0 para entregar.')
      return
    }
    setIsSubmitting(true)
    setFeedback(null)
    try {
      await posService.registerDelivery({
        sale_id: deliveryDialogSale.sale_id,
        notes: deliveryNotes.trim() || null,
        items: itemsToDeliver,
      })
      setDeliveryDialogSale(null)
      await loadData(activeBranchId)
    } catch (submitError: unknown) {
      console.error('registerDelivery error:', submitError)
      let msg = 'No se pudo registrar la entrega'
      if (submitError && typeof submitError === 'object') {
        const e = submitError as Record<string, unknown>
        const parts: string[] = []
        if (e.message) parts.push(String(e.message))
        if (e.details) parts.push(`Detalles: ${e.details}`)
        if (e.hint) parts.push(`Hint: ${e.hint}`)
        if (e.code) parts.push(`Código: ${e.code}`)
        if (parts.length) msg = parts.join(' — ')
      }
      setFeedback(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Admin-only: force all remaining items as fully delivered
  const submitForceComplete = async () => {
    if (!forceDialogSale) return
    const pending = getPendingItems(forceDialogSale)
    if (pending.length === 0) return
    const items = pending.map((item) => ({
      sale_item_id: item.sale_item_id,
      quantity: Number(item.quantity) - Number(item.delivered_quantity || 0),
    }))
    setIsForcing(true)
    setForceFeedback(null)
    try {
      await posService.registerDelivery({
        sale_id: forceDialogSale.sale_id,
        notes: 'Entrega forzada por administrador',
        items,
      })
      setForceDialogSale(null)
      await loadData(activeBranchId)
    } catch (err: unknown) {
      console.error('forceComplete error:', err)
      let msg = 'No se pudo forzar la entrega'
      if (err && typeof err === 'object') {
        const e = err as Record<string, unknown>
        if (e.message) msg = String(e.message)
        if (e.details) msg += ` — ${e.details}`
      }
      setForceFeedback(msg)
    } finally {
      setIsForcing(false)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Mercadería por Entregar" description="Gestiona entregas parciales y finales de ventas pendientes" />
        <POSSubnav />

        {error ? (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>
        ) : null}

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-sky-400" />
              Ventas pendientes de entrega
              {!isLoading && (
                <Badge variant="secondary" className="ml-auto">
                  {pendingDeliveries.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-4 px-2 py-3 animate-pulse">
                    <div className="h-4 bg-muted/50 rounded w-20" />
                    <div className="h-4 bg-muted/50 rounded w-32" />
                    <div className="h-4 bg-muted/50 rounded w-24 ml-auto" />
                  </div>
                ))}
              </div>
            ) : pendingDeliveries.length === 0 ? (
              <EmptyState
                icon={PackageCheck}
                title="Sin entregas pendientes"
                description="No hay ventas pendientes por entregar en esta sucursal."
              />
            ) : (
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 border-border/40">
                      <TableHead className="text-xs py-2">Fecha</TableHead>
                      <TableHead className="text-xs py-2">Nro.</TableHead>
                      <TableHead className="text-xs py-2">Cliente</TableHead>
                      <TableHead className="text-xs py-2">Método</TableHead>
                      <TableHead className="text-xs py-2">Estado</TableHead>
                      <TableHead className="text-xs py-2 text-right">Total</TableHead>
                      <TableHead className="text-xs py-2 text-right">Pendientes</TableHead>
                      <TableHead className="text-xs py-2" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingDeliveries.map((delivery) => {
                      const saleNumber = saleNumberMap.get(delivery.sale_id) ?? '—'
                      const pendingItems = getPendingItems(delivery)
                      const isPartial = delivery.delivery_status === 'partial'
                      const deliveryStatusClass = isPartial
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        : 'bg-sky-500/15 text-sky-400 border-sky-500/30'

                      return (
                        <TableRow key={delivery.sale_id} className="border-border/40 hover:bg-primary/5">
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap py-2.5">
                            {new Date(delivery.created_at).toLocaleString('es-BO', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </TableCell>
                          <TableCell className="text-xs font-mono font-medium py-2.5">{saleNumber}</TableCell>
                          <TableCell className="text-sm py-2.5">{delivery.customer_name ?? 'Mostrador'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground py-2.5">
                            {paymentLabels[delivery.payment_method] ?? delivery.payment_method}
                          </TableCell>
                          <TableCell className="py-2.5">
                            <Badge variant="outline" className={`text-xs ${deliveryStatusClass}`}>
                              <Truck className="h-3 w-3 mr-1" />
                              {isPartial ? 'Parcial' : 'Pendiente'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm font-semibold text-right py-2.5 text-primary">
                            Bs {Number(delivery.total_amount || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-xs text-right py-2.5 text-muted-foreground">
                            {pendingItems.length} ítem{pendingItems.length !== 1 ? 's' : ''}
                          </TableCell>
                          <TableCell className="py-2.5">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-sky-500/40 text-sky-400 hover:bg-sky-500/10 h-7 text-xs"
                                onClick={() => openDeliveryDialog(delivery)}
                              >
                                <Truck className="mr-1 h-3 w-3" /> Entregar
                              </Button>
                              {activeRole === 'admin' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-rose-500/40 text-rose-400 hover:bg-rose-500/10 h-7 text-xs"
                                  onClick={() => { setForceFeedback(null); setForceDialogSale(delivery) }}
                                  title="Forzar entrega completa (admin)"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delivery dialog */}
      <Dialog open={deliveryDialogSale !== null} onOpenChange={(open) => { if (!open) setDeliveryDialogSale(null) }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-sky-400" />
              Registrar entrega —{' '}
              {deliveryDialogSale ? (saleNumberMap.get(deliveryDialogSale.sale_id) ?? '—') : ''}
            </DialogTitle>
          </DialogHeader>

          {deliveryDialogSale && (() => {
            const pendingItems = getPendingItems(deliveryDialogSale)
            return (
              <div className="space-y-4">
                <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-xs space-y-1">
                  <p>
                    <span className="text-muted-foreground">Cliente:</span>{' '}
                    <span className="font-medium">{deliveryDialogSale.customer_name ?? 'Mostrador'}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Fecha:</span>{' '}
                    {new Date(deliveryDialogSale.created_at).toLocaleString('es-BO', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Total:</span>{' '}
                    <span className="font-semibold text-primary">
                      Bs {Number(deliveryDialogSale.total_amount || 0).toFixed(2)}
                    </span>
                  </p>
                </div>

                {pendingItems.length === 0 ? (
                  <p className="text-sm text-emerald-400 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                    Todos los ítems ya fueron entregados.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                        Cantidad a entregar por ítem
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs px-2"
                        onClick={fillAllQtys}
                      >
                        <CheckCheck className="h-3 w-3 mr-1" /> Rellenar todo
                      </Button>
                    </div>

                    {pendingItems.map((item) => {
                      const remaining = Number(item.quantity) - Number(item.delivered_quantity || 0)
                      return (
                        <div
                          key={item.sale_item_id}
                          className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 p-3"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.part_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Pendiente: {remaining} de {Number(item.quantity)} — Ya entregado:{' '}
                              {Number(item.delivered_quantity || 0)}
                            </p>
                          </div>
                          <div className="shrink-0 w-24">
                            <Input
                              type="number"
                              min={0}
                              max={remaining}
                              value={deliveryQtys[item.sale_item_id] ?? '0'}
                              onChange={(e) => {
                                const val = Math.min(Number(e.target.value), remaining)
                                setDeliveryQtys((prev) => ({
                                  ...prev,
                                  [item.sale_item_id]: String(Math.max(0, val)),
                                }))
                              }}
                              className="h-8 text-center"
                            />
                          </div>
                        </div>
                      )
                    })}

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Notas (opcional)</label>
                      <Input
                        placeholder="Observaciones de la entrega..."
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                      />
                    </div>

                    {feedback && (
                      <p className="text-sm text-rose-400 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3">
                        {feedback}
                      </p>
                    )}
                  </div>
                )}

                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeliveryDialogSale(null)}>Cancelar</Button>
                  {pendingItems.length > 0 && (
                    <Button
                      onClick={() => void submitDelivery()}
                      disabled={isSubmitting}
                      className="bg-sky-600 hover:bg-sky-700 text-white"
                    >
                      <Truck className="mr-2 h-4 w-4" />
                      {isSubmitting ? 'Registrando...' : 'Confirmar entrega'}
                    </Button>
                  )}
                </DialogFooter>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Force-complete dialog — admin only */}
      <Dialog open={forceDialogSale !== null} onOpenChange={(open) => { if (!open) setForceDialogSale(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Forzar entrega completa
            </DialogTitle>
          </DialogHeader>

          {forceDialogSale && (
            <div className="space-y-4">
              <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <p>
                  Esto marcará <strong>todos los ítems pendientes</strong> de la venta{' '}
                  <strong>{saleNumberMap.get(forceDialogSale.sale_id) ?? '—'}</strong> como entregados,
                  retirando la venta de esta lista. Usar solo si la entrega ya ocurrió sin registrarse.
                </p>
              </div>

              <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-xs space-y-1">
                <p>
                  <span className="text-muted-foreground">Cliente:</span>{' '}
                  <span className="font-medium">{forceDialogSale.customer_name ?? 'Mostrador'}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Ítems pendientes:</span>{' '}
                  <span className="font-medium">{getPendingItems(forceDialogSale).length}</span>
                </p>
              </div>

              {forceFeedback && (
                <p className="text-sm text-rose-400 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3">
                  {forceFeedback}
                </p>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setForceDialogSale(null)} disabled={isForcing}>
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => void submitForceComplete()}
                  disabled={isForcing}
                >
                  <CheckCheck className="mr-2 h-4 w-4" />
                  {isForcing ? 'Procesando...' : 'Confirmar — marcar todo entregado'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
