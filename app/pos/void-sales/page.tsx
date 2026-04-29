'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { POSSubnav } from '@/components/modules/pos/pos-subnav'
import { EmptyState } from '@/components/common/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ACTIVE_ROLE_EVENT, getActiveUserContext } from '@/lib/mock/runtime-store'
import { posService, type POSSaleRecord } from '@/lib/supabase/pos'
import { showConfirmAlert } from '@/lib/sweet-alert'
import { toast } from '@/hooks/use-toast'
import { Ban, AlertTriangle } from 'lucide-react'

const paymentLabels: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  qr: 'QR/Transferencia',
}

export default function POSVoidSalesPage() {
  const [sales, setSales] = useState<POSSaleRecord[]>([])
  const [activeBranchId, setActiveBranchId] = useState(() => getActiveUserContext().branch_id)
  const [activeRole, setActiveRole] = useState(() => getActiveUserContext().role)
  const [selectedSale, setSelectedSale] = useState<POSSaleRecord | null>(null)
  const [reason, setReason] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const canVoid = activeRole === 'admin' || activeRole === 'manager'

  const loadData = async (branchId?: string) => {
    setIsLoading(true)
    try {
      const target = branchId ?? activeBranchId
      const data = await posService.getSales(target, false)
      const completed = data.filter((s) => s.status === 'completed')
      setSales(completed)
    } catch (err) {
      toast({
        title: 'Error al cargar ventas',
        description: err instanceof Error ? err.message : 'No se pudo cargar ventas anulables',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const syncContext = () => {
      const ctx = getActiveUserContext()
      setActiveBranchId(ctx.branch_id)
      setActiveRole(ctx.role)
      void loadData(ctx.branch_id)
    }
    syncContext()
    window.addEventListener(ACTIVE_ROLE_EVENT, syncContext)
    window.addEventListener('focus', syncContext)
    return () => {
      window.removeEventListener(ACTIVE_ROLE_EVENT, syncContext)
      window.removeEventListener('focus', syncContext)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredSales = useMemo(() => {
    if (!searchTerm.trim()) return sales
    const term = searchTerm.toLowerCase()
    return sales.filter(
      (s) =>
        s.sale_id.toLowerCase().includes(term) ||
        (s.customer_name ?? '').toLowerCase().includes(term),
    )
  }, [sales, searchTerm])

  const openVoidConfirm = () => {
    if (!selectedSale || !reason.trim()) return
    setIsConfirmOpen(true)
  }

  const voidSale = async () => {
    if (!selectedSale || !reason.trim()) return

    const confirmed = await showConfirmAlert({
      title: '¿Anular esta venta?',
      text: `Se revertirá el stock y el movimiento de caja. Esta acción no se puede deshacer.`,
      confirmButtonText: 'Sí, anular venta',
    })
    if (!confirmed) return

    setIsSubmitting(true)
    setIsConfirmOpen(false)
    try {
      await posService.voidSale({ sale_id: selectedSale.sale_id, reason: reason.trim() })
      toast({
        title: 'Venta anulada',
        description: `La venta ${selectedSale.sale_id.slice(0, 12)}… fue anulada correctamente.`,
      })
      await loadData(activeBranchId)
      setSelectedSale(null)
      setReason('')
    } catch (err) {
      toast({
        title: 'Error al anular',
        description: err instanceof Error ? err.message : 'No se pudo anular la venta',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Anulación de Ventas"
          description="Revierte inventario y movimiento de caja de una venta completada"
        />
        <POSSubnav />

        {!canVoid && (
          <Card className="border-rose-500/40 bg-rose-500/10">
            <CardContent className="pt-6 flex items-center gap-3 text-rose-300">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">Solo administradores y encargados pueden anular ventas.</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: sale list */}
          <div className="lg:col-span-3 space-y-3">
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Ventas completadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por ID o cliente..."
                  className="h-9"
                />
                <div className="rounded-lg border border-border/50 overflow-hidden">
                  {isLoading ? (
                    <div className="space-y-0">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex gap-4 px-4 py-3 border-b border-border/40 animate-pulse">
                          <div className="h-4 bg-muted/50 rounded w-32" />
                          <div className="h-4 bg-muted/50 rounded w-20" />
                          <div className="h-4 bg-muted/50 rounded w-16 ml-auto" />
                        </div>
                      ))}
                    </div>
                  ) : filteredSales.length === 0 ? (
                    <EmptyState
                      icon={Ban}
                      title="Sin ventas anulables"
                      description="No hay ventas completadas en la sucursal activa."
                    />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/20 border-border/40">
                          <TableHead className="text-xs">Fecha</TableHead>
                          <TableHead className="text-xs">Cliente</TableHead>
                          <TableHead className="text-xs">Método</TableHead>
                          <TableHead className="text-xs text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSales.map((sale) => (
                          <TableRow
                            key={sale.sale_id}
                            className={`border-border/40 cursor-pointer transition-colors ${
                              selectedSale?.sale_id === sale.sale_id
                                ? 'bg-primary/10 border-l-2 border-l-primary'
                                : 'hover:bg-muted/30'
                            }`}
                            onClick={() => setSelectedSale(sale)}
                          >
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(sale.created_at).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })}
                            </TableCell>
                            <TableCell className="text-sm">{sale.customer_name ?? 'Mostrador'}</TableCell>
                            <TableCell className="text-xs">{paymentLabels[sale.payment_method] ?? sale.payment_method}</TableCell>
                            <TableCell className="text-sm font-semibold text-right">
                              Bs {Number(sale.total_amount || 0).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: void form */}
          <div className="lg:col-span-2 space-y-4">
            {/* Selected sale detail */}
            <Card className={`border-border/60 transition-all ${selectedSale ? 'border-amber-500/40 bg-amber-500/5' : ''}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Venta seleccionada</CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedSale ? (
                  <p className="text-sm text-muted-foreground">Haz clic en una venta de la lista.</p>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-md border border-border/40 bg-muted/20 px-3 py-2">
                        <p className="text-xs text-muted-foreground">Fecha</p>
                        <p className="font-medium text-xs mt-0.5">
                          {new Date(selectedSale.created_at).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      </div>
                      <div className="rounded-md border border-border/40 bg-muted/20 px-3 py-2">
                        <p className="text-xs text-muted-foreground">Método</p>
                        <p className="font-medium text-xs mt-0.5">{paymentLabels[selectedSale.payment_method] ?? selectedSale.payment_method}</p>
                      </div>
                    </div>
                    <div className="rounded-md border border-border/40 bg-muted/20 px-3 py-2">
                      <p className="text-xs text-muted-foreground">Cliente</p>
                      <p className="font-medium mt-0.5">{selectedSale.customer_name ?? 'Mostrador'}</p>
                    </div>

                    {/* Items */}
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Ítems</p>
                      <div className="space-y-1">
                        {(selectedSale.items || []).map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-sm rounded-md bg-muted/10 border border-border/30 px-3 py-1.5">
                            <span>{item.part_name}</span>
                            <span className="text-muted-foreground text-xs">{item.quantity} × Bs {Number(item.unit_price || 0).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3">
                      <p className="text-sm font-medium">Total a revertir</p>
                      <p className="font-bold text-rose-400">Bs {Number(selectedSale.total_amount || 0).toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Void form */}
            <Card className="border-rose-500/30 bg-rose-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-rose-300 flex items-center gap-2">
                  <Ban className="w-4 h-4" /> Registrar anulación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Motivo de anulación <span className="text-rose-400">*</span></Label>
                  <Input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Describe el motivo de la anulación..."
                    disabled={!canVoid || !selectedSale}
                    className="h-9"
                  />
                </div>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={voidSale}
                  disabled={!canVoid || !selectedSale || !reason.trim() || isSubmitting || isLoading}
                >
                  {isSubmitting ? 'Anulando...' : 'Anular venta seleccionada'}
                </Button>
                {!selectedSale && (
                  <p className="text-xs text-muted-foreground text-center">Selecciona una venta de la lista primero.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Unused state to satisfy effect */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmar anulación</DialogTitle></DialogHeader>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
