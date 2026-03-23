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
import { getProducts, saveProducts } from '@/lib/mock/runtime-store'
import { InventorySubnav } from '@/components/modules/inventory/inventory-subnav'
import { Boxes, Plus, Search, SlidersHorizontal, Tags } from 'lucide-react'
import type { Part } from '@/types/database'

interface ProductFormData {
  name: string
  code: string
  category: string
  imageUrl: string
  cost: string
  price: string
  branchId: string
}

const emptyProductForm: ProductFormData = {
  name: '',
  code: '',
  category: '',
  imageUrl: '',
  cost: '',
  price: '',
  branchId: 'branch-1',
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
      const byMin = !minPrice || part.price >= Number(minPrice)
      const byMax = !maxPrice || part.price <= Number(maxPrice)

      return byTerm && byCategory && byMin && byMax
    })
  }, [parts, searchTerm, selectedCategory, minPrice, maxPrice])

  const createProduct = () => {
    if (!productForm.name || !productForm.code || !productForm.category || !productForm.cost || !productForm.price || !productForm.branchId) {
      return
    }

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
      branch_id: productForm.branchId,
      created_at: now,
      updated_at: now,
    }

    const next = [newProduct, ...parts]
    setParts(next)
    saveProducts(next)
    setProductForm(emptyProductForm)
    setIsCreateOpen(false)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Inventario"
          description="Catálogo de productos por sucursal"
          action={
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Producto
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Registrar Producto</DialogTitle>
                  <DialogDescription>Completa nombre, código, categoría, fotografía, costo, precio y sucursal asignada.</DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nombre</label>
                    <Input value={productForm.name} onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Ej. Filtro de Aceite" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Código</label>
                    <Input value={productForm.code} onChange={(event) => setProductForm((prev) => ({ ...prev, code: event.target.value }))} placeholder="REP-900" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Categoría</label>
                    <Select value={productForm.category || 'none'} onValueChange={(value) => setProductForm((prev) => ({ ...prev, category: value === 'none' ? '' : value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" disabled>Selecciona una categoría</SelectItem>
                        {mockCategories.map((category) => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sucursal asignada</label>
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
                    <label className="text-sm font-medium">Fotografía (URL)</label>
                    <Input value={productForm.imageUrl} onChange={(event) => setProductForm((prev) => ({ ...prev, imageUrl: event.target.value }))} placeholder="https://... o /products/nombre.jpg" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Precio de compra</label>
                    <Input type="number" step="0.01" value={productForm.cost} onChange={(event) => setProductForm((prev) => ({ ...prev, cost: event.target.value }))} placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Precio de venta</label>
                    <Input type="number" step="0.01" value={productForm.price} onChange={(event) => setProductForm((prev) => ({ ...prev, price: event.target.value }))} placeholder="0.00" />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="destructive" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                  <Button onClick={createProduct} disabled={!productForm.name || !productForm.code || !productForm.category || !productForm.cost || !productForm.price || !productForm.branchId}>Guardar Producto</Button>
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
              Filtros de Catálogo
            </CardTitle>
            <CardDescription>Vista tipo catálogo para pruebas sin BDD</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input className="pl-9" placeholder="Nombre o código" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoría</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {mockCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Precio mínimo</label>
                <Input type="number" placeholder="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Precio máximo</label>
                <Input type="number" placeholder="999" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Catálogo de productos</h2>
          <Badge className="bg-primary/15 text-primary">{filteredParts.length} items</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {filteredParts.map((part) => {
            const branchName = mockBranches.find((branch) => branch.id === part.branch_id)?.name ?? part.branch_id
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
                    <p className="text-lg font-bold text-primary">${part.price.toFixed(2)}</p>
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
