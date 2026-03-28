'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/common/data-table'
import { PageHeader } from '@/components/common/page-header'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { mockBranches } from '@/lib/mock/data'
import { getUsers, isUserWithinAssignedSchedule, saveUsers } from '@/lib/mock/runtime-store'
import { ManagementSubnav } from '@/components/modules/management/management-subnav'

interface User {
  id: string
  email: string
  full_name: string
  password_hash: string
  branch_id: string
  role: 'admin' | 'manager' | 'employee' | 'read_only'
  shift_start: string
  shift_end: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface UserFormData {
  fullName: string
  email: string
  password: string
  branchId: string
  role: 'admin' | 'manager' | 'employee' | 'read_only'
  shiftStart: string
  shiftEnd: string
}

const emptyUserForm: UserFormData = {
  fullName: '',
  email: '',
  password: '',
  branchId: 'branch-1',
  role: 'employee',
  shiftStart: '08:00',
  shiftEnd: '18:00',
}

export default function ManagementUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [userForm, setUserForm] = useState<UserFormData>(emptyUserForm)

  useEffect(() => {
    setUsers(getUsers())
  }, [])

  const persist = (next: User[]) => {
    setUsers(next)
    saveUsers(next)
  }

  const handleSaveUser = () => {
    if (!userForm.fullName || !userForm.email || !userForm.password || !userForm.branchId || !userForm.role) return

    if (editingUserId) {
      const next = users.map((user) =>
        user.id === editingUserId
          ? {
              ...user,
              full_name: userForm.fullName,
              email: userForm.email,
              password_hash: userForm.password,
              branch_id: userForm.branchId,
              role: userForm.role,
              shift_start: userForm.shiftStart,
              shift_end: userForm.shiftEnd,
              updated_at: new Date().toISOString(),
            }
          : user,
      )
      persist(next)
    } else {
      const now = new Date().toISOString()
      const next = [
        {
          id: `usr-${Date.now()}`,
          email: userForm.email,
          full_name: userForm.fullName,
          password_hash: userForm.password,
          branch_id: userForm.branchId,
          role: userForm.role,
          shift_start: userForm.shiftStart,
          shift_end: userForm.shiftEnd,
          is_active: true,
          created_at: now,
          updated_at: now,
        },
        ...users,
      ]
      persist(next)
    }

    setUserForm(emptyUserForm)
    setEditingUserId(null)
  }

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar usuario?')) return
    persist(users.filter((user) => user.id !== id))
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Gestión - Usuarios" description="Administra trabajadores del sistema" />
        <ManagementSubnav />

        <Card>
          <CardHeader>
            <CardTitle>Usuarios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-amber-400/35 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
              Control de horario: la validación definitiva se implementará en backend. Este módulo deja el horario asignado y la validación mock en frontend para pruebas.
            </div>
            <div className="flex justify-end">
              <Dialog>
                <DialogTrigger asChild>
                  <Button onClick={() => { setEditingUserId(null); setUserForm(emptyUserForm) }}>Nuevo Usuario</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl">
                  <DialogHeader>
                    <DialogTitle>{editingUserId ? 'Editar' : 'Nuevo'} Usuario</DialogTitle>
                    <DialogDescription>Nombre, correo, contraseña, sucursal y rol.</DialogDescription>
                  </DialogHeader>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium">Nombre Completo</label>
                      <Input value={userForm.fullName} onChange={(e) => setUserForm((prev) => ({ ...prev, fullName: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Correo</label>
                      <Input type="email" value={userForm.email} onChange={(e) => setUserForm((prev) => ({ ...prev, email: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Contraseña</label>
                      <Input type="password" value={userForm.password} onChange={(e) => setUserForm((prev) => ({ ...prev, password: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Sucursal asignada</label>
                      <Select value={userForm.branchId} onValueChange={(value) => setUserForm((prev) => ({ ...prev, branchId: value }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {mockBranches.map((branch) => (
                            <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Rol</label>
                      <Select value={userForm.role} onValueChange={(value) => setUserForm((prev) => ({ ...prev, role: value as 'admin' | 'manager' | 'employee' | 'read_only' }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="manager">Gerente</SelectItem>
                          <SelectItem value="employee">Empleado</SelectItem>
                          <SelectItem value="read_only">Solo lectura</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Horario inicio</label>
                      <Input type="time" value={userForm.shiftStart} onChange={(e) => setUserForm((prev) => ({ ...prev, shiftStart: e.target.value }))} />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Horario fin</label>
                      <Input type="time" value={userForm.shiftEnd} onChange={(e) => setUserForm((prev) => ({ ...prev, shiftEnd: e.target.value }))} />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="destructive">Cancelar</Button>
                    <Button onClick={handleSaveUser}>Guardar Usuario</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <DataTable
              columns={[
                { key: 'full_name', label: 'Nombre', render: (v) => String(v) },
                { key: 'email', label: 'Correo', render: (v) => String(v) },
                { key: 'branch_id', label: 'Sucursal', render: (v) => mockBranches.find((branch) => branch.id === String(v))?.name ?? String(v) },
                { key: 'role', label: 'Rol', render: (v) => <Badge className="bg-primary/15 text-primary">{String(v)}</Badge> },
                {
                  key: 'shift_start',
                  label: 'Horario',
                  render: (_, row) => `${String(row.shift_start)} - ${String(row.shift_end)}`,
                },
                {
                  key: 'id',
                  label: 'Acceso ahora',
                  render: (_, row) => {
                    const allowed = isUserWithinAssignedSchedule({
                      role: row.role,
                      shift_start: row.shift_start,
                      shift_end: row.shift_end,
                    })
                    return <Badge className={allowed ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}>{allowed ? 'Permitido' : 'Fuera de horario'}</Badge>
                  },
                },
                { key: 'is_active', label: 'Estado', render: (v) => <Badge className={Boolean(v) ? 'bg-green-500' : 'bg-gray-500'}>{Boolean(v) ? 'Activo' : 'Inactivo'}</Badge> },
                {
                  key: 'id',
                  label: 'Acciones',
                  render: (id) => (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => {
                        const user = users.find((u) => u.id === id)
                        if (!user) return
                        setEditingUserId(String(id))
                        setUserForm({
                          fullName: user.full_name,
                          email: user.email,
                          password: user.password_hash,
                          branchId: user.branch_id,
                          role: user.role,
                          shiftStart: user.shift_start,
                          shiftEnd: user.shift_end,
                        })
                      }}>Editar</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(String(id))}>Eliminar</Button>
                    </div>
                  ),
                },
              ]}
              data={users}
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
