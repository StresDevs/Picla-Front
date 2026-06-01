'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { POSSubnav } from '@/components/modules/pos/pos-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/common/data-table'
import { ACTIVE_ROLE_EVENT, getActiveUserContext } from '@/lib/mock/runtime-store'
import { posService, type POSReturnRecord, type POSSaleRecord } from '@/lib/supabase/pos'
import { SearchableStringPick } from '@/components/modules/inventory/part-combobox'

export default function POSReturnsPage() {
  const [sales, setSales] = useState<POSSaleRecord[]>([])
  const [returns, setReturns] = useState<POSReturnRecord[]>([])
  const [activeBranchId, setActiveBranchId] = useState('branch-1')

  const [selectedSaleId, setSelectedSaleId] = useState('')
  const [returnItemsMap, setReturnItemsMap] = useState<Record<string, { checked: boolean; qty: string }>>({})
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectedSale = useMemo(
    () => sales.find((sale) => sale.sale_id === selectedSaleId) || null,
    [sales, selectedSaleId],
  )

  useEffect(() => {
    if (!selectedSale) {
      setReturnItemsMap({})
      return
    }
    const map: Record<string, { checked: boolean; qty: string }> = {}
    for (const item of (selectedSale.items || [])) {
      map[item.id] = { checked: false, qty: String(item.quantity) }
    }
    setReturnItemsMap(map)
  }, [selectedSale])

  const saleDisplayMap = useMemo(() => {
    const map = new Map<string, string>()
    sales.forEach((sale) => {
      const date = new Date(sale.created_at).toLocaleDateString('es-BO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
      const customer = sale.customer_name || 'Mostrador'
      map.set(sale.sale_id, `${customer} · ${date} · Bs ${Number(sale.total_amount || 0).toFixed(2)}`)
    })
    return map
  }, [sales])

  const registerReturn = async () => {
    const checkedItems = Object.entries(returnItemsMap)
      .filter(([, v]) => v.checked && Number(v.qty) > 0)
      .map(([id, v]) => ({ sale_item_id: id, quantity: Number(v.qty) }))

    if (!selectedSaleId || checkedItems.length === 0 || !reason.trim()) {
      setFeedback('Selecciona una venta, marca al menos un ítem y escribe el motivo.')
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
        items: checkedItems,
      })

      await loadData(activeBranchId)
      setReason('')
      setNotes('')
      setFeedback(`Devolución registrada: DEV-${result?.return_id?.slice(0, 8) ?? 'OK'}`)
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
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Venta a devolver</label>
              <SearchableStringPick
                value={selectedSaleId}
                onValueChange={setSelectedSaleId}
                options={sales.map((sale) => ({
                  value: sale.sale_id,
                  label: saleDisplayMap.get(sale.sale_id) ?? sale.sale_id,
                }))}
                placeholder="Selecciona una venta..."
                searchPlaceholder="Buscar por cliente, fecha..."
              />
            </div>

            {selectedSale && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Productos a devolver
                  <span className="ml-1 text-xs text-muted-foreground font-normal">
                    — marca los que se devuelven e ingresa la cantidad
                  </span>
                </label>
                {(selectedSale.items || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground rounded-lg border border-border/60 p-3">
                    Esta venta no tiene ítems disponibles para devolución.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {(selectedSale.items || []).map((item) => {
                      const entry = returnItemsMap[item.id] ?? { checked: false, qty: String(item.quantity) }
                      return (
                        <label
                          key={item.id}
                          className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                            entry.checked
                              ? 'border-primary/40 bg-primary/5'
                              : 'border-border/60 bg-muted/20 hover:border-border'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 shrink-0"
                            checked={entry.checked}
                            onChange={(e) =>
                              setReturnItemsMap((prev) => ({
                                ...prev,
                                [item.id]: { ...prev[item.id], checked: e.target.checked },
                              }))
                            }
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.part_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Vendido: {Number(item.quantity)} · Bs {Number(item.unit_price || 0).toFixed(2)} c/u
                            </p>
                          </div>
                          <div className="shrink-0 flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Cant.:</span>
                            <Input
                              type="number"
                              min={1}
                              max={Number(item.quantity)}
                              value={entry.qty}
                              disabled={!entry.checked}
                              className="w-20 h-8 text-center"
                              onClick={(e) => e.preventDefault()}
                              onChange={(e) =>
                                setReturnItemsMap((prev) => ({
                                  ...prev,
                                  [item.id]: { ...prev[item.id], qty: e.target.value },
                                }))
                              }
                            />
                          </div>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Motivo <span className="text-rose-400">*</span>
              </label>
              <Input
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Motivo de la devolución (requerido)"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notas</label>
              <Input
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Observaciones opcionales"
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={registerReturn} disabled={isSubmitting || isLoading}>
                {isSubmitting ? 'Registrando...' : 'Registrar devolución'}
              </Button>
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
                {
                  key: 'created_at',
                  label: 'Fecha',
                  render: (value) =>
                    new Date(String(value)).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' }),
                },
                {
                  key: 'return_id',
                  label: 'ID Dev.',
                  render: (value) => `DEV-${String(value).slice(0, 8)}`,
                },
                {
                  key: 'sale_id',
                  label: 'Venta',
                  render: (value) =>
                    saleDisplayMap.get(String(value)) ?? `...${String(value).slice(-8)}`,
                },
                { key: 'reason', label: 'Motivo', render: (value) => String(value) },
                {
                  key: 'total_return_amount',
                  label: 'Monto dev.',
                  render: (value) => `Bs ${Number(value || 0).toFixed(2)}`,
                },
                {
                  key: 'status',
                  label: 'Estado',
                  render: (value) => (String(value) === 'completed' ? 'Completada' : String(value)),
                },
              ]}
              data={returns.map((r) => ({ ...r, id: r.return_id }))}
              emptyMessage={isLoading ? 'Cargando devoluciones...' : 'No hay devoluciones registradas'}
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
