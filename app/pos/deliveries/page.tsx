'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { POSSubnav } from '@/components/modules/pos/pos-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ACTIVE_ROLE_EVENT, getActiveUserContext } from '@/lib/mock/runtime-store'
import { posService, type POSPendingDelivery } from '@/lib/supabase/pos'

export default function POSDeliveriesPage() {
  const [pendingDeliveries, setPendingDeliveries] = useState<POSPendingDelivery[]>([])
  const [activeBranchId, setActiveBranchId] = useState('branch-1')

  const [selectedSaleId, setSelectedSaleId] = useState('')
  const [selectedSaleItemId, setSelectedSaleItemId] = useState('')
  const [deliverQty, setDeliverQty] = useState('1')
  const [notes, setNotes] = useState('')

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const loadData = async (branchId?: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const targetBranch = branchId || getActiveUserContext().branch_id
      const data = await posService.getPendingDeliveries(targetBranch)
      setPendingDeliveries(data)

      if (!selectedSaleId && data.length > 0) {
        setSelectedSaleId(data[0].sale_id)
      }
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

  const selectedDelivery = useMemo(
    () => pendingDeliveries.find((item) => item.sale_id === selectedSaleId) || null,
    [pendingDeliveries, selectedSaleId],
  )

  const pendingItems = selectedDelivery?.items.filter((item) => Number(item.quantity || 0) > Number(item.delivered_quantity || 0)) || []

  useEffect(() => {
    if (!selectedDelivery) {
      setSelectedSaleItemId('')
      return
    }

    if (!selectedSaleItemId && pendingItems.length > 0) {
      setSelectedSaleItemId(pendingItems[0].sale_item_id)
    }
  }, [pendingItems, selectedDelivery, selectedSaleItemId])

  const registerDelivery = async () => {
    const qty = Number(deliverQty)
    if (!selectedSaleId || !selectedSaleItemId || !Number.isFinite(qty) || qty <= 0) {
      setFeedback('Selecciona venta, ítem y cantidad válida para entregar.')
      return
    }

    setError(null)
    setFeedback(null)
    setIsSubmitting(true)

    try {
      const result = await posService.registerDelivery({
        sale_id: selectedSaleId,
        notes: notes.trim() || null,
        items: [
          {
            sale_item_id: selectedSaleItemId,
            quantity: qty,
          },
        ],
      })

      await loadData(activeBranchId)
      setDeliverQty('1')
      setNotes('')
      setFeedback(`Entrega registrada (${result?.delivery_status || 'OK'}).`)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo registrar la entrega')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Mercadería por Entregar" description="Gestiona entregas parciales y finales de ventas pendientes" />
        <POSSubnav />

        {error ? <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</div> : null}
        {feedback ? <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{feedback}</div> : null}

        <Card>
          <CardHeader>
            <CardTitle>Registrar entrega</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-2 lg:col-span-2">
              <label className="text-sm font-medium">Venta pendiente</label>
              <Select value={selectedSaleId} onValueChange={setSelectedSaleId}>
                <SelectTrigger><SelectValue placeholder="Selecciona venta" /></SelectTrigger>
                <SelectContent>
                  {pendingDeliveries.map((delivery) => (
                    <SelectItem key={delivery.sale_id} value={delivery.sale_id}>
                      {delivery.sale_id} - {delivery.customer_name || 'Mostrador'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 lg:col-span-2">
              <label className="text-sm font-medium">Ítem pendiente</label>
              <Select value={selectedSaleItemId} onValueChange={setSelectedSaleItemId}>
                <SelectTrigger><SelectValue placeholder="Selecciona ítem" /></SelectTrigger>
                <SelectContent>
                  {pendingItems.map((item) => (
                    <SelectItem key={item.sale_item_id} value={item.sale_item_id}>
                      {item.part_name} ({Number(item.delivered_quantity || 0)}/{Number(item.quantity || 0)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cantidad a entregar</label>
              <Input type="number" min={1} value={deliverQty} onChange={(event) => setDeliverQty(event.target.value)} />
            </div>

            <div className="space-y-2 lg:col-span-3">
              <label className="text-sm font-medium">Notas</label>
              <Input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Observaciones de la entrega" />
            </div>

            <div className="lg:col-span-4 flex justify-end">
              <Button onClick={registerDelivery} disabled={isSubmitting || isLoading}>Marcar entrega</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950/70 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Lista de pendientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-zinc-400">Cargando entregas pendientes...</p>
            ) : pendingDeliveries.length === 0 ? (
              <p className="text-sm text-zinc-400">No hay ventas pendientes por entregar en esta sucursal.</p>
            ) : (
              pendingDeliveries.map((delivery) => (
                <div key={delivery.sale_id} className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-sm">
                  <p className="font-semibold text-zinc-100">{delivery.sale_id} - {delivery.customer_name || 'Mostrador'}</p>
                  <p className="text-zinc-400">Total: Bs {Number(delivery.total_amount || 0).toFixed(2)} | Saldo: Bs {Number(delivery.pending_amount || 0).toFixed(2)}</p>
                  <p className="text-zinc-400">Estado: {delivery.delivery_status}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
