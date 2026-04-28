'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { CreditsSubnav } from '@/components/modules/credits/credits-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { creditsService, type CreditSettings, type CreditLimitState } from '@/lib/supabase/credits'
import { customersService, type CustomerRecord } from '@/lib/supabase/customers'
import { branchesService } from '@/lib/supabase/inventory'
import { ACTIVE_ROLE_EVENT, getActiveUserContext, type AppUserRole } from '@/lib/mock/runtime-store'

interface BranchOption {
  id: string
  name: string
}

const emptyLimit: CreditLimitState = {
  openCount: 0,
  limit: 0,
  blocked: false,
}

export default function CreditsNewPage() {
  const [activeRole, setActiveRole] = useState<AppUserRole>(() => getActiveUserContext().role)
  const [activeBranchId, setActiveBranchId] = useState(() => getActiveUserContext().branch_id)

  const [branches, setBranches] = useState<BranchOption[]>([])
  const [customers, setCustomers] = useState<CustomerRecord[]>([])
  const [settings, setSettings] = useState<CreditSettings | null>(null)

  const [saleId, setSaleId] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [productName, setProductName] = useState('')
  const [branchId, setBranchId] = useState(activeBranchId)
  const [sellerName, setSellerName] = useState(getActiveUserContext().user_name || '')
  const [totalAmount, setTotalAmount] = useState('0')
  const [paidAmount, setPaidAmount] = useState('0')
  const [dueDays, setDueDays] = useState('10')
  const [reminderDate, setReminderDate] = useState('')
  const [notes, setNotes] = useState('')

  const [limitState, setLimitState] = useState<CreditLimitState>(emptyLimit)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const canSelectBranch = activeRole === 'admin'

  const normalizedBranchId = useMemo(() => branchId || activeBranchId, [branchId, activeBranchId])

  useEffect(() => {
    const syncContext = () => {
      const context = getActiveUserContext()
      setActiveRole(context.role)
      setActiveBranchId(context.branch_id)
      setBranchId((prev) => prev || context.branch_id)
      setSellerName((prev) => prev || context.user_name)
    }

    const initialize = async () => {
      setIsLoading(true)
      setError(null)
      try {
        syncContext()
        const [branchRows, settingsRow] = await Promise.all([
          branchesService.getAll(),
          creditsService.getSettings(),
        ])

        setBranches(branchRows)
        setSettings(settingsRow)

        const context = getActiveUserContext()
        const defaultBranch = context.branch_id || branchRows[0]?.id || ''
        setBranchId((prev) => prev || defaultBranch)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar datos de crédito')
      } finally {
        setIsLoading(false)
      }
    }

    void initialize()
    window.addEventListener(ACTIVE_ROLE_EVENT, syncContext)

    return () => {
      window.removeEventListener(ACTIVE_ROLE_EVENT, syncContext)
    }
  }, [])

  useEffect(() => {
    const loadCustomers = async () => {
      if (!normalizedBranchId) return
      setError(null)
      try {
        const rows = await customersService.getList({
          branch_id: normalizedBranchId || null,
          search: null,
          include_inactive: false,
        })
        setCustomers(rows)
        setCustomerId((prev) => (prev && rows.some((item) => item.id === prev) ? prev : rows[0]?.id || ''))
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar clientes')
      }
    }

    void loadCustomers()
  }, [normalizedBranchId, canSelectBranch])

  useEffect(() => {
    let isActive = true

    const loadLimit = async () => {
      if (!customerId) {
        setLimitState({
          openCount: 0,
          limit: settings?.max_open_credits_per_customer ?? 0,
          blocked: false,
        })
        return
      }

      try {
        const result = await creditsService.validateCustomerLimit({
          customer_id: customerId,
          branch_id: normalizedBranchId || null,
        })
        if (isActive) {
          setLimitState(result)
        }
      } catch (loadError) {
        if (isActive) {
          setLimitState({
            openCount: 0,
            limit: settings?.max_open_credits_per_customer ?? 0,
            blocked: false,
          })
          setError(loadError instanceof Error ? loadError.message : 'No se pudo validar el límite de crédito')
        }
      }
    }

    void loadLimit()

    return () => {
      isActive = false
    }
  }, [customerId, normalizedBranchId, settings?.max_open_credits_per_customer])

  const handleRegisterCredit = async () => {
    setFeedback(null)
    setError(null)

    if (!saleId.trim()) {
      setFeedback('Debes ingresar el ID de la venta asociada.')
      return
    }

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

    if (paid > total) {
      setFeedback('El pago inicial no puede superar el total.')
      return
    }

    if (!Number.isFinite(days) || days <= 0) {
      setFeedback('Los días de plazo deben ser mayores a 0.')
      return
    }

    if (!normalizedBranchId) {
      setFeedback('Debes seleccionar una sucursal válida.')
      return
    }

    setIsSaving(true)
    try {
      const creditId = await creditsService.create({
        sale_id: saleId.trim(),
        customer_id: customerId,
        product_name: productName.trim(),
        branch_id: normalizedBranchId,
        seller_name: sellerName.trim(),
        total_amount: total,
        paid_amount: paid,
        due_days: days,
        reminder_date: reminderDate || null,
        notes: notes.trim() || null,
      })

      setFeedback(`Crédito ${creditId} registrado correctamente.`)
      setSaleId('')
      setProductName('')
      setTotalAmount('0')
      setPaidAmount('0')
      setDueDays('10')
      setReminderDate('')
      setNotes('')
    } catch (saveError) {
      setFeedback(saveError instanceof Error ? saveError.message : 'No se pudo registrar el crédito')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-8"></div>
        </div>
      </MainLayout>
    )
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
              <Label>Venta asociada</Label>
              <Input value={saleId} onChange={(event) => setSaleId(event.target.value)} placeholder="ID de venta" />
            </div>

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
              <Select value={normalizedBranchId} onValueChange={setBranchId} disabled={!canSelectBranch}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
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

            <div className="space-y-2">
              <Label>Precio total</Label>
              <Input type="number" min="0" step="0.01" value={totalAmount} onChange={(event) => setTotalAmount(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Pago inicial</Label>
              <Input type="number" min="0" step="0.01" value={paidAmount} onChange={(event) => setPaidAmount(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Días plazo</Label>
              <Input type="number" min="1" value={dueDays} onChange={(event) => setDueDays(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fecha recordatorio</Label>
              <Input type="date" value={reminderDate} onChange={(event) => setReminderDate(event.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-4">
              <Label>Observaciones</Label>
              <Input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Condiciones del crédito" />
            </div>

            <div className="md:col-span-4 rounded-lg border border-border/70 bg-muted/20 p-3 text-sm">
              <p className="font-medium">Regla de límite por cliente</p>
              <p className="text-muted-foreground">
                Créditos abiertos/vencidos del cliente: {limitState.openCount} de {limitState.limit}
              </p>
              {limitState.blocked ? (
                <p className="text-destructive mt-1">Cliente bloqueado: alcanzó o superó el límite configurado.</p>
              ) : null}
            </div>

            {error ? <p className="md:col-span-4 text-sm text-destructive">{error}</p> : null}
            {feedback ? <p className="md:col-span-4 text-sm text-primary">{feedback}</p> : null}

            <Button className="md:col-span-4" onClick={handleRegisterCredit} disabled={isSaving || (Boolean(customerId) && limitState.blocked)}>
              {isSaving ? 'Registrando...' : 'Registrar crédito'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
