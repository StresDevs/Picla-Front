'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { InventorySubnav } from '@/components/modules/inventory/inventory-subnav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { branchesService, transferService, type TransferRequestDetail } from '@/lib/supabase/inventory'

function transferStatusLabel(status: string) {
  switch (status) {
    case 'pending':
      return 'pendiente'
    case 'completed':
      return 'completado'
    case 'anulled':
      return 'anulado'
    case 'returned':
      return 'devuelto'
    case 'replenished':
      return 'repuesto'
    default:
      return status
  }
}

function formatTransferDate(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('es-BO', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function formatTransferOptionLabel(
  transfer: TransferRequestDetail,
  branches: Array<{ id: string; name: string }>,
) {
  const fromName = branches.find((branch) => branch.id === transfer.from_branch_id)?.name ?? transfer.from_branch_id
  const toName = branches.find((branch) => branch.id === transfer.to_branch_id)?.name ?? transfer.to_branch_id
  const totalQuantity = transfer.items.reduce((acc, item) => acc + Number(item.quantity || 0), 0)
  const shortId = transfer.id.slice(0, 8)
  const productsPreview = transfer.items
    .slice(0, 2)
    .map((item) => item.part_name)
    .join(', ')

  return `#${shortId} | ${fromName} -> ${toName} | ${totalQuantity} und | ${formatTransferDate(transfer.requested_at)}${productsPreview ? ` | ${productsPreview}${transfer.items.length > 2 ? '...' : ''}` : ''}`
}

export default function InventoryVoidsPage() {
  const [transfers, setTransfers] = useState<TransferRequestDetail[]>([])
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([])
  const [selectedTransferId, setSelectedTransferId] = useState('')
  const [actionType, setActionType] = useState<'anulacion' | 'devolucion' | 'reposicion'>('anulacion')
  const [reason, setReason] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const loadData = async () => {
    const [transferRows, branchRows] = await Promise.all([
      transferService.getRequests(),
      branchesService.getAll(),
    ])
    setTransfers(transferRows)
    setBranches(branchRows)
  }

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true)
      setError(null)
      try {
        await loadData()
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar traspasos')
      } finally {
        setIsLoading(false)
      }
    }

    void initialize()
  }, [])

  // Cada accion aplica sobre un estado distinto:
  //   anulacion  -> pendiente  (libera la reserva, no mueve stock)
  //   devolucion -> completado (devuelve el stock al origen)
  //   reposicion -> devuelto   (lo vuelve a enviar)
  // Antes las tres se ofrecian sobre traspasos completados: anular no hacia nada
  // y reponer mandaba el stock por segunda vez.
  const actionableStatus: Record<typeof actionType, TransferRequestDetail['status']> = {
    anulacion: 'pending',
    devolucion: 'completed',
    reposicion: 'returned',
  }

  const actionableTransfers = useMemo(
    () => transfers.filter((item) => item.status === actionableStatus[actionType]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [transfers, actionType]
  )

  useEffect(() => {
    if (actionableTransfers.some((item) => item.id === selectedTransferId)) return
    setSelectedTransferId(actionableTransfers[0]?.id ?? '')
  }, [actionableTransfers, selectedTransferId])

  const selectedTransfer = useMemo(
    () => transfers.find((item) => item.id === selectedTransferId) ?? null,
    [transfers, selectedTransferId]
  )

  const confirmationMessage = useMemo(() => {
    if (!selectedTransfer) return ''
    const fromName = branches.find((branch) => branch.id === selectedTransfer.from_branch_id)?.name ?? selectedTransfer.from_branch_id
    const toName = branches.find((branch) => branch.id === selectedTransfer.to_branch_id)?.name ?? selectedTransfer.to_branch_id

    if (actionType === 'anulacion') {
      return `Se cancelará el traspaso pendiente y las unidades reservadas volverán a estar disponibles en ${fromName}. No se mueve stock.`
    }
    if (actionType === 'reposicion') {
      return `Se volverá a MOVER el stock: se descontará de ${fromName} y se sumará otra vez a ${toName}. Úsalo solo si el traspaso fue devuelto y hay que reenviarlo.`
    }
    return `Se devolverá el stock a la sucursal de origen (${fromName}) y se descontará de la sucursal de destino (${toName}).`
  }, [selectedTransfer, branches, actionType])

  const confirmationHint =
    actionType === 'anulacion'
      ? 'Cancela un traspaso que todavía no se completó y libera la reserva.'
      : actionType === 'devolucion'
      ? 'Regresa a origen el stock de un traspaso ya completado.'
      : 'Vuelve a enviar un traspaso que fue devuelto. Mueve stock otra vez.'

  const emptyActionHint =
    actionType === 'anulacion'
      ? 'No hay traspasos pendientes para anular.'
      : actionType === 'devolucion'
      ? 'No hay traspasos completados para devolver.'
      : 'No hay traspasos devueltos. Para reponer un traspaso, primero registra su devolución.'

  const requestApplyAction = () => {
    if (!selectedTransferId || !reason.trim()) {
      setFeedback('Debes seleccionar un traspaso y registrar un motivo.')
      return
    }

    setIsConfirmOpen(true)
  }

  const applyAction = async () => {
    setIsConfirmOpen(false)
    setIsSaving(true)
    setError(null)
    setFeedback(null)

    try {
      await transferService.applyResolution(selectedTransferId, actionType, reason.trim())
      await loadData()
      setReason('')
      setFeedback(`Operacion ${actionType} registrada correctamente.`)
    } catch (applyError) {
      setError(applyError instanceof Error ? applyError.message : 'No se pudo aplicar la operacion')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Anulaciones, Devoluciones y Reposiciones"
          description="Aplica acciones sobre traspasos registrados dejando motivo obligatorio"
        />
        <InventorySubnav />

        {error ? (
          <Card className="border-red-500/40 bg-red-500/5">
            <CardContent className="pt-6 text-sm text-red-700 dark:text-red-300">{error}</CardContent>
          </Card>
        ) : null}

        <Card className="border-rose-500/35">
          <CardHeader>
            <CardTitle>Centro de acciones</CardTitle>
            <CardDescription>
              Selecciona el traspaso, tipo de operación y motivo para registrar la trazabilidad.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Traspaso objetivo</Label>
                <Select value={selectedTransferId || 'none'} onValueChange={(value) => setSelectedTransferId(value === 'none' ? '' : value)}>
                  <SelectTrigger className="h-auto min-h-9 w-full min-w-0 items-start whitespace-normal *:data-[slot=select-value]:max-w-full *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:flex-1 *:data-[slot=select-value]:whitespace-normal *:data-[slot=select-value]:break-words *:data-[slot=select-value]:text-left">
                    <SelectValue placeholder="Selecciona traspaso" />
                  </SelectTrigger>
                  <SelectContent>
                    {actionableTransfers.length === 0 ? (
                      <SelectItem value="none" disabled>{emptyActionHint}</SelectItem>
                    ) : (
                      actionableTransfers.map((transfer) => (
                        <SelectItem key={transfer.id} value={transfer.id}>
                          {formatTransferOptionLabel(transfer, branches)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {actionableTransfers.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{emptyActionHint}</p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Operación</Label>
                  <Select value={actionType} onValueChange={(value: 'anulacion' | 'devolucion' | 'reposicion') => setActionType(value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anulacion">Anulación (traspaso pendiente)</SelectItem>
                      <SelectItem value="devolucion">Devolución (traspaso completado)</SelectItem>
                      <SelectItem value="reposicion">Reposición (traspaso devuelto)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{confirmationHint}</p>
                </div>

                <div className="space-y-2">
                  <Label>Motivo</Label>
                  <Input
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Ej. Error de picking en bodega"
                  />
                </div>
              </div>
            </div>

            {feedback ? (
              <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm">
                {feedback}
              </div>
            ) : null}

            <div className="flex justify-end">
              <Button onClick={requestApplyAction} disabled={!selectedTransferId || !reason.trim() || isSaving}>
                Registrar operación
              </Button>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar operación</DialogTitle>
              <DialogDescription>{confirmationMessage}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConfirmOpen(false)} disabled={isSaving}>
                Cancelar
              </Button>
              <Button onClick={() => void applyAction()} disabled={isSaving}>
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>Traspasos registrados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {transfers.map((item) => (
              <div key={item.id} className="rounded-lg border border-border/70 bg-card/75 p-3 text-sm space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{item.id} - {item.items.length} productos</p>
                  <Badge
                    className={
                      item.status === 'pending'
                        ? 'bg-amber-500 text-black'
                        :
                      item.status === 'completed'
                        ? 'bg-emerald-600 text-white'
                        : item.status === 'anulled'
                        ? 'bg-rose-600 text-white'
                        : item.status === 'returned'
                        ? 'bg-amber-600 text-white'
                        : 'bg-sky-600 text-white'
                    }
                  >
                    {transferStatusLabel(item.status)}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  {branches.find((branch) => branch.id === item.from_branch_id)?.name ?? item.from_branch_id}
                  {' -> '}
                  {branches.find((branch) => branch.id === item.to_branch_id)?.name ?? item.to_branch_id}
                </p>
                <p className="text-muted-foreground">
                  Cantidad total: {item.items.reduce((acc, transferItem) => acc + Number(transferItem.quantity || 0), 0)}
                </p>
                <p className="text-muted-foreground">
                  Productos: {item.items.slice(0, 2).map((transferItem) => transferItem.part_name).join(', ')}{item.items.length > 2 ? '...' : ''}
                </p>
                <p className="text-muted-foreground">Motivo traspaso: {item.notes || 'Sin detalle'}</p>
                {item.resolution_reason || item.resolution_type ? (
                  <p className="text-foreground">Motivo acción: {item.resolution_reason || item.resolution_type}</p>
                ) : null}
                {item.status === 'completed' ? (
                  <div className="pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTransferId(item.id)}
                    >
                      Seleccionar para acción
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
