'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { POSSubnav } from '@/components/modules/pos/pos-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/common/data-table'
import { ACTIVE_ROLE_EVENT, getActiveUserContext } from '@/lib/mock/runtime-store'
import { posService, type POSReturnRecord, type POSSaleRecord } from '@/lib/supabase/pos'

export default function POSReturnsPage() {
  const [sales, setSales] = useState<POSSaleRecord[]>([])
  const [returns, setReturns] = useState<POSReturnRecord[]>([])
  const [activeBranchId, setActiveBranchId] = useState('branch-1')

  const [selectedSaleId, setSelectedSaleId] = useState('')
  const [selectedSaleItemId, setSelectedSaleItemId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const loadData = async (branchId?: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const targetBranch = branchId || getActiveUserContext().branch_id
      const [salesData, returnsData] = await Promise.all([
        posService.getSales(targetBranch, true),
        posService.getReturns(targetBranch),
      ])

      const completedSales = salesData.filter((sale) => sale.status === 'completed')
      setSales(completedSales)
      setReturns(returnsData)

      if (!selectedSaleId && completedSales.length > 0) {
        setSelectedSaleId(completedSales[0].sale_id)
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar devoluciones')
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

  const availableItems = selectedSale?.items || []

  useEffect(() => {
    if (!selectedSale) {
      setSelectedSaleItemId('')
      return
    }

    if (!selectedSaleItemId && availableItems.length > 0) {
      setSelectedSaleItemId(availableItems[0].id)
    }
  }, [availableItems, selectedSale, selectedSaleItemId])

  const registerReturn = async () => {
    const qty = Number(quantity)
    if (!selectedSaleId || !selectedSaleItemId || !Number.isFinite(qty) || qty <= 0 || !reason.trim()) {
      setFeedback('Completa venta, ítem, cantidad y motivo.')
      return
    }

    setError(null)
    setFeedback(null)
    setIsSubmitting(true)

    try {
      const result = await posService.createReturn({
        sale_id: selectedSaleId,
        reason: reason.trim(),
        notes: notes.trim() || null,
        items: [
          {
            sale_item_id: selectedSaleItemId,
            quantity: qty,
          },
        ],
      })

      await loadData(activeBranchId)
      setQuantity('1')
      setReason('')
      setNotes('')
      setFeedback(`Devolución registrada: ${result?.return_id || 'OK'}`)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo registrar la devolución')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Devoluciones" description="Registro de devoluciones con impacto en inventario y caja" />
        <POSSubnav />

        {error ? <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</div> : null}
        {feedback ? <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{feedback}</div> : null}

        <Card>
          <CardHeader>
            <CardTitle>Nueva devolución</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Venta</label>
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Ítem de venta</label>
              <Select value={selectedSaleItemId} onValueChange={setSelectedSaleItemId}>
                <SelectTrigger><SelectValue placeholder="Selecciona ítem" /></SelectTrigger>
                <SelectContent>
                  {availableItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.part_name} (vendido {item.quantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cantidad</label>
              <Input type="number" min={1} value={quantity} onChange={(event) => setQuantity(event.target.value)} />
            </div>

            <div className="space-y-2 lg:col-span-2">
              <label className="text-sm font-medium">Motivo</label>
              <Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Motivo de devolución" />
            </div>

            <div className="space-y-2 lg:col-span-3">
              <label className="text-sm font-medium">Notas</label>
              <Input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Observaciones opcionales" />
            </div>

            <div className="lg:col-span-3 flex justify-end">
              <Button onClick={registerReturn} disabled={isSubmitting || isLoading}>Registrar devolución</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial de devoluciones</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: 'created_at', label: 'Fecha', render: (value) => new Date(String(value)).toLocaleString() },
                { key: 'return_id', label: 'ID', render: (value) => String(value) },
                { key: 'sale_id', label: 'Venta', render: (value) => String(value) },
                { key: 'reason', label: 'Motivo', render: (value) => String(value) },
                { key: 'total_return_amount', label: 'Monto', render: (value) => `Bs ${Number(value || 0).toFixed(2)}` },
                { key: 'status', label: 'Estado', render: (value) => String(value) },
              ]}
              data={returns}
              emptyMessage={isLoading ? 'Cargando devoluciones...' : 'No hay devoluciones registradas'}
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
