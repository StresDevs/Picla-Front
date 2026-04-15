'use client'

import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/common/page-header'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { InventorySubnav } from '@/components/modules/inventory/inventory-subnav'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { categoriesService, partsService } from '@/lib/supabase/inventory'
import { getSupabaseClient } from '@/lib/supabase/client'
import {
  ACTIVE_ROLE_EVENT,
  getActiveUserContext,
  type AppUserRole,
} from '@/lib/mock/runtime-store'
import { Boxes, FileSpreadsheet, Plus, Search, SlidersHorizontal, Tags, Trash2, Upload } from 'lucide-react'
import type { InventoryCategory, Part, ProductPriceTier } from '@/types/database'

interface BranchOption {
  id: string
  name: string
}

interface TierFormData {
  id: string
  minQty: string
  price: string
}

interface ProductFormData {
  name: string
  code: string
  category: string
  categoryId: string
  imageUrl: string
  imageFile: File | null
  cost: string
  price: string
  kitPrice: string
  quotationMinPrice: string
  quotationMaxPrice: string
  trackingMode: 'none' | 'serial' | 'lot'
  requiresSerialization: boolean
  initialQuantity: string
  minQuantity: string
  branchId: string
  tiers: TierFormData[]
}

interface BulkProductRow {
  id: string
  code: string
  name: string
  category: string
  categoryId: string
  branchId: string
  cost: string
  price: string
  kitPrice: string
  quotationMinPrice: string
  quotationMaxPrice: string
  trackingMode: 'none' | 'serial' | 'lot'
  requiresSerialization: boolean
  initialQuantity: string
  minQuantity: string
  imageUrl: string
}

interface BulkResultRow {
  row_index: number
  part_id: string | null
  status: 'ok' | 'error'
  message: string
}

const createTier = (minQty = '2', price = ''): TierFormData => ({
  id: `tier-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
  minQty,
  price,
})

const createBulkRow = (branchId: string): BulkProductRow => ({
  id: `bulk-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
  code: '',
  name: '',
  category: '',
  categoryId: '',
  branchId,
  cost: '',
  price: '',
  kitPrice: '',
  quotationMinPrice: '',
  quotationMaxPrice: '',
  trackingMode: 'none',
  requiresSerialization: false,
  initialQuantity: '0',
  minQuantity: '0',
  imageUrl: '',
})

const createEmptyProductForm = (branchId: string): ProductFormData => ({
  name: '',
  code: '',
  category: '',
  categoryId: '',
  imageUrl: '',
  imageFile: null,
  cost: '',
  price: '',
  kitPrice: '',
  quotationMinPrice: '',
  quotationMaxPrice: '',
  trackingMode: 'none',
  requiresSerialization: false,
  initialQuantity: '0',
  minQuantity: '0',
  branchId,
  tiers: [],
})

const toProductForm = (part: Part): ProductFormData => {
  const tiers = (part.price_tiers || [])
    .filter((tier) => tier.min_quantity > 1)
    .map((tier) => ({
    id: tier.id,
    minQty: String(tier.min_quantity),
    price: String(tier.price),
  }))

  return {
    name: part.name,
    code: part.code,
    category: part.category || '',
    categoryId: part.category_id || '',
    imageUrl: part.image_url || '',
    imageFile: null,
    cost: String(part.cost),
    price: String(part.price),
    kitPrice: String(part.kit_price || part.price),
    quotationMinPrice: String(part.quotation_min_price ?? ''),
    quotationMaxPrice: String(part.quotation_max_price ?? ''),
    trackingMode: part.tracking_mode || 'none',
    requiresSerialization: part.requires_serialization || part.tracking_mode === 'serial',
    initialQuantity: '',
    minQuantity: '',
    branchId: part.branch_id,
    tiers,
  }
}

function normalizeTrackingMode(value: unknown): 'none' | 'serial' | 'lot' {
  if (value === 'serial' || value === 'lot' || value === 'none') {
    return value
  }

  const normalized = String(value || '').toLowerCase().trim()
  if (normalized === 'serial') return 'serial'
  if (normalized === 'lot') return 'lot'
  return 'none'
}

function getTrackingModeLabel(value: unknown) {
  const mode = normalizeTrackingMode(value)
  if (mode === 'serial') return 'Serie'
  if (mode === 'lot') return 'Lote'
  return 'Sin seguimiento'
}

function parseBool(value: unknown) {
  if (typeof value === 'boolean') return value
  const normalized = String(value || '').toLowerCase().trim()
  return normalized === 'true' || normalized === '1' || normalized === 'si' || normalized === 'yes' || normalized === 'y'
}

