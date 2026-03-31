'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react'
import { ManagementSubnav } from '@/components/modules/management/management-subnav'
import { getSupabaseClient } from '@/lib/supabase/client'

interface BranchRecord {
  id: string
  name: string
  address: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

export default function ManagementBranchesPage() {
  const [branches, setBranches] = useState<BranchRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [createDialogFeedback, setCreateDialogFeedback] = useState<string | null>(null)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [newPhone, setNewPhone] = useState('')

  const [editingBranch, setEditingBranch] = useState<BranchRecord | null>(null)
  const [editName, setEditName] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editPhone, setEditPhone] = useState('')

  const loadBranches = async () => {
    setIsLoading(true)
    setFeedback(null)
    const supabase = getSupabaseClient()

    const { data: pagedData, error: pagedError } = await supabase.rpc('get_branches_page', {
      p_search: null,
      p_limit: 200,
      p_offset: 0,
    })

    if (!pagedError) {
      setBranches((pagedData as BranchRecord[]) || [])
      setIsLoading(false)
      return
    }

    const { data, error } = await supabase.rpc('get_branches')

    if (error) {
      setFeedback(`No se pudo cargar sucursales: ${error.message}`)
      setIsLoading(false)
      return
    }

    setBranches((data as BranchRecord[]) || [])
    setIsLoading(false)
  }

  useEffect(() => {
    loadBranches()
  }, [])

  const totalBranches = branches.length

  const recentlyUpdated = useMemo(() => {
    if (!branches.length) return 0
    const limit = Date.now() - 1000 * 60 * 60 * 24 * 30
    return branches.filter((branch) => new Date(branch.updated_at).getTime() >= limit).length
  }, [branches])

  const formatDate = (value: string) => {
    return new Date(value).toLocaleString('es-BO', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  }

  const handleCreateBranch = async () => {
    setCreateDialogFeedback(null)

    if (!newName.trim()) {
      setCreateDialogFeedback('El nombre de la sucursal es obligatorio.')
      return
    }

    const supabase = getSupabaseClient()
    const { error } = await supabase.rpc('create_branch', {
      p_name: newName.trim(),
      p_address: newAddress.trim() || null,
      p_phone: newPhone.trim() || null,
    })

    if (error) {
      setCreateDialogFeedback(`No se pudo crear sucursal: ${error.message}`)
      return
    }

    setNewName('')
    setNewAddress('')
    setNewPhone('')
    setCreateDialogFeedback(null)
    setIsCreateOpen(false)
    setFeedback('Sucursal creada correctamente.')
    await loadBranches()
  }

  const openEditDialog = (branch: BranchRecord) => {
    setEditingBranch(branch)
    setEditName(branch.name)
    setEditAddress(branch.address || '')
    setEditPhone(branch.phone || '')
  }

  const handleUpdateBranch = async () => {
    if (!editingBranch) return
    setFeedback(null)

    if (!editName.trim()) {
      setFeedback('El nombre de la sucursal es obligatorio.')
      return
    }

    const supabase = getSupabaseClient()
    const { error } = await supabase.rpc('update_branch', {
      p_id: editingBranch.id,
      p_name: editName.trim(),
      p_address: editAddress.trim() || null,
      p_phone: editPhone.trim() || null,
    })

    if (error) {
      setFeedback(`No se pudo actualizar sucursal: ${error.message}`)
      return
    }

    setEditingBranch(null)
    setFeedback('Sucursal actualizada correctamente.')
    await loadBranches()
  }

  const handleDeleteBranch = async (branchId: string, branchName: string) => {
    if (!window.confirm(`¿Eliminar la sucursal ${branchName}?`)) return

    setFeedback(null)
    const supabase = getSupabaseClient()
    const { error } = await supabase.rpc('delete_branch', {
      p_id: branchId,
    })

    if (error) {
      setFeedback(`No se pudo eliminar sucursal: ${error.message}`)
      return
    }

    setFeedback('Sucursal eliminada correctamente.')
    await loadBranches()
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Gestión - Sucursales" description="CRUD de sucursales conectado a la tabla branches" />
        <ManagementSubnav />

        <Card>
          <CardContent className="pt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">Administración de sucursales</p>
                <p className="text-xs text-muted-foreground">Solo administradores pueden crear, editar y eliminar sucursales.</p>
              </div>
            </div>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Crear sucursal
            </Button>
          </CardContent>
        </Card>

        {feedback ? (
          <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
            {feedback}
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total de sucursales</p>
              <p className="text-3xl font-semibold mt-2">{totalBranches}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Actualizadas en 30 días</p>
              <p className="text-3xl font-semibold mt-2">{recentlyUpdated}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Cargando sucursales...</p>
              </CardContent>
            </Card>
          ) : branches.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">No hay sucursales registradas.</p>
              </CardContent>
            </Card>
          ) : branches.map((branch) => (
            <Card key={branch.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{branch.name}</span>
                  <Badge className="bg-primary/15 text-primary">Activa</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">Dirección: {branch.address || 'Sin dirección registrada'}</p>
                <p className="text-sm text-muted-foreground">Teléfono: {branch.phone || 'Sin teléfono registrado'}</p>

                <div className="pt-2 border-t border-border/70 space-y-1">
                  <p className="text-xs text-muted-foreground">Creada: {formatDate(branch.created_at)}</p>
                  <p className="text-xs text-muted-foreground">Actualizada: {formatDate(branch.updated_at)}</p>
                </div>

                <div className="pt-2 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEditDialog(branch)}>
                    <Pencil className="mr-2 h-4 w-4" /> Editar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteBranch(branch.id, branch.name)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            setIsCreateOpen(open)
            if (!open) setCreateDialogFeedback(null)
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear sucursal</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {createDialogFeedback ? (
                <div className="rounded-lg border border-rose-500/70 bg-rose-500/15 px-3 py-2 text-sm font-medium text-rose-200 shadow-[0_0_0_1px_hsl(0_84%_60%_/_0.2)]">
                  {createDialogFeedback}
                </div>
              ) : null}
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="Sucursal Centro" />
              </div>
              <div className="space-y-2">
                <Label>Dirección</Label>
                <Input value={newAddress} onChange={(event) => setNewAddress(event.target.value)} placeholder="Av. Blanco Galindo #123" />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input value={newPhone} onChange={(event) => setNewPhone(event.target.value)} placeholder="+591 4 1234567" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreateBranch}>Guardar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={Boolean(editingBranch)} onOpenChange={(open) => { if (!open) setEditingBranch(null) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar sucursal</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={editName} onChange={(event) => setEditName(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Dirección</Label>
                <Input value={editAddress} onChange={(event) => setEditAddress(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input value={editPhone} onChange={(event) => setEditPhone(event.target.value)} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditingBranch(null)}>Cancelar</Button>
                <Button onClick={handleUpdateBranch}>Guardar cambios</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}
