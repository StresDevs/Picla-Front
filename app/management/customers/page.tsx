'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/common/data-table'
import { PageHeader } from '@/components/common/page-header'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ManagementSubnav } from '@/components/modules/management/management-subnav'
import { customersService, type CustomerRecord } from '@/lib/supabase/customers'
import { Badge } from '@/components/ui/badge'
import { showConfirmAlert } from '@/lib/sweet-alert'

interface CustomerFormData {
  fullName: string
  email: string
  phone: string
  nitCi: string
  isActive: boolean
}

function extractErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object') {
    const candidate = error as {
      message?: unknown
      details?: unknown
      hint?: unknown
      code?: unknown
    }

    const message = typeof candidate.message === 'string' ? candidate.message.trim() : ''
    const details = typeof candidate.details === 'string' ? candidate.details.trim() : ''
    const hint = typeof candidate.hint === 'string' ? candidate.hint.trim() : ''
    const code = typeof candidate.code === 'string' ? candidate.code.trim() : ''

    const parts = [message, details, hint].filter((part) => part.length > 0)
    if (parts.length > 0) {
      return parts.join(' | ')
    }

    if (code.length > 0) return code
  }

  if (error instanceof Error && error.message) return error.message
  return fallback
}

const emptyCustomerForm: CustomerFormData = {
  fullName: '',
  email: '',
  phone: '',
  nitCi: '',
  isActive: true,
}

export default function ManagementCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [includeInactive, setIncludeInactive] = useState(true)
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null)
  const [customerForm, setCustomerForm] = useState<CustomerFormData>(emptyCustomerForm)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [dialogFeedback, setDialogFeedback] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const loadCustomers = async () => {
    setIsLoading(true)
    setFeedback(null)

    try {
      const rows = await customersService.getList({
        search: searchTerm.trim() || null,
        include_inactive: includeInactive,
      })
      setCustomers(rows)
    } catch (loadError) {
      setFeedback(extractErrorMessage(loadError, 'No se pudo cargar la lista de clientes'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadCustomers()
  }, [includeInactive])

  const handleSaveCustomer = async () => {
    setDialogFeedback(null)
    setFeedback(null)

    const fullName = customerForm.fullName.trim()
    const nitCi = customerForm.nitCi.trim()

    if (!fullName || !nitCi) {
      setDialogFeedback('Completa nombre y NIT/CI para continuar.')
      return
    }

    setIsSubmitting(true)

    try {
      if (editingCustomerId) {
        await customersService.update({
          customer_id: editingCustomerId,
          full_name: fullName,
          nit_ci: nitCi,
          phone: customerForm.phone.trim() || null,
          email: customerForm.email.trim() || null,
          is_active: customerForm.isActive,
        })
        setFeedback('Cliente actualizado correctamente.')
      } else {
        await customersService.create({
          full_name: fullName,
          nit_ci: nitCi,
          phone: customerForm.phone.trim() || null,
          email: customerForm.email.trim() || null,
        })
        setFeedback('Cliente creado correctamente.')
      }

      setCustomerForm(emptyCustomerForm)
      setEditingCustomerId(null)
      setDialogFeedback(null)
      setIsDialogOpen(false)
      await loadCustomers()
    } catch (saveError) {
      setDialogFeedback(extractErrorMessage(saveError, 'No se pudo guardar el cliente'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirmAlert({
      text: 'Se inactivara el cliente seleccionado. Esta accion se puede revertir editando el cliente.',
      confirmButtonText: 'Si, inactivar',
    })

    if (!confirmed) return

    setFeedback(null)
    setIsSubmitting(true)

    try {
      await customersService.remove({ customer_id: id, soft_delete: true })
      setFeedback('Cliente inactivado correctamente.')
      await loadCustomers()
    } catch (deleteError) {
      setFeedback(extractErrorMessage(deleteError, 'No se pudo inactivar el cliente'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Gestión - Clientes" description="Administración de cartera de clientes" />
        <ManagementSubnav />

        {feedback ? (
          <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
            {feedback}
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Clientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex w-full gap-2 md:max-w-lg">
                <Input
                  placeholder="Buscar por nombre, NIT/CI, teléfono o email"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
                <Button variant="outline" onClick={() => void loadCustomers()} disabled={isLoading}>
                  Buscar
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={includeInactive ? 'default' : 'outline'}
                  onClick={() => setIncludeInactive((previous) => !previous)}
                >
                  {includeInactive ? 'Mostrando inactivos' : 'Ocultar inactivos'}
                </Button>
                <Button
                  onClick={() => {
                    setEditingCustomerId(null)
                    setCustomerForm(emptyCustomerForm)
                    setDialogFeedback(null)
                    setIsDialogOpen(true)
                  }}
                >
                  Nuevo Cliente
                </Button>
              </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingCustomerId ? 'Editar' : 'Nuevo'} Cliente</DialogTitle>
                    <DialogDescription>Registra información del cliente</DialogDescription>
                  </DialogHeader>

                  {dialogFeedback ? (
                    <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                      {dialogFeedback}
                    </div>
                  ) : null}

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Nombre Completo</label>
                      <Input value={customerForm.fullName} onChange={(e) => setCustomerForm((prev) => ({ ...prev, fullName: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">NIT/CI</label>
                      <Input value={customerForm.nitCi} onChange={(e) => setCustomerForm((prev) => ({ ...prev, nitCi: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Teléfono</label>
                      <Input value={customerForm.phone} onChange={(e) => setCustomerForm((prev) => ({ ...prev, phone: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <Input type="email" value={customerForm.email} onChange={(e) => setCustomerForm((prev) => ({ ...prev, email: e.target.value }))} />
                    </div>

                    {editingCustomerId ? (
                      <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={customerForm.isActive}
                          onChange={(event) =>
                            setCustomerForm((prev) => ({ ...prev, isActive: event.target.checked }))
                          }
                        />
                        Cliente activo
                      </label>
                    ) : null}

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        disabled={isSubmitting}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={() => void handleSaveCustomer()} disabled={isSubmitting}>
                        {isSubmitting ? 'Guardando...' : 'Guardar Cliente'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
            </Dialog>

            <DataTable
              columns={[
                { key: 'full_name', label: 'Nombre', render: (v) => String(v) },
                { key: 'nit_ci', label: 'NIT/CI', render: (v) => String(v) },
                { key: 'phone', label: 'Teléfono', render: (v) => String(v || '-') },
                { key: 'email', label: 'Email', render: (v) => String(v || '-') },
                {
                  key: 'is_active',
                  label: 'Estado',
                  render: (v) =>
                    v ? <Badge className="bg-emerald-500/20 text-emerald-400">Activo</Badge> : <Badge variant="outline">Inactivo</Badge>,
                },
                {
                  key: 'id',
                  label: 'Acciones',
                  render: (id) => (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => {
                        const customer = customers.find((c) => c.id === id)
                        if (!customer) return
                        setEditingCustomerId(String(id))
                        setCustomerForm({
                          fullName: customer.full_name,
                          email: customer.email || '',
                          phone: customer.phone || '',
                          nitCi: customer.nit_ci,
                          isActive: customer.is_active ?? true,
                        })
                        setDialogFeedback(null)
                        setIsDialogOpen(true)
                      }}>Editar</Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => void handleDelete(String(id))}
                        disabled={isSubmitting}
                      >
                        Inactivar
                      </Button>
                    </div>
                  ),
                },
              ]}
              data={isLoading ? [] : customers}
            />

            {isLoading ? <p className="text-sm text-muted-foreground">Cargando clientes...</p> : null}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
