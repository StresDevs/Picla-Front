'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/common/data-table'
import { PageHeader } from '@/components/common/page-header'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { getCustomers, saveCustomers } from '@/lib/mock/runtime-store'
import { ManagementSubnav } from '@/components/modules/management/management-subnav'

interface Customer {
  id: string
  full_name: string
  nit_ci: string
  phone: string
  email: string
  branch_id: string
  created_at: string
  updated_at: string
}

interface CustomerFormData {
  fullName: string
  email: string
  phone: string
  nitCi: string
}

const emptyCustomerForm: CustomerFormData = {
  fullName: '',
  email: '',
  phone: '',
  nitCi: '',
}

export default function ManagementCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null)
  const [customerForm, setCustomerForm] = useState<CustomerFormData>(emptyCustomerForm)

  useEffect(() => {
    setCustomers(getCustomers())
  }, [])

  const persist = (next: Customer[]) => {
    setCustomers(next)
    saveCustomers(next)
  }

  const handleSaveCustomer = () => {
    if (!customerForm.fullName || !customerForm.nitCi) return

    if (editingCustomerId) {
      const next = customers.map((customer) =>
        customer.id === editingCustomerId
          ? {
              ...customer,
              full_name: customerForm.fullName,
              nit_ci: customerForm.nitCi,
              phone: customerForm.phone,
              email: customerForm.email,
              updated_at: new Date().toISOString(),
            }
          : customer,
      )
      persist(next)
    } else {
      const now = new Date().toISOString()
      const next = [
        {
          id: `cus-${Date.now()}`,
          full_name: customerForm.fullName,
          nit_ci: customerForm.nitCi,
          phone: customerForm.phone,
          email: customerForm.email,
          branch_id: 'branch-1',
          created_at: now,
          updated_at: now,
        },
        ...customers,
      ]
      persist(next)
    }

    setCustomerForm(emptyCustomerForm)
    setEditingCustomerId(null)
  }

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar cliente?')) return
    persist(customers.filter((customer) => customer.id !== id))
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Gestión - Clientes" description="Administración de cartera de clientes" />
        <ManagementSubnav />

        <Card>
          <CardHeader>
            <CardTitle>Clientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-end">
              <Dialog>
                <DialogTrigger asChild>
                  <Button onClick={() => { setEditingCustomerId(null); setCustomerForm(emptyCustomerForm) }}>Nuevo Cliente</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingCustomerId ? 'Editar' : 'Nuevo'} Cliente</DialogTitle>
                    <DialogDescription>Registra información del cliente</DialogDescription>
                  </DialogHeader>
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
                    <div className="flex justify-end gap-2">
                      <Button variant="destructive">Cancelar</Button>
                      <Button onClick={handleSaveCustomer}>Guardar Cliente</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <DataTable
              columns={[
                { key: 'full_name', label: 'Nombre', render: (v) => String(v) },
                { key: 'nit_ci', label: 'NIT/CI', render: (v) => String(v) },
                { key: 'phone', label: 'Teléfono', render: (v) => String(v || '-') },
                { key: 'email', label: 'Email', render: (v) => String(v || '-') },
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
                          email: customer.email,
                          phone: customer.phone,
                          nitCi: customer.nit_ci,
                        })
                      }}>Editar</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(String(id))}>Eliminar</Button>
                    </div>
                  ),
                },
              ]}
              data={customers}
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
