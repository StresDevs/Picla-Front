'use client'

import { useEffect, useState } from 'react'
import { kitsService } from '@/lib/supabase/inventory'
import type { POSCatalogItem, POSQueueLineInput } from '@/lib/supabase/pos'
import type { ProductKit } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ChevronRight, Package, Plus, ShoppingCart, Trash2 } from 'lucide-react'

export function KitSalePicker({ branchId, catalog, onAdd }: {
  branchId: string; catalog: POSCatalogItem[]; onAdd: (kit: ProductKit, items: POSQueueLineInput[]) => void
}) {
  const [kits, setKits] = useState<ProductKit[]>([])
  const [selected, setSelected] = useState<ProductKit | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [items, setItems] = useState<POSQueueLineInput[]>([])
  const [picker, setPicker] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [min, setMin] = useState('')
  const [max, setMax] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    setSelected(null); setExpandedId(null); setPicker(false); setKits([]); setError('')
    if (!branchId) return
    setLoading(true)
    kitsService.getAll(branchId).then(data => { if (active) setKits(data) })
      .catch(() => { if (active) setError('No se pudieron cargar los kits.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [branchId])

  const catalogById = new Map(catalog.map(product => [product.part_id, product]))
  const filteredProducts = catalog.filter(product =>
    `${product.name} ${product.code}`.toLowerCase().includes(search.toLowerCase()) &&
    (!category || product.category === category) &&
    (!min || product.kit_price >= Number(min)) &&
    (!max || product.kit_price <= Number(max))
  )

  const openKit = (kit: ProductKit) => {
    setExpandedId(kit.id)
    if (selected?.id !== kit.id) {
      setSelected(kit)
      setItems(kit.items.map(item => ({
        part_id: item.part_id,
        quantity: Number(item.quantity),
        unit_price: Number(item.kit_price),
        source_type: 'kit_component',
        source_kit_id: kit.id,
      })))
    }
  }

  const productPicker = (
    <Dialog open={picker} onOpenChange={setPicker}>
      <DialogTrigger asChild><Button type="button" size="lg" className="h-11 w-full font-semibold sm:w-auto"><Plus className="h-4 w-4" />Agregar producto al kit</Button></DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
      <DialogHeader><DialogTitle>Agregar producto al kit de esta venta</DialogTitle><DialogDescription>Selecciona un producto para agregarlo con su precio de kit.</DialogDescription></DialogHeader>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input aria-label="Buscar por nombre o código" placeholder="Nombre o código" value={search} onChange={event => setSearch(event.target.value)} />
        <select aria-label="Categoría" className="rounded-md border bg-background p-2" value={category} onChange={event => setCategory(event.target.value)}><option value="">Todas las categorías</option>{Array.from(new Set(catalog.map(product => product.category))).sort().map(value => <option key={value} value={value}>{value}</option>)}</select>
        <Input aria-label="Precio de kit mínimo" placeholder="Precio kit mínimo" type="number" min="0" value={min} onChange={event => setMin(event.target.value)} />
        <Input aria-label="Precio de kit máximo" placeholder="Precio kit máximo" type="number" min="0" value={max} onChange={event => setMax(event.target.value)} />
      </div>
      {filteredProducts.map(product => <div className="flex flex-wrap items-center gap-3 rounded-lg border p-3" key={product.part_id}>
        <div className="min-w-0 flex-1"><p className="break-words font-medium">{product.name} · {product.code}</p><p className="text-sm text-muted-foreground">{product.category} · Stock: {product.stock} · Precio kit: {product.kit_price == null ? 'Sin asignar' : `Bs ${Number(product.kit_price).toFixed(2)}`}</p></div>
        <Button type="button" disabled={product.stock <= 0 || product.kit_price == null} onClick={() => {
          if (!selected) return
          setItems(previous => previous.some(item => item.part_id === product.part_id) ? previous.map(item => item.part_id === product.part_id ? { ...item, quantity: item.quantity + 1 } : item) : [...previous, { part_id: product.part_id, quantity: 1, unit_price: Number(product.kit_price), source_type: 'kit_component', source_kit_id: selected.id }]); setPicker(false)
        }}><Plus className="h-4 w-4" />Agregar</Button>
      </div>)}
      {!filteredProducts.length && <p className="py-4 text-center text-sm text-muted-foreground">No hay productos que coincidan con los filtros.</p>}
    </DialogContent></Dialog>
  )

  return <div className="space-y-4">
    <div className="flex items-center justify-between gap-3">
      <div>
        <h3 className="font-semibold">Kits de la sucursal</h3>
        <p className="text-sm text-muted-foreground">Selecciona un kit para ver sus productos, stock y cantidades.</p>
      </div>
      <Badge variant="outline" className="shrink-0">{kits.length} kits</Badge>
    </div>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {loading ? <p className="text-sm text-muted-foreground">Cargando kits...</p> : kits.length === 0 ? <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No hay kits en esta sucursal.</p> : null}
    <div className="space-y-3">
      {kits.map(kit => {
        const expanded = expandedId === kit.id
        const kitItems: POSQueueLineInput[] = selected?.id === kit.id ? items : kit.items.map(item => ({
          part_id: item.part_id, quantity: Number(item.quantity), unit_price: Number(item.kit_price),
        }))
        const total = kitItems.reduce((sum, item) => sum + Math.round(item.quantity * item.unit_price * 100), 0) / 100
        const requiredByPart = new Map<string, number>()
        for (const item of kitItems) requiredByPart.set(item.part_id, (requiredByPart.get(item.part_id) || 0) + item.quantity)
        const insufficientStock = kitItems.some(item => {
          const product = catalogById.get(item.part_id)
          return !product || Number(product.stock) < (requiredByPart.get(item.part_id) || 0)
        })
        const invalidItems = !kitItems.length || kitItems.some(item => !Number.isFinite(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.unit_price) || item.unit_price < 0)

        return <Dialog key={kit.id} open={expanded} onOpenChange={(open) => { if (open) openKit(kit); else if (!picker) setExpandedId(null) }}>
          <div className={`overflow-hidden rounded-xl border bg-card transition-colors ${expanded ? 'border-primary/40' : 'border-border/70'}`}>
          <DialogTrigger asChild><button type="button" aria-haspopup="dialog" className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary">
            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="break-words font-semibold">{kit.name}</p>
              <p className="text-xs text-muted-foreground">{kit.code} · {kit.category || 'General'}</p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge variant="outline" className="gap-1"><Package className="h-3 w-3" />{kitItems.length} productos</Badge>
                <Badge variant="outline" className={insufficientStock ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'}>{insufficientStock ? 'Revisar stock' : 'Stock disponible'}</Badge>
              </div>
              <p className="pt-1 text-xs text-muted-foreground">Ver productos y personalizar</p>
            </div>
            <span className="shrink-0 text-sm font-semibold text-primary">Bs {total.toFixed(2)}</span>
          </button></DialogTrigger>
          </div>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl" onInteractOutside={(event) => { if (picker) event.preventDefault() }}>
            <DialogHeader>
              <DialogTitle className="pr-6">{kit.name}</DialogTitle>
              <DialogDescription>{kit.code} · {kit.category || 'General'} · Personaliza este kit para la venta.</DialogDescription>
            </DialogHeader>
            {kit.description && <p className="text-sm text-muted-foreground">{kit.description}</p>}
            <p className="text-xs text-muted-foreground">Los cambios de productos y cantidades se aplican solo a esta venta.</p>
            <div className="space-y-2">
              {kitItems.map((item, index) => {
                const product = catalogById.get(item.part_id)
                const stock = Number(product?.stock || 0)
                const insufficient = !product || stock < (requiredByPart.get(item.part_id) || 0)
                return <div key={`${item.part_id}-${index}`} className="grid grid-cols-2 items-center gap-3 rounded-lg border border-border/60 bg-background/60 p-3 sm:grid-cols-[minmax(0,1fr)_5.5rem_7rem_auto]">
                  <div className="col-span-2 min-w-0 space-y-1 sm:col-span-1">
                    <p className="break-words text-sm font-medium">{product?.name || 'Producto no disponible'}</p>
                    <p className="text-xs text-muted-foreground">{product?.code || 'Sin código'} · Precio kit: Bs {item.unit_price.toFixed(2)}</p>
                    <Badge variant="outline" className={!product || stock <= 0 ? 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300' : insufficient ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'}>
                      Stock: {stock}{insufficient ? stock <= 0 ? ' · Sin stock' : ' · Insuficiente' : ''}
                    </Badge>
                  </div>
                  <label className="min-w-0 space-y-1 text-xs text-muted-foreground">Cantidad
                    <Input aria-label={`Cantidad de ${product?.name || `componente ${index + 1}`}`} className="h-10 text-foreground" type="number" min="0.001" step="0.001" value={item.quantity} onChange={event => setItems(previous => previous.map((line, itemIndex) => itemIndex === index ? { ...line, quantity: Number(event.target.value) } : line))} />
                  </label>
                  <div className="space-y-1 text-right sm:text-left"><p className="text-xs text-muted-foreground">Subtotal</p><p className="text-sm font-semibold">Bs {(Math.round(item.quantity * item.unit_price * 100) / 100).toFixed(2)}</p></div>
                  <Button type="button" variant="ghost" size="sm" className="col-span-2 justify-self-end text-destructive hover:bg-destructive/10 hover:text-destructive sm:col-span-1" aria-label={`Quitar ${product?.name || 'componente'}`} onClick={() => setItems(previous => previous.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-4 w-4" /><span className="sm:hidden">Quitar producto</span></Button>
                </div>
              })}
              {!kitItems.length && <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Agrega productos para preparar este kit.</p>}
            </div>
            {productPicker}
            {insufficientStock && <p className="text-sm text-amber-700 dark:text-amber-300">Revisa los componentes marcados: su stock no cubre la cantidad elegida.</p>}
            <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-xs text-muted-foreground">Total del kit para esta venta</p><p className="text-xl font-semibold">Bs {total.toFixed(2)}</p></div>
              <Button type="button" size="lg" disabled={invalidItems || insufficientStock} onClick={() => onAdd(kit, items)}><ShoppingCart className="h-4 w-4" />Agregar kit a la venta</Button>
            </div>
          </DialogContent>
        </Dialog>
      })}
    </div>

  </div>
}
