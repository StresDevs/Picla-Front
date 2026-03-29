'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/common/page-header'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { mockCategories, mockBranches } from '@/lib/mock/data'
import { addInventoryCrudLog, getActiveUserContext, getEffectiveProductPrice, getProducts, normalizePriceTiers, saveProducts } from '@/lib/mock/runtime-store'
import { InventorySubnav } from '@/components/modules/inventory/inventory-subnav'
import { Boxes, Plus, Search, SlidersHorizontal, Tags, Trash2 } from 'lucide-react'
import type { Part, ProductPriceTier } from '@/types/database'

interface TierFormData {
  id: string
  minQty: string
  price: string
}

interface ProductFormData {
  name: string
  code: string
  category: string
  imageUrl: string
  cost: string
  price: string
  kitPrice: string
  quotationMinPrice: string
  quotationMaxPrice: string
  trackingMode: 'none' | 'serial' | 'lot'
  branchId: string
  tiers: TierFormData[]
}

const createTier = (minQty = '1', price = ''): TierFormData => ({
  id: `tier-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
  minQty,
  price,
})

const emptyProductForm: ProductFormData = {
  name: '',
  code: '',
  category: '',
  imageUrl: '',
  cost: '',
  price: '',
  kitPrice: '',
  quotationMinPrice: '',
  quotationMaxPrice: '',
  trackingMode: 'none',
  branchId: 'branch-1',
  tiers: [createTier('1', '')],
}

export default function InventoryProductsPage() {
  const [parts, setParts] = useState<Part[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [productForm, setProductForm] = useState<ProductFormData>(emptyProductForm)

  useEffect(() => {
    setParts(getProducts())
  }, [])

  const filteredParts = useMemo(() => {
    return parts.filter((part) => {
      const byTerm =
        part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.code.toLowerCase().includes(searchTerm.toLowerCase())
      const byCategory = selectedCategory === 'all' || part.category === selectedCategory
      const referencePrice = getEffectiveProductPrice(part, 1)
      const byMin = !minPrice || referencePrice >= Number(minPrice)
      const byMax = !maxPrice || referencePrice <= Number(maxPrice)

      return byTerm && byCategory && byMin && byMax
    })
  }, [parts, searchTerm, selectedCategory, minPrice, maxPrice])

  const addTier = () => {
    setProductForm((prev) => ({
      ...prev,
      tiers: [...prev.tiers, createTier()],
    }))
  }

  const updateTier = (id: string, patch: Partial<TierFormData>) => {
    setProductForm((prev) => ({
      ...prev,
      tiers: prev.tiers.map((tier) => (tier.id === id ? { ...tier, ...patch } : tier)),
    }))
  }

  const removeTier = (id: string) => {
    setProductForm((prev) => {
      const next = prev.tiers.filter((tier) => tier.id !== id)
      return {
        ...prev,
        tiers: next.length > 0 ? next : [createTier('1', '')],
      }
    })
  }

  const createProduct = () => {
    if (!productForm.name || !productForm.code || !productForm.category || !productForm.cost || !productForm.price || !productForm.kitPrice || !productForm.branchId) {
      return
    }

    const referencePrice = Number(productForm.price)
    const minQuotationPrice = Number(productForm.quotationMinPrice || Number((referencePrice * 0.9).toFixed(2)))
    const maxQuotationPrice = Number(productForm.quotationMaxPrice || Number((referencePrice * 1.2).toFixed(2)))

    if (minQuotationPrice <= 0 || maxQuotationPrice < minQuotationPrice) {
      return
    }

    const additionalTiers: ProductPriceTier[] = productForm.tiers
      .filter((tier) => Number(tier.minQty) > 1 && Number(tier.price) > 0)
      .map((tier) => ({
        id: tier.id,
        min_quantity: Number(tier.minQty),
        price: Number(tier.price),
      }))

    const mergedTiers = normalizePriceTiers([
      {
        id: `tier-base-${Date.now()}`,
        min_quantity: 1,
        price: Number(productForm.price),
      },
      ...additionalTiers,
    ])

    const now = new Date().toISOString()
    const newProduct: Part = {
      id: `part-${Date.now()}`,
      code: productForm.code,
      name: productForm.name,
      description: `Producto ${productForm.name}`,
      category: productForm.category,
      image_url: productForm.imageUrl || '/placeholder.svg',
      cost: Number(productForm.cost),
      price: Number(productForm.price),
      kit_price: Number(productForm.kitPrice),
      quotation_min_price: Number(minQuotationPrice.toFixed(2)),
      quotation_max_price: Number(maxQuotationPrice.toFixed(2)),
      tracking_mode: productForm.trackingMode,
      price_tiers: mergedTiers,
      branch_id: productForm.branchId,
      created_at: now,
      updated_at: now,
    }

    const next = [newProduct, ...parts]
    setParts(next)
    saveProducts(next)
    addInventoryCrudLog({
      entity_type: 'product',
      action: 'create',
      entity_id: newProduct.id,
      entity_name: newProduct.name,
      branch_id: newProduct.branch_id,
      user_name: getActiveUserContext().user_name,
      details: `Rango cotización Bs ${newProduct.quotation_min_price?.toFixed(2)} - Bs ${newProduct.quotation_max_price?.toFixed(2)} | Tracking ${newProduct.tracking_mode}`,
    })
    setProductForm({ ...emptyProductForm, tiers: [createTier('1', '')] })
    setIsCreateOpen(false)
  }

  const isProductFormValid =
    !!productForm.name &&
    !!productForm.code &&
    !!productForm.category &&
    !!productForm.cost &&
    !!productForm.price &&
    !!productForm.kitPrice &&
    (!productForm.quotationMinPrice || Number(productForm.quotationMinPrice) > 0) &&
    (!productForm.quotationMaxPrice || Number(productForm.quotationMaxPrice) >= Number(productForm.quotationMinPrice || 0)) &&
    !!productForm.branchId

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Inventario"
          description="Catalogo de productos y precios por volumen"
          action={
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Producto
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Registrar Producto</DialogTitle>
                  <DialogDescription>
                    Completa los datos base y agrega escalas de precio por cantidad para venta por mayor.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Nombre</label>
                    <Input value={productForm.name} onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Ej. Bujia Iridium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Codigo</label>
                    <Input value={productForm.code} onChange={(event) => setProductForm((prev) => ({ ...prev, code: event.target.value }))} placeholder="REP-900" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Categoria</label>
                    <Select value={productForm.category || 'none'} onValueChange={(value) => setProductForm((prev) => ({ ...prev, category: value === 'none' ? '' : value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" disabled>Selecciona una categoria</SelectItem>
                        {mockCategories.map((category) => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Sucursal asignada</label>
                    <Select value={productForm.branchId} onValueChange={(value) => setProductForm((prev) => ({ ...prev, branchId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona sucursal" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockBranches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-foreground">Fotografia (URL)</label>
                    <Input value={productForm.imageUrl} onChange={(event) => setProductForm((prev) => ({ ...prev, imageUrl: event.target.value }))} placeholder="https://... o /products/nombre.jpg" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Precio de compra</label>
                    <Input type="number" step="0.01" value={productForm.cost} onChange={(event) => setProductForm((prev) => ({ ...prev, cost: event.target.value }))} placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Precio de venta base (1 unidad)</label>
                    <Input type="number" step="0.01" value={productForm.price} onChange={(event) => setProductForm((prev) => ({ ...prev, price: event.target.value }))} placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Precio de kit</label>
                    <Input type="number" step="0.01" value={productForm.kitPrice} onChange={(event) => setProductForm((prev) => ({ ...prev, kitPrice: event.target.value }))} placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Precio mínimo cotización</label>
                    <Input type="number" step="0.01" value={productForm.quotationMinPrice} onChange={(event) => setProductForm((prev) => ({ ...prev, quotationMinPrice: event.target.value }))} placeholder="Opcional (auto 90%)" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Precio máximo cotización</label>
                    <Input type="number" step="0.01" value={productForm.quotationMaxPrice} onChange={(event) => setProductForm((prev) => ({ ...prev, quotationMaxPrice: event.target.value }))} placeholder="Opcional (auto 120%)" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-foreground">Tracking unitario</label>
                    <Select value={productForm.trackingMode} onValueChange={(value: 'none' | 'serial' | 'lot') => setProductForm((prev) => ({ ...prev, trackingMode: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin tracking unitario</SelectItem>
                        <SelectItem value="serial">Por número de serie</SelectItem>
                        <SelectItem value="lot">Por lote</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Card className="mt-2 border-border/70">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">Precios por mayor</CardTitle>
                        <CardDescription>
                          Define precios por rango: desde X unidades el precio unitario cambia.
                        </CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={addTier}>
                        <Plus className="mr-1 h-4 w-4" /> Escala
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {productForm.tiers.map((tier, index) => (
                      <div key={tier.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 rounded-lg border border-border/60 p-2">
                        <div className="md:col-span-5 space-y-1">
                          <label className="text-xs text-foreground">Desde cantidad</label>
                          <Input
                            type="number"
                            min={2}
                            value={tier.minQty}
                            onChange={(event) => updateTier(tier.id, { minQty: event.target.value })}
                            placeholder={index === 0 ? '2' : '6'}
                          />
                        </div>
                        <div className="md:col-span-5 space-y-1">
                          <label className="text-xs text-foreground">Precio por unidad</label>
                          <Input
                            type="number"
                            step="0.01"
                            value={tier.price}
                            onChange={(event) => updateTier(tier.id, { price: event.target.value })}
                            placeholder={index === 0 ? '9.00' : '8.00'}
                          />
                        </div>
                        <div className="md:col-span-2 flex items-end justify-end">
                          <Button variant="destructive" size="sm" onClick={() => removeTier(tier.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-2">
                  <Button variant="destructive" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                  <Button onClick={createProduct} disabled={!isProductFormValid}>Guardar Producto</Button>
                </div>
              </DialogContent>
            </Dialog>
          }
        />

        <InventorySubnav />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              Filtros de Catalogo
            </CardTitle>
            <CardDescription>Vista tipo catalogo para pruebas front con mock</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input className="pl-9" placeholder="Nombre o codigo" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoria</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorias</SelectItem>
                    {mockCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Precio minimo</label>
                <Input type="number" placeholder="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Precio maximo</label>
                <Input type="number" placeholder="999" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Catalogo de productos</h2>
          <Badge className="bg-primary/15 text-primary">{filteredParts.length} items</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {filteredParts.map((part) => {
            const branchName = mockBranches.find((branch) => branch.id === part.branch_id)?.name ?? part.branch_id
            const tiers = [...(part.price_tiers || [])].sort((a, b) => a.min_quantity - b.min_quantity)

            return (
              <article key={part.id} className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/90 hover:border-primary/60 transition-all duration-300 hover:-translate-y-1">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img src={part.image_url || '/placeholder.svg'} alt={part.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" onError={(e) => { e.currentTarget.src = '/placeholder.svg' }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-primary/90 text-primary-foreground">{part.code}</Badge>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white text-sm font-semibold line-clamp-2">{part.name}</p>
                    <p className="text-white/80 text-xs mt-1">{part.category}</p>
                  </div>
                </div>
                <div className="p-3 space-y-3">
                  <div className="text-xs text-muted-foreground">{branchName}</div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Tags className="w-3 h-3" /> Compra ${part.cost.toFixed(2)}
                    </div>
                    <p className="text-lg font-bold text-primary">${getEffectiveProductPrice(part, 1).toFixed(2)}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Precio kit: <span className="font-semibold text-foreground">${(part.kit_price || part.price).toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Cotización: <span className="font-semibold text-foreground">Bs {(part.quotation_min_price ?? part.price * 0.9).toFixed(2)} - Bs {(part.quotation_max_price ?? part.price * 1.2).toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Tracking: <span className="font-semibold text-foreground">{part.tracking_mode || 'none'}</span>
                  </div>
                  <div className="rounded-md border border-border/70 bg-muted/20 p-2 text-[11px]">
                    {tiers.length <= 1 ? (
                      <span className="text-muted-foreground">Sin escalas de mayoreo</span>
                    ) : (
                      <div className="space-y-1">
                        {tiers.map((tier) => (
                          <div key={tier.id} className="flex items-center justify-between">
                            <span className="text-muted-foreground">Desde {tier.min_quantity} und</span>
                            <span className="font-medium">${tier.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button className="w-full" size="sm">
                    <Boxes className="w-4 h-4 mr-2" /> Ver detalle
                  </Button>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </MainLayout>
  )
}
