'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/common/data-table'
import { PageHeader } from '@/components/common/page-header'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ManagementSubnav } from '@/components/modules/management/management-subnav'
import { getSupabaseClient } from '@/lib/supabase/client'

interface UserRecord {
  id: string
  full_name: string
  email: string
  phone: string | null
  branch_id: string
  role_id: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface RoleRecord {
  id: string
  name: string
}

interface BranchRecord {
  id: string
  name: string
}

interface UserFormData {
  fullName: string
  email: string
  phone: string
  password: string
  branchId: string
  roleId: string
  isActive: boolean
}

const emptyUserForm: UserFormData = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  branchId: '',
  roleId: '',
  isActive: true,
}

export default function ManagementUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [roles, setRoles] = useState<RoleRecord[]>([])
  const [branches, setBranches] = useState<BranchRecord[]>([])
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [userForm, setUserForm] = useState<UserFormData>(emptyUserForm)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [dialogFeedback, setDialogFeedback] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const roleMap = useMemo(() => new Map(roles.map((role) => [role.id, role.name])), [roles])
  const branchMap = useMemo(() => new Map(branches.map((branch) => [branch.id, branch.name])), [branches])

  const loadLookups = async () => {
    const supabase = getSupabaseClient()

    const [rolesResult, branchesResult] = await Promise.all([
      supabase.from('roles').select('id, name').order('name', { ascending: true }),
      supabase.from('branches').select('id, name').order('name', { ascending: true }),
    ])

    setRoles((rolesResult.data as RoleRecord[]) || [])
    setBranches((branchesResult.data as BranchRecord[]) || [])
  }

  const loadUsers = async () => {
    setIsLoading(true)
    setFeedback(null)
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.rpc('get_users')

    if (error) {
      setFeedback(`No se pudo cargar usuarios: ${error.message}`)
      setIsLoading(false)
      return
    }

    setUsers((data as UserRecord[]) || [])
    setIsLoading(false)
  }

  useEffect(() => {
    void loadLookups()
    void loadUsers()
  }, [])

  useEffect(() => {
    if (!userForm.branchId && branches.length > 0) {
      setUserForm((prev) => ({ ...prev, branchId: branches[0]?.id || '' }))
    }
  }, [branches, userForm.branchId])

  useEffect(() => {
    if (!userForm.roleId && roles.length > 0) {
      setUserForm((prev) => ({ ...prev, roleId: roles[0]?.id || '' }))
    }
  }, [roles, userForm.roleId])

  const handleCreateUser = async () => {
    setDialogFeedback(null)

    if (!userForm.fullName.trim() || !userForm.email.trim() || !userForm.password.trim() || !userForm.branchId || !userForm.roleId) {
      setDialogFeedback('Completa nombre, correo, contraseña, sucursal y rol.')
      return
    }

    if (userForm.password.trim().length < 8) {
      setDialogFeedback('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    const roleName = roleMap.get(userForm.roleId)
    if (!roleName) {
      setDialogFeedback('Selecciona un rol válido.')
      return
    }

    const supabase = getSupabaseClient()
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token

    if (!token) {
      setDialogFeedback('Sesión inválida. Vuelve a iniciar sesión.')
      return
    }

    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: userForm.email.trim(),
        password: userForm.password.trim(),
        full_name: userForm.fullName.trim(),
        phone: userForm.phone.trim() || null,
        branch_id: userForm.branchId,
        role: roleName,
      }),
    })

    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      setDialogFeedback(payload.error || 'No se pudo crear el usuario.')
      return
    }

    setUserForm(emptyUserForm)
    setEditingUserId(null)
    setDialogFeedback(null)
    setFeedback('Usuario creado correctamente.')
    setIsDialogOpen(false)
    await loadUsers()
  }

  const handleUpdateUser = async () => {
    if (!editingUserId) return
    setDialogFeedback(null)

    if (!userForm.fullName.trim() || !userForm.email.trim() || !userForm.branchId || !userForm.roleId) {
      setDialogFeedback('Completa nombre, correo, sucursal y rol.')
      return
    }

    const supabase = getSupabaseClient()
    const { error } = await supabase.rpc('update_user', {
      p_id: editingUserId,
      p_full_name: userForm.fullName.trim(),
      p_email: userForm.email.trim(),
      p_phone: userForm.phone.trim() || null,
      p_branch_id: userForm.branchId,
      p_role_id: userForm.roleId,
      p_is_active: userForm.isActive,
    })

    if (error) {
      setDialogFeedback(`No se pudo actualizar usuario: ${error.message}`)
      return
    }

    setUserForm(emptyUserForm)
    setEditingUserId(null)
    setDialogFeedback(null)
    setFeedback('Usuario actualizado correctamente.')
    setIsDialogOpen(false)
    await loadUsers()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar usuario?')) return
    setFeedback(null)

    const supabase = getSupabaseClient()
    const { error } = await supabase.rpc('delete_user', { p_id: id })

    if (error) {
      setFeedback(`No se pudo eliminar usuario: ${error.message}`)
      return
    }

    setFeedback('Usuario eliminado correctamente.')
    await loadUsers()
  }

  const openNewDialog = () => {
    setEditingUserId(null)
    setDialogFeedback(null)
    setUserForm(emptyUserForm)
    setIsDialogOpen(true)
  }

  const openEditDialog = (user: UserRecord) => {
    setEditingUserId(user.id)
    setDialogFeedback(null)
    setUserForm({
      fullName: user.full_name,
      email: user.email,
      phone: user.phone || '',
      password: '',
      branchId: user.branch_id,
      roleId: user.role_id,
      isActive: user.is_active,
    })
    setIsDialogOpen(true)
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
            {feedback ? (
              <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
                {feedback}
              </div>
            ) : null}

            <div className="flex justify-end">
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open)
                if (!open) setDialogFeedback(null)
              }}>
                <Button onClick={openNewDialog}>Nuevo Usuario</Button>
                <DialogContent className="sm:max-w-xl">
                  <DialogHeader>
                    <DialogTitle>{editingUserId ? 'Editar' : 'Nuevo'} Usuario</DialogTitle>
                    <DialogDescription>Nombre, correo, contraseña, sucursal y rol.</DialogDescription>
                  </DialogHeader>

                  {dialogFeedback ? (
                    <div className="rounded-lg border border-rose-500/70 bg-rose-500/15 px-3 py-2 text-sm font-medium text-rose-200">
                      {dialogFeedback}
                    </div>
                  ) : null}

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
                      <label className="text-sm font-medium">Teléfono</label>
                      <Input value={userForm.phone} onChange={(e) => setUserForm((prev) => ({ ...prev, phone: e.target.value }))} />
                    </div>
                    {!editingUserId ? (
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium">Contraseña</label>
                        <Input type="password" value={userForm.password} onChange={(e) => setUserForm((prev) => ({ ...prev, password: e.target.value }))} />
                        <p className="text-xs text-muted-foreground">El admin define la contraseña manualmente.</p>
                      </div>
                    ) : null}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Sucursal asignada</label>
                      <Select value={userForm.branchId} onValueChange={(value) => setUserForm((prev) => ({ ...prev, branchId: value }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {branches.map((branch) => (
                            <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Rol</label>
                      <Select value={userForm.roleId} onValueChange={(value) => setUserForm((prev) => ({ ...prev, roleId: value }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Estado</label>
                      <Select value={userForm.isActive ? 'active' : 'inactive'} onValueChange={(value) => setUserForm((prev) => ({ ...prev, isActive: value === 'active' }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Activo</SelectItem>
                          <SelectItem value="inactive">Inactivo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={editingUserId ? handleUpdateUser : handleCreateUser}>
                      {editingUserId ? 'Guardar cambios' : 'Guardar Usuario'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <DataTable
              columns={[
                { key: 'full_name', label: 'Nombre', render: (v) => String(v) },
                { key: 'email', label: 'Correo', render: (v) => String(v) },
                {
                  key: 'branch_id',
                  label: 'Sucursal',
                  render: (v) => branchMap.get(String(v)) ?? String(v),
                },
                {
                  key: 'role_id',
                  label: 'Rol',
                  render: (v) => (
                    <Badge className="bg-primary/15 text-primary">{roleMap.get(String(v)) ?? String(v)}</Badge>
                  ),
                },
                {
                  key: 'is_active',
                  label: 'Estado',
                  render: (v) => (
                    <Badge className={Boolean(v) ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}>
                      {Boolean(v) ? 'Activo' : 'Inactivo'}
                    </Badge>
                  ),
                },
                {
                  key: 'id',
                  label: 'Acciones',
                  render: (id) => (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => {
                        const user = users.find((u) => u.id === id)
                        if (!user) return
                        openEditDialog(user)
                      }}>Editar</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(String(id))}>Eliminar</Button>
                    </div>
                  ),
                },
              ]}
              data={users}
              loading={isLoading}
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
