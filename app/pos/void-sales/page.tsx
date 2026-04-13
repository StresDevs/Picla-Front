'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { POSSubnav } from '@/components/modules/pos/pos-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ACTIVE_ROLE_EVENT, getActiveUserContext } from '@/lib/mock/runtime-store'
import { posService, type POSSaleRecord } from '@/lib/supabase/pos'

export default function POSVoidSalesPage() {
  const [sales, setSales] = useState<POSSaleRecord[]>([])
  const [activeBranchId, setActiveBranchId] = useState('branch-1')
  const [selectedSaleId, setSelectedSaleId] = useState('')
  const [reason, setReason] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const loadData = async (branchId?: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const targetBranch = branchId || getActiveUserContext().branch_id
      const data = await posService.getSales(targetBranch, true)
      const completed = data.filter((sale) => sale.status === 'completed')
      setSales(completed)
      if (!selectedSaleId && completed.length > 0) {
        setSelectedSaleId(completed[0].sale_id)
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar ventas anulables')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const syncContext = () => {
      const context = getActiveUserContext()
      setActiveBranchId(context.branch_id)
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

  const selectedSale = useMemo(
    () => sales.find((sale) => sale.sale_id === selectedSaleId) || null,
    [sales, selectedSaleId],
  )

  const voidSale = async () => {
    if (!selectedSaleId || !reason.trim()) {
      setFeedback('Selecciona una venta y escribe el motivo de anulación.')
      return
    }

    setError(null)
    setFeedback(null)
    setIsSubmitting(true)

    try {
      const result = await posService.voidSale({
        sale_id: selectedSaleId,
        reason: reason.trim(),
      })

      await loadData(activeBranchId)
      setReason('')
      setFeedback(`Venta anulada: ${result?.sale_id || selectedSaleId}`)
    } catch (voidError) {
      setError(voidError instanceof Error ? voidError.message : 'No se pudo anular la venta')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Anulación de Ventas" description="Revierte inventario y movimiento de caja de una venta" />
        <POSSubnav />

        {error ? <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</div> : null}
        {feedback ? <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{feedback}</div> : null}

        <Card className="border-rose-500/40 bg-zinc-950/70">
          <CardHeader>
            <CardTitle className="text-zinc-100">Registrar anulación</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2 md:col-span-2">
              <Label>Venta</Label>
              <Select value={selectedSaleId} onValueChange={setSelectedSaleId}>
                <SelectTrigger><SelectValue placeholder="Selecciona venta" /></SelectTrigger>
                <SelectContent>
                  {sales.map((sale) => (
                    <SelectItem key={sale.sale_id} value={sale.sale_id}>
                      {sale.sale_id} - Bs {Number(sale.total_amount || 0).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-3">
              <Label>Motivo</Label>
              <Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Detalle del motivo de anulación" />
            </div>

            <Button variant="destructive" className="md:col-span-3" onClick={voidSale} disabled={isSubmitting || isLoading}>
              Anular venta
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950/70">
          <CardHeader>
            <CardTitle className="text-zinc-100">Venta seleccionada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {!selectedSale ? (
              <p className="text-zinc-400">No hay venta seleccionada.</p>
            ) : (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3">
                <p className="font-semibold text-zinc-100">{selectedSale.sale_id}</p>
                <p className="text-zinc-400">Cliente: {selectedSale.customer_name || 'Mostrador'}</p>
                <p className="text-zinc-400">Método: {selectedSale.payment_method.toUpperCase()}</p>
                <p className="text-zinc-400">Entrega: {selectedSale.delivery_status}</p>
                <p className="text-zinc-200 font-semibold mt-1">Bs {Number(selectedSale.total_amount || 0).toFixed(2)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
