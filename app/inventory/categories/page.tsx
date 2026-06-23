'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/common/page-header'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { InventorySubnav } from '@/components/modules/inventory/inventory-subnav'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { categoriesService, inventoryService, partsService, type CategoryListItem } from '@/lib/supabase/inventory'
import { getSupabaseClient } from '@/lib/supabase/client'
import {
  ACTIVE_ROLE_EVENT,
  getActiveUserContext,
  type AppUserRole,
} from '@/lib/mock/runtime-store'
import {
  ChevronDown,
  FolderOpen,
  Package,
  Pencil,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from 'lucide-react'
import type { Part } from '@/types/database'

interface BranchOption {
  id: string
  name: string
}

export default function InventoryCategoriesPage() {
  const [categories, setCategories] = useState<CategoryListItem[]>([])
  const [products, setProducts] = useState<Part[]>([])
  const [stockByPartId, setStockByPartId] = useState<Record<string, number>>({})
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [activeRole, setActiveRole] = useState<AppUserRole>(() => getActiveUserContext().role)
  const [activeBranchId, setActiveBranchId] = useState(() => getActiveUserContext().branch_id)

  const [searchTerm, setSearchTerm] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null)

  // Create dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [createBranchId, setCreateBranchId] = useState(() => getActiveUserContext().branch_id)

  // Edit dialog
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editCategory, setEditCategory] = useState<CategoryListItem | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')

  // Delete confirmation
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CategoryListItem | null>(null)

  const canModify = activeRole === 'admin'

  const refreshData = async (branchId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const [data, productRows, inventoryRows] = await Promise.all([
        categoriesService.getList(branchId, showInactive),
        partsService.getAll(branchId),
        inventoryService.getByBranch(branchId),
      ])
      const stockMap: Record<string, number> = {}
      for (const row of inventoryRows) {
        stockMap[row.part_id] = Number(row.quantity || 0)
      }
      setCategories(data)
      setProducts(productRows)
      setStockByPartId(stockMap)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar las categorías')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const supabase = getSupabaseClient()

    const syncContext = () => {
      const context = getActiveUserContext()
      setActiveRole(context.role)
      setActiveBranchId(context.branch_id)
      setCreateBranchId(context.branch_id)
    }

    const loadBranches = async () => {
      const { data } = await supabase
        .from('branches')
        .select('id, name')
        .order('name', { ascending: true })

      if (data && data.length > 0) {
        setBranches(data as BranchOption[])
      }
    }

    syncContext()
    void loadBranches()

    window.addEventListener(ACTIVE_ROLE_EVENT, syncContext)
    window.addEventListener('focus', syncContext)

    return () => {
      window.removeEventListener(ACTIVE_ROLE_EVENT, syncContext)
      window.removeEventListener('focus', syncContext)
    }
  }, [])

  useEffect(() => {
    void refreshData(activeBranchId)
  }, [activeBranchId, showInactive])

  // Auto-clear success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories

    const term = searchTerm.toLowerCase()
    return categories.filter(
      (cat) =>
        cat.category_name.toLowerCase().includes(term) ||
        (cat.description && cat.description.toLowerCase().includes(term)),
    )
  }, [categories, searchTerm])

  const productsByCategory = useMemo(() => {
    const map = new Map<string, Array<{ id: string; code: string; stock: number }>>()

    for (const product of products) {
      const categoryName = product.category || ''
      if (!categoryName) continue

      const stockValue = stockByPartId[product.id] ?? 0
      const list = map.get(categoryName) ?? []
      list.push({ id: product.id, code: product.code, stock: stockValue })
      map.set(categoryName, list)
    }

    for (const list of map.values()) {
      list.sort((a, b) => a.code.localeCompare(b.code))
    }

    return map
  }, [products, stockByPartId])

  // ─── Handlers ────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!canModify || !createName.trim()) return

    setIsSaving(true)
    setError(null)

    try {
      await categoriesService.create({
        branch_id: createBranchId,
        name: createName.trim(),
        description: createDescription.trim() || null,
      })

      await refreshData(activeBranchId)
      setCreateName('')
      setCreateDescription('')
      setCreateBranchId(activeBranchId)
      setIsCreateOpen(false)
      setSuccessMessage('Categoría creada exitosamente')
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'No se pudo crear la categoría')
    } finally {
      setIsSaving(false)
    }
  }

  const openEdit = (cat: CategoryListItem) => {
    setEditCategory(cat)
    setEditName(cat.category_name)
    setEditDescription(cat.description || '')
    setIsEditOpen(true)
  }

  const handleEdit = async () => {
    if (!canModify || !editCategory || !editName.trim()) return

    setIsSaving(true)
    setError(null)

    try {
      await categoriesService.update({
        category_id: editCategory.category_id,
        name: editName.trim(),
        description: editDescription.trim() || null,
      })

      await refreshData(activeBranchId)
      setIsEditOpen(false)
      setEditCategory(null)
      setSuccessMessage('Categoría actualizada exitosamente')
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'No se pudo actualizar la categoría')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (cat: CategoryListItem) => {
    if (!canModify) return

    setError(null)

    try {
      await categoriesService.update({
        category_id: cat.category_id,
        is_active: !cat.is_active,
      })

      await refreshData(activeBranchId)
      setSuccessMessage(cat.is_active ? 'Categoría desactivada' : 'Categoría reactivada')
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'No se pudo cambiar el estado')
    }
  }

  const openDelete = (cat: CategoryListItem) => {
    setDeleteTarget(cat)
    setIsDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (!canModify || !deleteTarget) return

    setIsSaving(true)
    setError(null)

    try {
      await categoriesService.delete(deleteTarget.category_id)

      await refreshData(activeBranchId)
      setIsDeleteOpen(false)
      setDeleteTarget(null)
      setSuccessMessage('Categoría eliminada exitosamente')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar la categoría')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Categorías de Inventario"
          description="Gestiona las categorías para organizar los productos de tu inventario"
          action={
            canModify ? (
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva categoría
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Crear categoría</DialogTitle>
                    <DialogDescription>
                      Registra una nueva categoría para organizar tus productos por sucursal.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Sucursal</label>
                      <Select value={createBranchId} onValueChange={setCreateBranchId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona sucursal" />
                        </SelectTrigger>
                        <SelectContent>
                          {(branches.length > 0 ? branches : [{ id: activeBranchId, name: activeBranchId }]).map((branch) => (
                            <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Nombre</label>
                      <Input
                        value={createName}
                        onChange={(e) => setCreateName(e.target.value)}
                        placeholder="Ej. Frenos, Lubricantes, Electrónica"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Descripción (opcional)</label>
                      <Input
                        value={createDescription}
                        onChange={(e) => setCreateDescription(e.target.value)}
                        placeholder="Breve descripción de la categoría"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                      <Button
                        onClick={() => void handleCreate()}
                        disabled={isSaving || !createName.trim() || !createBranchId}
                      >
                        {isSaving ? 'Guardando...' : 'Crear categoría'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ) : null
          }
        />

        {!canModify ? (
          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardContent className="pt-6 text-sm text-amber-700 dark:text-amber-300">
              Solo el rol admin puede crear o modificar categorías. Tu rol actual es: {activeRole}.
            </CardContent>
          </Card>
        ) : null}

        {error ? (
          <Card className="border-red-500/40 bg-red-500/5">
            <CardContent className="pt-6 text-sm text-red-700 dark:text-red-300">{error}</CardContent>
          </Card>
        ) : null}

        {successMessage ? (
          <Card className="border-emerald-500/40 bg-emerald-500/5">
            <CardContent className="pt-6 text-sm text-emerald-700 dark:text-emerald-300">{successMessage}</CardContent>
          </Card>
        ) : null}

        <InventorySubnav />

        {/* Filters */}
        <Card className="card-filter">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-300">
              <FolderOpen className="w-4 h-4" />
              Filtros
            </CardTitle>
            <CardDescription>Busca y filtra categorías por nombre o estado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    className="pl-9"
                    placeholder="Nombre o descripción"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Mostrar inactivas</label>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setShowInactive(!showInactive)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowInactive(!showInactive) } }}
                  className={`relative overflow-hidden rounded-xl border p-3 transition-all duration-300 cursor-pointer select-none ${
                    showInactive
                      ? 'border-amber-400/60 bg-gradient-to-r from-amber-50/80 via-white to-orange-50/80 dark:from-slate-950 dark:via-slate-900 dark:to-amber-950/60'
                      : 'border-border/70 bg-gradient-to-r from-muted/40 to-background dark:from-slate-950/60 dark:to-slate-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">
                      {showInactive ? 'Mostrando todas las categorías' : 'Solo categorías activas'}
                    </p>
                    <Switch
                      checked={showInactive}
                      onCheckedChange={setShowInactive}
                      onClick={(e) => e.stopPropagation()}
                      className="h-6 w-11 data-[state=checked]:bg-amber-500 data-[state=unchecked]:bg-slate-300/70 dark:data-[state=unchecked]:bg-slate-700"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-end">
                <Badge className="bg-primary/15 text-primary h-fit">
                  {isLoading ? 'Cargando...' : `${filteredCategories.length} categorías`}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories Table */}
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-center">Productos</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead>Creada</TableHead>
                  {canModify ? <TableHead className="text-right">Acciones</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canModify ? 6 : 5} className="text-center py-12 text-muted-foreground">
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="inline-block w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                          Cargando categorías...
                        </span>
                      ) : (
                        <span className="flex flex-col items-center gap-2">
                          <FolderOpen className="w-8 h-8 text-muted-foreground/50" />
                          No se encontraron categorías
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((cat) => {
                    const isExpanded = expandedCategoryId === cat.category_id
                    const categoryProducts = productsByCategory.get(cat.category_name) ?? []

                    return (
                      <Fragment key={cat.category_id}>
                        <TableRow
                          className={`transition-colors duration-150 ${
                            !cat.is_active ? 'opacity-50' : 'hover:bg-muted/30'
                          }`}
                        >
                          <TableCell>
                            <div className="flex items-start gap-2">
                              <div className={`mt-2 w-2 h-2 rounded-full ${cat.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                              <div>
                                <button
                                  type="button"
                                  className="flex items-center gap-2 text-left"
                                  onClick={() => setExpandedCategoryId((prev) => (prev === cat.category_id ? null : cat.category_id))}
                                  aria-expanded={isExpanded}
                                >
                                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                  <span className="font-medium">{cat.category_name}</span>
                                </button>
                                <p className="ml-6 text-xs text-muted-foreground">
                                  {isExpanded ? 'Ocultar productos' : 'Ver productos'}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-[300px] truncate">
                            {cat.description || '—'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="gap-1">
                              <Package className="w-3 h-3" />
                              {cat.product_count}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {cat.is_active ? (
                              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                                Activa
                              </Badge>
                            ) : (
                              <Badge className="bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30">
                                Inactiva
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(cat.created_at).toLocaleDateString('es-BO', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </TableCell>
                          {canModify ? (
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                  title="Editar"
                                  onClick={() => openEdit(cat)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`h-8 w-8 p-0 ${
                                    cat.is_active
                                      ? 'hover:bg-amber-500/10 hover:text-amber-600'
                                      : 'hover:bg-emerald-500/10 hover:text-emerald-600'
                                  }`}
                                  title={cat.is_active ? 'Desactivar' : 'Reactivar'}
                                  onClick={() => void handleToggleActive(cat)}
                                >
                                  {cat.is_active ? (
                                    <ToggleRight className="h-4 w-4" />
                                  ) : (
                                    <ToggleLeft className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-600"
                                  title="Eliminar (soft delete)"
                                  onClick={() => openDelete(cat)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          ) : null}
                        </TableRow>
                        {isExpanded ? (
                          <TableRow className="bg-muted/10">
                            <TableCell colSpan={canModify ? 6 : 5}>
                              <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                                <p className="text-xs text-muted-foreground mb-2">Productos en la categoria</p>
                                {categoryProducts.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">Sin productos registrados.</p>
                                ) : (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                                    {categoryProducts.map((product) => (
                                      <div key={product.id} className="flex items-center justify-between rounded-md border border-border/60 bg-card/80 px-3 py-2">
                                        <span className="font-medium">Codigo: {product.code}</span>
                                        <span className={product.stock <= 0 ? 'font-semibold text-red-600' : 'font-semibold text-foreground'}>
                                          Stock: {product.stock}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </Fragment>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar categoría</DialogTitle>
              <DialogDescription>
                Actualiza el nombre y la descripción de la categoría.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Nombre</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nombre de la categoría"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Descripción</label>
                <Input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Descripción de la categoría"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
                <Button
                  onClick={() => void handleEdit()}
                  disabled={isSaving || !editName.trim()}
                >
                  {isSaving ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
              <AlertDialogDescription>
                La categoría <strong>&quot;{deleteTarget?.category_name}&quot;</strong> será desactivada
                (soft delete). {deleteTarget?.product_count
                  ? `Tiene ${deleteTarget.product_count} producto(s) asociado(s) que no serán afectados.`
                  : 'No tiene productos asociados.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => void handleDelete()}
                disabled={isSaving}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isSaving ? 'Eliminando...' : 'Eliminar categoría'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  )
}