function toExcelRecord(input: Record<string, unknown>) {
  const normalized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(input)) {
    normalized[key.toLowerCase().trim()] = value
  }
  return normalized
}

function getCell(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) {
      return record[key]
    }
  }
  return ''
}

function toBulkRow(record: Record<string, unknown>, branchId: string): BulkProductRow {
  const input = toExcelRecord(record)
  const trackingMode = normalizeTrackingMode(getCell(input, ['tracking_mode', 'trackingmode']))
  const requiresSerialization = parseBool(getCell(input, ['requires_serialization', 'serializacion', 'serializable'])) || trackingMode === 'serial'

  return {
    id: `bulk-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    code: String(getCell(input, ['code', 'codigo'])).trim(),
    name: String(getCell(input, ['name', 'nombre'])).trim(),
    category: String(getCell(input, ['category', 'categoria'])).trim(),
    categoryId: String(getCell(input, ['category_id', 'categoryid'])).trim(),
    branchId: String(getCell(input, ['branch_id', 'branchid'])).trim() || branchId,
    cost: String(getCell(input, ['cost', 'costo'])).trim(),
    price: String(getCell(input, ['price', 'precio'])).trim(),
    kitPrice: String(getCell(input, ['kit_price', 'kitprice', 'precio_kit'])).trim(),
    quotationMinPrice: String(getCell(input, ['quotation_min_price', 'quotationminprice'])).trim(),
    quotationMaxPrice: String(getCell(input, ['quotation_max_price', 'quotationmaxprice'])).trim(),
    trackingMode,
    requiresSerialization,
    initialQuantity: String(getCell(input, ['initial_quantity', 'initialquantity', 'stock_inicial'])).trim() || '0',
    minQuantity: String(getCell(input, ['min_quantity', 'minquantity', 'stock_minimo'])).trim() || '0',
    imageUrl: String(getCell(input, ['image_url', 'imageurl', 'imagen_url'])).trim(),
  }
}

function getEffectiveProductPrice(part: Part) {
  const tiers = [...(part.price_tiers || [])].sort((a, b) => a.min_quantity - b.min_quantity)
  const base = tiers.find((tier) => tier.min_quantity === 1)
  return base?.price ?? part.price
}

export default function InventoryProductsPage() {
  const [parts, setParts] = useState<Part[]>([])
  const [categories, setCategories] = useState<InventoryCategory[]>([])
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [activeRole, setActiveRole] = useState<AppUserRole>(() => getActiveUserContext().role)
  const [activeBranchId, setActiveBranchId] = useState(() => getActiveUserContext().branch_id)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  const [isBulkOpen, setIsBulkOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Part | null>(null)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [categoryName, setCategoryName] = useState('')
  const [categoryDescription, setCategoryDescription] = useState('')
  const [categoryBranchId, setCategoryBranchId] = useState(() => getActiveUserContext().branch_id)
  const [bulkRows, setBulkRows] = useState<BulkProductRow[]>(() => [createBulkRow(getActiveUserContext().branch_id)])
  const [bulkResults, setBulkResults] = useState<BulkResultRow[]>([])

  const [productForm, setProductForm] = useState<ProductFormData>(() => createEmptyProductForm(getActiveUserContext().branch_id))
  const [editForm, setEditForm] = useState<ProductFormData>(() => createEmptyProductForm(getActiveUserContext().branch_id))

  const canModify = activeRole === 'admin'

  const refreshData = async (branchId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const [productsData, categoriesData] = await Promise.all([
        partsService.getAll(branchId),
        categoriesService.getAll(branchId),
      ])
      setParts(productsData)
      setCategories(categoriesData)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar inventario')
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
      setCategoryBranchId(context.branch_id)
      setProductForm((prev) => ({ ...prev, branchId: context.branch_id }))
      setBulkRows((prev) => prev.map((row) => ({ ...row, branchId: row.branchId || context.branch_id })))
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
  }, [activeBranchId])

  const categoryOptions = useMemo(() => {
    const fromRows = categories.map((category) => category.name)
    const fromProducts = parts.map((part) => part.category).filter(Boolean)
    return [...new Set([...fromRows, ...fromProducts])].sort((a, b) => a.localeCompare(b))
  }, [categories, parts])

  const filteredParts = useMemo(() => {
    return parts.filter((part) => {
      const byTerm =
        part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.code.toLowerCase().includes(searchTerm.toLowerCase())
      const byCategory = selectedCategory === 'all' || part.category === selectedCategory
      const referencePrice = getEffectiveProductPrice(part)
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
        tiers: next,
      }
    })
  }

  const addEditTier = () => {
    setEditForm((prev) => ({
      ...prev,
      tiers: [...prev.tiers, createTier()],
    }))
  }

  const updateEditTier = (id: string, patch: Partial<TierFormData>) => {
    setEditForm((prev) => ({
      ...prev,
      tiers: prev.tiers.map((tier) => (tier.id === id ? { ...tier, ...patch } : tier)),
    }))
  }

  const removeEditTier = (id: string) => {
    setEditForm((prev) => {
      const next = prev.tiers.filter((tier) => tier.id !== id)
      return {
        ...prev,
        tiers: next,
      }
    })
  }

  const openProductDetail = (part: Part) => {
    setSelectedProduct(part)
    setIsDetailOpen(true)
  }

  const openEditProduct = (part: Part) => {
    setEditingProductId(part.id)
    setEditForm(toProductForm(part))
    setIsEditOpen(true)
  }

  const saveEditedProduct = async () => {
    if (!canModify || !editingProductId) return

    if (!editForm.name || !editForm.code || !editForm.category || !editForm.cost || !editForm.price || !editForm.kitPrice || !editForm.branchId) {
      return
    }

    const referencePrice = Number(editForm.price)
    const minQuotationPrice = Number(editForm.quotationMinPrice || Number((referencePrice * 0.9).toFixed(2)))
    const maxQuotationPrice = Number(editForm.quotationMaxPrice || Number((referencePrice * 1.2).toFixed(2)))

    if (minQuotationPrice <= 0 || maxQuotationPrice < minQuotationPrice) {
      setError('El rango de cotización no es válido para la edición')
      return
    }

    if (editForm.tiers.some((tier) => tier.minQty.trim() && Number(tier.minQty) <= 1)) {
      setError('Los precios por mayoreo deben iniciar desde 2 unidades')
      return
    }

    const priceTiers: ProductPriceTier[] = editForm.tiers
      .filter((tier) => Number(tier.minQty) >= 2 && Number(tier.price) >= 0)
      .map((tier) => ({
        id: tier.id,
        min_quantity: Number(tier.minQty),
        price: Number(tier.price),
      }))

    setIsSaving(true)
    setError(null)

    try {
      let imageUrl = editForm.imageUrl || null

      if (editForm.imageFile) {
        imageUrl = await partsService.uploadProductImage(editForm.imageFile, editForm.branchId)
      }

      await partsService.update(editingProductId, {
        branch_id: editForm.branchId,
        code: editForm.code.trim(),
        name: editForm.name.trim(),
        description: `Producto ${editForm.name.trim()}`,
        category: editForm.category,
        category_id: editForm.categoryId || null,
        image_url: imageUrl,
        cost: Number(editForm.cost),
        price: Number(editForm.price),
        kit_price: Number(editForm.kitPrice),
        quotation_min_price: Number(minQuotationPrice.toFixed(2)),
        quotation_max_price: Number(maxQuotationPrice.toFixed(2)),
        tracking_mode: editForm.trackingMode,
        requires_serialization: editForm.requiresSerialization || editForm.trackingMode === 'serial',
        price_tiers: priceTiers,
      })

      await refreshData(activeBranchId)
      setIsEditOpen(false)
      setIsDetailOpen(false)
      setSelectedProduct(null)
      setEditingProductId(null)
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'No se pudo editar el producto')
    } finally {
      setIsSaving(false)
    }
  }

  const createCategory = async () => {
    if (!canModify || !categoryName.trim()) return

    setIsSaving(true)
    setError(null)

    try {
      const created = await categoriesService.create({
        branch_id: categoryBranchId,
        name: categoryName.trim(),
        description: categoryDescription.trim() || null,
      })

      if (created.branch_id === activeBranchId) {
        setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      }

      if (created.branch_id === productForm.branchId) {
        setProductForm((prev) => ({ ...prev, category: created.name, categoryId: created.id }))
      }

      setCategoryName('')
      setCategoryDescription('')
      setCategoryBranchId(activeBranchId)
      setIsCategoryOpen(false)
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'No se pudo crear la categoría')
    } finally {
      setIsSaving(false)
    }
  }

  const createProduct = async () => {
    if (!canModify) return

    if (!productForm.name || !productForm.category || !productForm.cost || !productForm.price || !productForm.kitPrice || !productForm.branchId) {
      return
    }

    const referencePrice = Number(productForm.price)
    const minQuotationPrice = Number(productForm.quotationMinPrice || Number((referencePrice * 0.9).toFixed(2)))
    const maxQuotationPrice = Number(productForm.quotationMaxPrice || Number((referencePrice * 1.2).toFixed(2)))

    if (minQuotationPrice <= 0 || maxQuotationPrice < minQuotationPrice) {
      setError('El rango de cotización no es válido')
      return
    }

    if (productForm.tiers.some((tier) => tier.minQty.trim() && Number(tier.minQty) <= 1)) {
      setError('Los precios por mayoreo deben iniciar desde 2 unidades')
      return
    }

    const additionalTiers: ProductPriceTier[] = productForm.tiers
      .filter((tier) => Number(tier.minQty) >= 2 && Number(tier.price) >= 0)
      .map((tier) => ({
        id: tier.id,
        min_quantity: Number(tier.minQty),
        price: Number(tier.price),
      }))

    setIsSaving(true)
    setError(null)

    try {
      let imageUrl = productForm.imageUrl || null
      const generatedCode = await partsService.generateAutoCode({
        branch_id: productForm.branchId,
        category: productForm.category,
        category_id: productForm.categoryId || null,
      })

      if (productForm.imageFile) {
        imageUrl = await partsService.uploadProductImage(productForm.imageFile, productForm.branchId)
      }

      await partsService.create({
        branch_id: productForm.branchId,
        code: generatedCode,
        name: productForm.name.trim(),
        description: `Producto ${productForm.name.trim()}`,
        category: productForm.category,
        category_id: productForm.categoryId || null,
        image_url: imageUrl,
        cost: Number(productForm.cost),
        price: Number(productForm.price),
        kit_price: Number(productForm.kitPrice),
        quotation_min_price: Number(minQuotationPrice.toFixed(2)),
        quotation_max_price: Number(maxQuotationPrice.toFixed(2)),
        tracking_mode: productForm.trackingMode,
        requires_serialization: productForm.requiresSerialization || productForm.trackingMode === 'serial',
        initial_quantity: Number(productForm.initialQuantity || 0),
        min_quantity: Number(productForm.minQuantity || 0),
        price_tiers: additionalTiers,
      })

      await refreshData(activeBranchId)

      setProductForm(createEmptyProductForm(productForm.branchId))
      setIsCreateOpen(false)
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'No se pudo guardar el producto')
    } finally {
      setIsSaving(false)
    }
  }

  const onExcelSelected = async (file: File | null) => {
    if (!file) return

    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const firstSheet = workbook.SheetNames[0]
    if (!firstSheet) return

    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[firstSheet], {
      defval: '',
    })

    if (json.length === 0) {
      setBulkRows([createBulkRow(activeBranchId)])
      return
    }

    setBulkRows(json.map((row) => toBulkRow(row, activeBranchId)))
  }

  const addBulkRow = () => {
    setBulkRows((prev) => [...prev, createBulkRow(activeBranchId)])
  }

  const removeBulkRow = (id: string) => {
    setBulkRows((prev) => {
      const next = prev.filter((row) => row.id !== id)
      return next.length > 0 ? next : [createBulkRow(activeBranchId)]
    })
  }

  const updateBulkRow = (id: string, patch: Partial<BulkProductRow>) => {
    setBulkRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  const saveBulkProducts = async () => {
    if (!canModify) return

    const validRows = bulkRows.filter((row) => row.name && row.category && row.cost && row.price)
    if (validRows.length === 0) {
      setError('No hay filas validas para subir')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const preparedRows = await Promise.all(
        validRows.map(async (row) => {
          const branchId = row.branchId || activeBranchId
          const code = row.code.trim()
            ? row.code.trim()
            : await partsService.generateAutoCode({
                branch_id: branchId,
                category: row.category,
                category_id: row.categoryId || null,
              })

          return {
            branch_id: branchId,
            code,
            name: row.name.trim(),
            description: `Producto ${row.name.trim()}`,
            category: row.category,
            category_id: row.categoryId || null,
            image_url: row.imageUrl || null,
            cost: Number(row.cost),
            price: Number(row.price),
            kit_price: Number(row.kitPrice || row.price),
            quotation_min_price: row.quotationMinPrice ? Number(row.quotationMinPrice) : null,
            quotation_max_price: row.quotationMaxPrice ? Number(row.quotationMaxPrice) : null,
            tracking_mode: row.trackingMode,
            requires_serialization: row.requiresSerialization || row.trackingMode === 'serial',
            initial_quantity: Number(row.initialQuantity || 0),
            min_quantity: Number(row.minQuantity || 0),
            price_tiers: [
              {
                id: `tier-bulk-${row.id}`,
                min_quantity: 1,
                price: Number(row.price),
              },
            ],
          }
        }),
      )

      const result = await partsService.bulkUpsert(
        preparedRows
      )

      setBulkResults(result)
      await refreshData(activeBranchId)
    } catch (bulkError) {
      setError(bulkError instanceof Error ? bulkError.message : 'No se pudo procesar la carga masiva')
    } finally {
      setIsSaving(false)
    }
  }

  const isProductFormValid =
    !!productForm.name &&
    !!productForm.category &&
    !!productForm.cost &&
    !!productForm.price &&
    !!productForm.kitPrice &&
    !!productForm.branchId

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Inventario"
          description="Catálogo de productos, categorías y carga masiva"
          action={
            canModify ? (
              <div className="flex flex-wrap items-center gap-2">
                <Dialog open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Nueva categoría
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Crear categoría de inventario</DialogTitle>
                      <DialogDescription>
                        Registra una categoría por sucursal para usarla en productos y filtros.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Sucursal</label>
                        <Select value={categoryBranchId} onValueChange={setCategoryBranchId}>
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
                        <label className="text-sm font-medium text-foreground">Nombre de categoría</label>
                        <Input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="Ej. Frenos premium" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Descripción</label>
                        <Input value={categoryDescription} onChange={(event) => setCategoryDescription(event.target.value)} placeholder="Opcional" />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="destructive" onClick={() => setIsCategoryOpen(false)}>Cancelar</Button>
                        <Button onClick={() => void createCategory()} disabled={isSaving || !categoryName.trim() || !categoryBranchId}>
                          Guardar categoría
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Carga masiva
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl">
                    <DialogHeader>
                      <DialogTitle>Carga masiva de productos</DialogTitle>
                      <DialogDescription>
                        Puedes cargar un Excel y editar la tabla antes de guardar en base de datos.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={(event) => void onExcelSelected(event.target.files?.[0] || null)}
                        className="max-w-sm"
                      />
                      <Button variant="outline" onClick={addBulkRow}>
                        <Plus className="w-4 h-4 mr-2" />
                        Fila manual
                      </Button>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Codigo</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead>Costo</TableHead>
                          <TableHead>Precio</TableHead>
                          <TableHead>Precio kit</TableHead>
                          <TableHead>Seguimiento</TableHead>
                          <TableHead>Serializa</TableHead>
                          <TableHead>Stock inicial</TableHead>
                          <TableHead>Enlace de imagen</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bulkRows.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell><Input value={row.code} onChange={(event) => updateBulkRow(row.id, { code: event.target.value })} /></TableCell>
                            <TableCell><Input value={row.name} onChange={(event) => updateBulkRow(row.id, { name: event.target.value })} /></TableCell>
                            <TableCell><Input value={row.category} onChange={(event) => updateBulkRow(row.id, { category: event.target.value })} /></TableCell>
                            <TableCell><Input type="number" value={row.cost} onChange={(event) => updateBulkRow(row.id, { cost: event.target.value })} /></TableCell>
                            <TableCell><Input type="number" value={row.price} onChange={(event) => updateBulkRow(row.id, { price: event.target.value })} /></TableCell>
                            <TableCell><Input type="number" value={row.kitPrice} onChange={(event) => updateBulkRow(row.id, { kitPrice: event.target.value })} /></TableCell>
                            <TableCell>
                              <Select value={row.trackingMode} onValueChange={(value: 'none' | 'serial' | 'lot') => updateBulkRow(row.id, { trackingMode: value })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">Sin seguimiento</SelectItem>
                                  <SelectItem value="serial">Serie</SelectItem>
                                  <SelectItem value="lot">Lote</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={row.requiresSerialization}
                                onChange={(event) => updateBulkRow(row.id, { requiresSerialization: event.target.checked })}
                              />
                            </TableCell>
                            <TableCell><Input type="number" value={row.initialQuantity} onChange={(event) => updateBulkRow(row.id, { initialQuantity: event.target.value })} /></TableCell>
                            <TableCell><Input value={row.imageUrl} onChange={(event) => updateBulkRow(row.id, { imageUrl: event.target.value })} /></TableCell>
                            <TableCell>
                              <Button variant="destructive" size="sm" onClick={() => removeBulkRow(row.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {bulkResults.length > 0 ? (
                      <div className="rounded-lg border border-border/70 p-3 text-sm space-y-1">
                        {bulkResults.map((result) => (
                          <p key={`${result.row_index}-${result.status}`} className={result.status === 'ok' ? 'text-emerald-600' : 'text-red-600'}>
                            Fila {result.row_index + 1}: {result.status} - {result.message}
                          </p>
                        ))}
                      </div>
                    ) : null}

                    <div className="flex justify-end">
                      <Button onClick={() => void saveBulkProducts()} disabled={isSaving}>
                        <Upload className="w-4 h-4 mr-2" />
                        {isSaving ? 'Procesando...' : 'Subir productos'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Nuevo producto
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Registrar producto</DialogTitle>
                      <DialogDescription>
                        Crea un producto por sucursal y sube la imagen al almacén product_images.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Nombre</label>
                        <Input value={productForm.name} onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Ej. Bujia Iridium" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Código (autogenerado)</label>
                        <Input value={productForm.code} readOnly placeholder="Se genera automáticamente al guardar" />
                        <p className="text-xs text-muted-foreground">Formato: prefijo por categoría + correlativo (ej. BOM-1).</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Categoría</label>
                        <Select
                          value={productForm.category || 'none'}
                          onValueChange={(value) => {
                            const selected = categories.find((item) => item.name === value)
                            setProductForm((prev) => ({
                              ...prev,
                              category: value === 'none' ? '' : value,
                              categoryId: value === 'none' ? '' : (selected?.id || ''),
                            }))
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none" disabled>Selecciona una categoría</SelectItem>
                            {categoryOptions.map((category) => (
                              <SelectItem key={category} value={category}>{category}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Sucursal</label>
                        <Select
                          value={productForm.branchId}
                          onValueChange={(value) => setProductForm((prev) => ({ ...prev, branchId: value }))}
                        >
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
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-foreground">Imagen (archivo)</label>
                        <Input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(event) => setProductForm((prev) => ({ ...prev, imageFile: event.target.files?.[0] || null }))}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-foreground">Enlace de imagen (opcional)</label>
                        <Input value={productForm.imageUrl} onChange={(event) => setProductForm((prev) => ({ ...prev, imageUrl: event.target.value }))} placeholder="https://..." />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Costo</label>
                        <Input type="number" step="0.01" value={productForm.cost} onChange={(event) => setProductForm((prev) => ({ ...prev, cost: event.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Precio base</label>
                        <Input type="number" step="0.01" value={productForm.price} onChange={(event) => setProductForm((prev) => ({ ...prev, price: event.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Precio kit</label>
                        <Input type="number" step="0.01" value={productForm.kitPrice} onChange={(event) => setProductForm((prev) => ({ ...prev, kitPrice: event.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Cotización mínima</label>
                        <Input type="number" step="0.01" value={productForm.quotationMinPrice} onChange={(event) => setProductForm((prev) => ({ ...prev, quotationMinPrice: event.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Cotización máxima</label>
                        <Input type="number" step="0.01" value={productForm.quotationMaxPrice} onChange={(event) => setProductForm((prev) => ({ ...prev, quotationMaxPrice: event.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Stock inicial</label>
                        <Input type="number" step="0.01" value={productForm.initialQuantity} onChange={(event) => setProductForm((prev) => ({ ...prev, initialQuantity: event.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Stock mínimo</label>
                        <Input type="number" step="0.01" value={productForm.minQuantity} onChange={(event) => setProductForm((prev) => ({ ...prev, minQuantity: event.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Seguimiento</label>
                        <Select value={productForm.trackingMode} onValueChange={(value: 'none' | 'serial' | 'lot') => setProductForm((prev) => ({ ...prev, trackingMode: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sin seguimiento</SelectItem>
                            <SelectItem value="serial">Serial</SelectItem>
                            <SelectItem value="lot">Lote</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Requiere serialización</label>
                        <div className="h-10 px-3 border rounded-md flex items-center">
                          <input
                            type="checkbox"
                            checked={productForm.requiresSerialization}
                            onChange={(event) => setProductForm((prev) => ({ ...prev, requiresSerialization: event.target.checked }))}
                          />
                        </div>
                      </div>
                    </div>

                    <Card className="mt-2 border-border/70">
                      <CardHeader>
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <CardTitle className="text-base">Precios por mayoreo</CardTitle>
                            <CardDescription>
                              Define precios desde 2 unidades en adelante.
                            </CardDescription>
                          </div>
                          <Button variant="outline" size="sm" onClick={addTier}>
                            <Plus className="mr-1 h-4 w-4" /> Escala
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {productForm.tiers.map((tier) => (
                          <div key={tier.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 rounded-lg border border-border/60 p-2">
                            <div className="md:col-span-5 space-y-1">
                              <label className="text-xs text-foreground">Desde cantidad</label>
                              <Input
                                type="number"
                                min={2}
                                value={tier.minQty}
                                onChange={(event) => updateTier(tier.id, { minQty: event.target.value })}
                              />
                            </div>
                            <div className="md:col-span-5 space-y-1">
                              <label className="text-xs text-foreground">Precio por unidad</label>
                              <Input
                                type="number"
                                step="0.01"
                                value={tier.price}
                                onChange={(event) => updateTier(tier.id, { price: event.target.value })}
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
                      <Button onClick={() => void createProduct()} disabled={!isProductFormValid || isSaving}>
                        {isSaving ? 'Guardando...' : 'Guardar producto'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ) : null
          }
        />

        {!canModify ? (
          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardContent className="pt-6 text-sm text-amber-700 dark:text-amber-300">
              Solo el rol admin puede crear o modificar inventario. Tu rol actual es: {activeRole}.
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
            <CardTitle className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              Filtros de catálogo
            </CardTitle>
            <CardDescription>Búsqueda por nombre, código, categoría y rango de precio</CardDescription>
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
                    {categoryOptions.map((cat) => (
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
          <Badge className="bg-primary/15 text-primary">{isLoading ? 'Cargando...' : `${filteredParts.length} productos`}</Badge>
        </div>

        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalle del producto</DialogTitle>
              <DialogDescription>
                {selectedProduct ? `${selectedProduct.name} (${selectedProduct.code})` : 'Selecciona un producto'}
              </DialogDescription>
            </DialogHeader>

            {selectedProduct ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <p><span className="font-medium">Categoría:</span> {selectedProduct.category}</p>
                  <p><span className="font-medium">Sucursal:</span> {branches.find((b) => b.id === selectedProduct.branch_id)?.name || selectedProduct.branch_id}</p>
                  <p><span className="font-medium">Costo:</span> Bs {selectedProduct.cost.toFixed(2)}</p>
                  <p><span className="font-medium">Precio base:</span> Bs {selectedProduct.price.toFixed(2)}</p>
                  <p><span className="font-medium">Precio kit:</span> Bs {(selectedProduct.kit_price || selectedProduct.price).toFixed(2)}</p>
                  <p><span className="font-medium">Seguimiento:</span> {getTrackingModeLabel(selectedProduct.tracking_mode)}</p>
                  <p><span className="font-medium">Serialización:</span> {selectedProduct.requires_serialization ? 'sí' : 'no'}</p>
                  <p><span className="font-medium">Cotización:</span> Bs {(selectedProduct.quotation_min_price ?? selectedProduct.price * 0.9).toFixed(2)} - Bs {(selectedProduct.quotation_max_price ?? selectedProduct.price * 1.2).toFixed(2)}</p>
                </div>

                <div className="rounded-md border border-border/70 p-3">
                  <p className="text-sm font-medium mb-2">Escalas de precio</p>
                  <div className="space-y-1 text-sm">
                    {[...(selectedProduct.price_tiers || [])].filter((tier) => tier.min_quantity > 1).length === 0 ? (
                      <p className="text-muted-foreground">Sin precios por mayoreo configurados.</p>
                    ) : (
                      [...(selectedProduct.price_tiers || [])]
                        .filter((tier) => tier.min_quantity > 1)
                        .sort((a, b) => a.min_quantity - b.min_quantity)
                        .map((tier) => (
                          <div key={tier.id} className="flex items-center justify-between">
                            <span>Desde {tier.min_quantity} und</span>
                            <span className="font-medium">Bs {tier.price.toFixed(2)}</span>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  {canModify ? (
                    <Button
                      onClick={() => {
                        if (selectedProduct) {
                          openEditProduct(selectedProduct)
                        }
                      }}
                    >
                      Editar producto
                    </Button>
                  ) : null}
                  <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Cerrar</Button>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar producto</DialogTitle>
              <DialogDescription>
                Actualiza datos del producto seleccionado.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Nombre</label>
                <Input value={editForm.name} onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Codigo</label>
                <Input value={editForm.code} onChange={(event) => setEditForm((prev) => ({ ...prev, code: event.target.value }))} disabled />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Categoría</label>
                <Select
                  value={editForm.category || 'none'}
                  onValueChange={(value) => {
                    const selected = categories.find((item) => item.name === value)
                    setEditForm((prev) => ({
                      ...prev,
                      category: value === 'none' ? '' : value,
                      categoryId: value === 'none' ? '' : (selected?.id || ''),
                    }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" disabled>Selecciona una categoría</SelectItem>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Sucursal</label>
                <Select value={editForm.branchId} onValueChange={(value) => setEditForm((prev) => ({ ...prev, branchId: value }))}>
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
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Imagen (archivo)</label>
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => setEditForm((prev) => ({ ...prev, imageFile: event.target.files?.[0] || null }))}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Enlace de imagen (opcional)</label>
                <Input value={editForm.imageUrl} onChange={(event) => setEditForm((prev) => ({ ...prev, imageUrl: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Costo</label>
                <Input type="number" step="0.01" value={editForm.cost} onChange={(event) => setEditForm((prev) => ({ ...prev, cost: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Precio base</label>
                <Input type="number" step="0.01" value={editForm.price} onChange={(event) => setEditForm((prev) => ({ ...prev, price: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Precio kit</label>
                <Input type="number" step="0.01" value={editForm.kitPrice} onChange={(event) => setEditForm((prev) => ({ ...prev, kitPrice: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Cotización mínima</label>
                <Input type="number" step="0.01" value={editForm.quotationMinPrice} onChange={(event) => setEditForm((prev) => ({ ...prev, quotationMinPrice: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Cotización máxima</label>
                <Input type="number" step="0.01" value={editForm.quotationMaxPrice} onChange={(event) => setEditForm((prev) => ({ ...prev, quotationMaxPrice: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Seguimiento</label>
                <Select value={editForm.trackingMode} onValueChange={(value: 'none' | 'serial' | 'lot') => setEditForm((prev) => ({ ...prev, trackingMode: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin seguimiento</SelectItem>
                    <SelectItem value="serial">Serial</SelectItem>
                    <SelectItem value="lot">Lote</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Requiere serialización</label>
                <div className="h-10 px-3 border rounded-md flex items-center">
                  <input
                    type="checkbox"
                    checked={editForm.requiresSerialization}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, requiresSerialization: event.target.checked }))}
                  />
                </div>
              </div>
            </div>

            <Card className="mt-2 border-border/70">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">Precios por mayoreo</CardTitle>
                    <CardDescription>Define precios desde 2 unidades en adelante.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={addEditTier}>
                    <Plus className="mr-1 h-4 w-4" /> Escala
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {editForm.tiers.map((tier) => (
                  <div key={tier.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 rounded-lg border border-border/60 p-2">
                    <div className="md:col-span-5 space-y-1">
                      <label className="text-xs text-foreground">Desde cantidad</label>
                      <Input
                        type="number"
                        min={2}
                        value={tier.minQty}
                        onChange={(event) => updateEditTier(tier.id, { minQty: event.target.value })}
                      />
                    </div>
                    <div className="md:col-span-5 space-y-1">
                      <label className="text-xs text-foreground">Precio por unidad</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={tier.price}
                        onChange={(event) => updateEditTier(tier.id, { price: event.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2 flex items-end justify-end">
                      <Button variant="destructive" size="sm" onClick={() => removeEditTier(tier.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button variant="destructive" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
              <Button onClick={() => void saveEditedProduct()} disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {filteredParts.map((part) => {
            const branchName = branches.find((branch) => branch.id === part.branch_id)?.name ?? part.branch_id
            const tiers = [...(part.price_tiers || [])]
              .filter((tier) => tier.min_quantity > 1)
              .sort((a, b) => a.min_quantity - b.min_quantity)

            return (
              <article key={part.id} className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/90 transition-colors duration-150 hover:border-primary/60 hover:bg-card">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img src={part.image_url || '/placeholder.svg'} alt={part.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = '/placeholder.svg' }} />
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
                      <Tags className="w-3 h-3" /> Costo Bs {part.cost.toFixed(2)}
                    </div>
                    <p className="text-lg font-bold text-primary">Bs {getEffectiveProductPrice(part).toFixed(2)}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Precio kit: <span className="font-semibold text-foreground">Bs {(part.kit_price || part.price).toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Cotización: <span className="font-semibold text-foreground">Bs {(part.quotation_min_price ?? part.price * 0.9).toFixed(2)} - Bs {(part.quotation_max_price ?? part.price * 1.2).toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Seguimiento: <span className="font-semibold text-foreground">{getTrackingModeLabel(part.tracking_mode)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Serialización: <span className="font-semibold text-foreground">{part.requires_serialization ? 'sí' : 'no'}</span>
                  </div>
                  <div className="rounded-md border border-border/70 bg-muted/20 p-2 text-[11px]">
                    {tiers.length === 0 ? (
                      <span className="text-muted-foreground">Sin escalas de mayoreo</span>
                    ) : (
                      <div className="space-y-1">
                        {tiers.map((tier) => (
                          <div key={tier.id} className="flex items-center justify-between">
                            <span className="text-muted-foreground">Desde {tier.min_quantity} und</span>
                            <span className="font-medium">Bs {tier.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button className="w-full" size="sm" variant="outline" onClick={() => openProductDetail(part)}>
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
