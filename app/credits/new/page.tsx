'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { CreditsSubnav } from '@/components/modules/credits/credits-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createCredit, getCustomers, getAppSettings, validateCustomerCreditLimit } from '@/lib/mock/runtime-store'
import { mockBranches } from '@/lib/mock/data'

export default function CreditsNewPage() {
  const [customers] = useState(() => getCustomers())
  const [settings] = useState(() => getAppSettings())

  const [customerId, setCustomerId] = useState('')
  const [productName, setProductName] = useState('')
  const [branchId, setBranchId] = useState(mockBranches[0]?.id || 'branch-1')
  const [sellerName, setSellerName] = useState('Usuario Demo')
  const [totalAmount, setTotalAmount] = useState('0')
  const [paidAmount, setPaidAmount] = useState('0')
  const [dueDays, setDueDays] = useState('10')
  const [reminderDate, setReminderDate] = useState('')
  const [notes, setNotes] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)

  const limitState = customerId
    ? validateCustomerCreditLimit(customerId)
    : { openCount: 0, limit: settings.max_open_credits_per_customer, blocked: false }

  const handleRegisterCredit = () => {
    setFeedback(null)

    if (!customerId) {
      setFeedback('Debes seleccionar un cliente.')
      return
    }

    if (!productName.trim()) {
      setFeedback('Debes ingresar el producto o concepto del crédito.')
      return
    }

    if (!sellerName.trim()) {
      setFeedback('Debes ingresar el vendedor responsable.')
      return
    }

    const total = Number(totalAmount)
    const paid = Number(paidAmount)
    const days = Number(dueDays)

    if (!Number.isFinite(total) || total <= 0) {
      setFeedback('El precio total debe ser mayor a 0.')
      return
    }

    if (!Number.isFinite(paid) || paid < 0) {
      setFeedback('El pago inicial no es válido.')
      return
    }

    if (!Number.isFinite(days) || days <= 0) {
      setFeedback('Los días de plazo deben ser mayores a 0.')
      return
    }

    const result = createCredit({
      customer_id: customerId,
      product_name: productName.trim(),
      branch_id: branchId,
      seller_name: sellerName.trim(),
      total_amount: total,
      paid_amount: paid,
      due_days: days,
      reminder_date: reminderDate || undefined,
      notes: notes.trim() || undefined,
    })

    if (!result.ok) {
      setFeedback(result.error)
      return
    }

    setFeedback(`Crédito ${result.credit.id} registrado correctamente.`)
    setProductName('')
    setTotalAmount('0')
    setPaidAmount('0')
    setDueDays('10')
    setReminderDate('')
    setNotes('')
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Nuevo Crédito" description="Registro de crédito con control de límite por cliente" />
        <CreditsSubnav />

        <Card>
          <CardHeader>
            <CardTitle>Formulario de crédito</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona cliente" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Producto / Concepto</Label>
              <Input value={productName} onChange={(event) => setProductName(event.target.value)} placeholder="Mercadería a crédito" />
            </div>

            <div className="space-y-2">
              <Label>Sucursal</Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mockBranches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Vendedor</Label>
              <Input value={sellerName} onChange={(event) => setSellerName(event.target.value)} placeholder="Nombre" />
            </div>

            <div className="space-y-2"><Label>Precio total</Label><Input type="number" min="0" step="0.01" value={totalAmount} onChange={(event) => setTotalAmount(event.target.value)} /></div>
            <div className="space-y-2"><Label>Pago inicial</Label><Input type="number" min="0" step="0.01" value={paidAmount} onChange={(event) => setPaidAmount(event.target.value)} /></div>
            <div className="space-y-2"><Label>Días plazo</Label><Input type="number" min="1" value={dueDays} onChange={(event) => setDueDays(event.target.value)} /></div>
            <div className="space-y-2"><Label>Fecha recordatorio</Label><Input type="date" value={reminderDate} onChange={(event) => setReminderDate(event.target.value)} /></div>
            <div className="space-y-2 md:col-span-4"><Label>Observaciones</Label><Input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Condiciones del crédito" /></div>

            <div className="md:col-span-4 rounded-lg border border-border/70 bg-muted/20 p-3 text-sm">
              <p className="font-medium">Regla de límite por cliente</p>
              <p className="text-muted-foreground">
                Créditos abiertos/vencidos del cliente: {limitState.openCount} de {limitState.limit}
              </p>
              {limitState.blocked ? (
                <p className="text-destructive mt-1">Cliente bloqueado: alcanzó o superó el límite configurado.</p>
              ) : null}
            </div>

            {feedback ? <p className="md:col-span-4 text-sm text-primary">{feedback}</p> : null}

            <Button className="md:col-span-4" onClick={handleRegisterCredit} disabled={Boolean(customerId) && limitState.blocked}>
              Registrar crédito
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
