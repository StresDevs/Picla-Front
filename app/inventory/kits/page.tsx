'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { InventorySubnav } from '@/components/modules/inventory/inventory-subnav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { branchesService, kitsService, partsService } from '@/lib/supabase/inventory'
import {
  ACTIVE_ROLE_EVENT,
  getActiveUserContext,
  type AppUserRole,
} from '@/lib/mock/runtime-store'
import { Plus, Trash2 } from 'lucide-react'
import type { Part, ProductKit, ProductKitItem } from '@/types/database'

interface KitItemForm {
  id: string
  part_id: string
  quantity: string
  kit_price: string
}

interface KitForm {
  code: string
  name: string
  description: string
  category: string
  branch_id: string
  items: KitItemForm[]
}

const createKitItemForm = (partId = '', kitPrice = ''): KitItemForm => ({
  id: `kit-form-item-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
  part_id: partId,
  quantity: '1',
  kit_price: kitPrice,
})

function normalizeKitCategory(category: string) {
  return category.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function extractTrailingNumber(value: string) {
  const match = value.match(/(\d+)(?!.*\d)/)
  return match ? Number(match[1]) : 0
}

function buildNextKitCode(category: string, kits: ProductKit[]) {
  const normalizedCategory = category.trim() || 'General'
  const categoryKey = normalizedCategory.toLowerCase()
  const prefix = normalizeKitCategory(normalizedCategory) || 'KIT'
  const maxValue = kits
    .filter((kit) => (kit.category || 'General').toLowerCase() === categoryKey)
    .reduce((max, kit) => Math.max(max, extractTrailingNumber(kit.code || '')), 0)
  const next = maxValue + 1
  return `${prefix}-${String(next).padStart(3, '0')}`
}

function emptyKitForm(branchId: string, products: Part[]): KitForm {
  const first = products[0]
  return {
    code: '',
    name: '',
    description: '',
    category: 'General',
    branch_id: branchId,
    items: first ? [createKitItemForm(first.id, String(first.kit_price ?? first.price))] : [],
  }
}

export default function InventoryKitsPage() {
  const [kits, setKits] = useState<ProductKit[]>([])
  const [products, setProducts] = useState<Part[]>([])
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeRole, setActiveRole] = useState<AppUserRole>(() => getActiveUserContext().role)
  const [activeBranchId, setActiveBranchId] = useState(() => getActiveUserContext().branch_id)
  const [form, setForm] = useState<KitForm>(() => emptyKitForm(getActiveUserContext().branch_id, []))
  const resolvedCode = useMemo(() => buildNextKitCode(form.category || 'General', kits), [form.category, kits])
  const kitTotal = useMemo(() => {
    return form.items.reduce((sum, item) => {
      const qty = Number(item.quantity || 0)
      const price = Number(item.kit_price || 0)
      if (!Number.isFinite(qty) || !Number.isFinite(price)) return sum
      return sum + qty * price
    }, 0)
  }, [form.items])

  const canModify = activeRole === 'admin'

  const refresh = async (branchId: string) => {
    setError(null)
    try {
      const [loadedProducts, loadedKits] = await Promise.all([
        partsService.getAll(branchId),
        kitsService.getAll(branchId),
      ])
      setProducts(loadedProducts)
      setKits(loadedKits)
      setForm((prev) => {
        const withBranch = { ...prev, branch_id: branchId }
        if (withBranch.items.length > 0 || loadedProducts.length === 0) return withBranch
        return {
          ...withBranch,
          items: [
            createKitItemForm(
              loadedProducts[0].id,
              String(loadedProducts[0].kit_price ?? loadedProducts[0].price)
            ),
          ],
        }
      })
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar kits')
    }
  }

  useEffect(() => {
    const syncRole = () => {
      const context = getActiveUserContext()
      setActiveRole(context.role)
      setActiveBranchId(context.branch_id)
    }

    syncRole()
    window.addEventListener(ACTIVE_ROLE_EVENT, syncRole)
    window.addEventListener('focus', syncRole)

    return () => {
      window.removeEventListener(ACTIVE_ROLE_EVENT, syncRole)
      window.removeEventListener('focus', syncRole)
    }
  }, [])

  useEffect(() => {
    void branchesService.getAll().then(setBranches).catch(() => setBranches([]))
  }, [])

  useEffect(() => {
    void refresh(activeBranchId)
  }, [activeBranchId])

  useEffect(() => {
    setForm((prev) => ({ ...prev, code: resolvedCode }))
  }, [resolvedCode])

  const addItem = () => {
    const fallback = products[0]
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        createKitItemForm(fallback?.id || '', String(fallback?.kit_price ?? fallback?.price ?? '')),
      ],
    }))
  }

  const updateItem = (id: string, patch: Partial<KitItemForm>) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }))
  }

  const removeItem = (id: string) => {
    setForm((prev) => {
      const next = prev.items.filter((item) => item.id !== id)
      if (next.length > 0 || products.length === 0) {
        return { ...prev, items: next }
      }
      const fallback = products[0]
      return {
        ...prev,
        items: [createKitItemForm(fallback.id, String(fallback.kit_price ?? fallback.price))],
      }
    })
  }

  const saveKit = async () => {
    if (!canModify) return
    if (!form.code || !form.name || !form.branch_id || form.items.length === 0) return

    const items: ProductKitItem[] = form.items
      .map((item) => ({
        id: item.id,
        part_id: item.part_id,
        quantity: Number(item.quantity),
        kit_price: Number(item.kit_price),
      }))
      .filter((item) => item.part_id && item.quantity > 0 && item.kit_price >= 0)

    if (items.length === 0) return

    setIsSaving(true)
    setError(null)

    try {
      await kitsService.create({
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description,
        category: form.category || 'General',
        branch_id: form.branch_id,
        items,
      })

      await refresh(activeBranchId)
      setIsOpen(false)
      setForm(emptyKitForm(activeBranchId, products))
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo crear el kit')
    } finally {
      setIsSaving(false)
    }
  }

  const deleteKit = async (kit: ProductKit) => {
    if (!canModify) return
    const confirmation = window.confirm(`Eliminar kit "${kit.name}"? Esta accion es reversible desde base de datos.`)
    if (!confirmation) return
    setError(null)
    try {
      await kitsService.softDelete(kit.id)
      await refresh(activeBranchId)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar el kit')
    }
  }

  const resolvedKits = useMemo(() => {
    return kits.map((kit) => {
      const detail = kit.items.map((kitItem) => {
        const product = products.find((item) => item.id === kitItem.part_id)
        return {
          ...kitItem,
          part_name: product?.name || kitItem.part_id,
          line_total: kitItem.kit_price * kitItem.quantity,
        }
      })

      return {
        ...kit,
        detail,
        total: detail.reduce((sum, item) => sum + item.line_total, 0),
      }
    })
  }, [kits, products])

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Kits de inventario"
          description="Combos de productos por sucursal"
          action={
            canModify ? (
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Nuevo kit
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-5xl max-h-[92vh] overflow-y-auto text-base">
                  <DialogHeader>
                    <DialogTitle className="text-2xl">Registrar kit</DialogTitle>
                    <DialogDescription className="text-base">
                      Define productos, cantidades y precio kit por producto.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-base font-medium text-foreground">Codigo</label>
                      <Input className="h-11 text-base" value={form.code} disabled placeholder="KIT-001" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-base font-medium text-foreground">Nombre</label>
                      <Input className="h-11 text-base" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Kit de bujias" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-base font-medium text-foreground">Descripción</label>
                      <Input className="h-11 text-base" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} placeholder="Incluye bujias y cables" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-base font-medium text-foreground">Categoría</label>
                      <Input className="h-11 text-base" value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))} placeholder="General" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-base font-medium text-foreground">Sucursal</label>
                      <Input
                        className="h-11 text-base"
                        value={branches.find((branch) => branch.id === form.branch_id)?.name || form.branch_id}
                        disabled
                      />
                    </div>
                  </div>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-lg">Productos del kit</CardTitle>
                        <Button variant="outline" size="sm" onClick={addItem}>
                          <Plus className="mr-1 h-4 w-4" /> Producto
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {form.items.map((item, index) => {
                        const selected = products.find((product) => product.id === item.part_id)
                        const salePrice = Number(selected?.price || 0)
                        const costPrice = Number(selected?.cost || 0)
                        const kitPrice = Number(item.kit_price || 0)
                        const diff = salePrice - kitPrice
                        const discountPct = salePrice > 0 ? (diff / salePrice) * 100 : 0

                        return (
                        <div key={item.id} className="space-y-2 rounded-lg border border-border/70 p-3">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center text-base font-semibold text-muted-foreground w-6 shrink-0">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <Select
                                value={item.part_id || 'none'}
                                onValueChange={(value) => {
                                  const part = products.find((p) => p.id === value)
                                  updateItem(item.id, {
                                    part_id: value === 'none' ? '' : value,
                                    kit_price: String(part?.kit_price ?? part?.price ?? ''),
                                  })
                                }}
                              >
                                <SelectTrigger className="h-11 text-base w-full min-w-0 overflow-hidden *:data-[slot=select-value]:max-w-full *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:flex-1 *:data-[slot=select-value]:overflow-hidden *:data-[slot=select-value]:text-ellipsis *:data-[slot=select-value]:whitespace-nowrap">
                                  <SelectValue placeholder="Producto" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none" disabled>Selecciona producto</SelectItem>
                                  {products.map((product) => (
                                    <SelectItem key={product.id} value={product.id}>{product.name} ({product.code})</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button variant="destructive" size="sm" className="shrink-0" onClick={() => removeItem(item.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:pl-8">
                          <div className="md:col-span-3">
                            <label className="text-sm text-muted-foreground md:hidden">Cantidad</label>
                            <Input className="h-11 text-base" type="number" min={1} value={item.quantity} onChange={(event) => updateItem(item.id, { quantity: event.target.value })} placeholder="Cant" />
                          </div>
                          <div className="md:col-span-9">
                            <label className="text-sm text-muted-foreground md:hidden">Precio kit</label>
                            <Input className="h-11 text-base" type="number" step="0.01" value={item.kit_price} onChange={(event) => updateItem(item.id, { kit_price: event.target.value })} placeholder="Precio kit" />
                            {selected ? (
                              <div className="mt-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                                <div className="flex flex-wrap items-center gap-4 text-base">
                                  <span className="text-muted-foreground">Compra</span>
                                  <span className="text-lg font-semibold text-foreground">Bs {costPrice.toFixed(2)}</span>
                                  <span className="text-muted-foreground">Venta</span>
                                  <span className="text-lg font-semibold text-foreground">Bs {salePrice.toFixed(2)}</span>
                                </div>
                                <div className={`mt-1 text-sm ${diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  Diferencia: Bs {diff.toFixed(2)} · Desc: {discountPct.toFixed(2)}%
                                </div>
                              </div>
                            ) : null}
                          </div>
                          </div>
                        </div>
                      )})}
                    </CardContent>
                  </Card>

                  <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-base flex items-center justify-between">
                    <span className="text-muted-foreground">Total del kit</span>
                    <span className="text-lg font-semibold">Bs {kitTotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="destructive" onClick={() => setIsOpen(false)}>Cancelar</Button>
                    <Button onClick={() => void saveKit()} disabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar kit'}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            ) : null
          }
        />

        {!canModify ? (
          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardContent className="pt-6 text-sm text-amber-700 dark:text-amber-300">
              Solo admin puede crear o editar kits. Tu rol actual es: {activeRole}.
            </CardContent>
          </Card>
        ) : null}

        {error ? (
          <Card className="border-red-500/40 bg-red-500/5">
            <CardContent className="pt-6 text-sm text-red-700 dark:text-red-300">{error}</CardContent>
          </Card>
        ) : null}

        <InventorySubnav />

        <Card>
          <CardHeader>
            <CardTitle>Kits disponibles</CardTitle>
            <CardDescription>Listado por sucursal activa</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {resolvedKits.map((kit) => (
              <div key={kit.id} className="rounded-xl border border-border/70 bg-card/80 p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-base font-semibold">{kit.name}</p>
                    <p className="text-sm text-muted-foreground">{kit.code}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary/15 text-primary text-sm">Bs {kit.total.toFixed(2)}</Badge>
                    {canModify ? (
                      <Button variant="ghost" size="icon" onClick={() => void deleteKit(kit)}>
                        <Trash2 className="h-4 w-4 text-rose-500" />
                      </Button>
                    ) : null}
                  </div>
                </div>
                <p className="text-base text-muted-foreground">{kit.description || 'Sin descripción'}</p>
                <p className="text-sm text-emerald-600">Categoría: {kit.category || 'General'}</p>
                <div className="space-y-1 text-sm">
                  {kit.detail.map((item, index) => (
                    <div key={item.id} className="flex justify-between gap-2">
                      <span>{index + 1}. {item.part_name} x {item.quantity}</span>
                      <span>Bs {item.line_total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
