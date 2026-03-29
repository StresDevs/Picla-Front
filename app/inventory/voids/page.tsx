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
import { applyTransferAction, getTransfers } from '@/lib/mock/runtime-store'
import { mockBranches } from '@/lib/mock/data'

export default function InventoryVoidsPage() {
  const [transfers, setTransfers] = useState(getTransfers())
  const [selectedTransferId, setSelectedTransferId] = useState('')
  const [actionType, setActionType] = useState<'anulacion' | 'devolucion' | 'reposicion'>('anulacion')
  const [reason, setReason] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    const current = getTransfers()
    setTransfers(current)
    if (current.length > 0) {
      setSelectedTransferId(current[0].id)
    }
  }, [])

  const actionableTransfers = useMemo(
    () => transfers.filter((item) => item.status === 'completed'),
    [transfers]
  )

  const applyAction = () => {
    if (!selectedTransferId || !reason.trim()) {
      setFeedback('Debes seleccionar un traspaso y registrar un motivo.')
      return
    }

    const result = applyTransferAction({
      transferId: selectedTransferId,
      actionType,
      reason: reason.trim(),
      userName: 'Usuario Demo',
    })

    if (!result.ok) {
      setFeedback(result.error)
      return
    }

    setTransfers(getTransfers())
    setReason('')
    setFeedback(`Operacion ${actionType} registrada correctamente.`)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Anulaciones, Devoluciones y Reposiciones"
          description="Aplica acciones sobre traspasos registrados dejando motivo obligatorio"
        />
        <InventorySubnav />

        <Card className="border-rose-500/35">
          <CardHeader>
            <CardTitle>Centro de acciones</CardTitle>
            <CardDescription>
              Selecciona el traspaso, tipo de operacion y motivo para registrar la trazabilidad.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Traspaso objetivo</Label>
                <Select value={selectedTransferId || 'none'} onValueChange={(value) => setSelectedTransferId(value === 'none' ? '' : value)}>
                  <SelectTrigger><SelectValue placeholder="Selecciona traspaso" /></SelectTrigger>
                  <SelectContent>
                    {actionableTransfers.length === 0 ? (
                      <SelectItem value="none" disabled>No hay traspasos disponibles</SelectItem>
                    ) : (
                      actionableTransfers.map((transfer) => (
                        <SelectItem key={transfer.id} value={transfer.id}>
                          {transfer.id} | {transfer.part_name} | {transfer.quantity}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Operacion</Label>
                <Select value={actionType} onValueChange={(value: 'anulacion' | 'devolucion' | 'reposicion') => setActionType(value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anulacion">Anulacion</SelectItem>
                    <SelectItem value="devolucion">Devolucion</SelectItem>
                    <SelectItem value="reposicion">Reposicion</SelectItem>
                  </SelectContent>
                </Select>
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

            {feedback ? (
              <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm">
                {feedback}
              </div>
            ) : null}

            <div className="flex justify-end">
              <Button onClick={applyAction} disabled={!selectedTransferId || !reason.trim()}>
                Registrar operacion
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Traspasos registrados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {transfers.map((item) => (
              <div key={item.id} className="rounded-lg border border-border/70 bg-card/75 p-3 text-sm space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{item.id} - {item.part_name}</p>
                  <Badge
                    className={
                      item.status === 'completed'
                        ? 'bg-emerald-600 text-white'
                        : item.status === 'anulled'
                        ? 'bg-rose-600 text-white'
                        : item.status === 'returned'
                        ? 'bg-amber-600 text-white'
                        : 'bg-sky-600 text-white'
                    }
                  >
                    {item.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  {mockBranches.find((branch) => branch.id === item.from_branch_id)?.name ?? item.from_branch_id}
                  {' -> '}
                  {mockBranches.find((branch) => branch.id === item.to_branch_id)?.name ?? item.to_branch_id}
                </p>
                <p className="text-muted-foreground">Cantidad: {item.quantity} | Categoria: {item.category}</p>
                <p className="text-muted-foreground">Motivo traspaso: {item.notes || 'Sin detalle'}</p>
                {item.resolution_reason ? (
                  <p className="text-foreground">Motivo accion: {item.resolution_reason}</p>
                ) : null}
                {item.status === 'completed' ? (
                  <div className="pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTransferId(item.id)}
                    >
                      Seleccionar para accion
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
