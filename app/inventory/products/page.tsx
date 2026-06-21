'use client'

import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
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
import { categoriesService, inventoryService, partsService, type InventoryAvailabilityRow } from '@/lib/supabase/inventory'
import { getSupabaseClient } from '@/lib/supabase/client'
import {
  ACTIVE_ROLE_EVENT,
  getActiveUserContext,
  type AppUserRole,
} from '@/lib/mock/runtime-store'
import {
  Boxes,
  ChevronDown,
  Download,
  FileSpreadsheet,
  LayoutGrid,
  List,
  Plus,
  Search,
  SlidersHorizontal,
  Tags,
  Trash2,
  Upload,
} from 'lucide-react'
import type { InventoryCategory, Part, ProductPriceTier } from '@/types/database'
import { generateInventoryPdf } from '@/lib/pdf/generators'
import { exportToExcel } from '@/lib/excel/export'
import { SearchableStringPick } from '@/components/modules/inventory/part-combobox'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'

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
  quotationMaxPercent: string
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
  quotationMaxPercent: string
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

const DEFAULT_QUOTATION_MAX_PERCENT = 120

function toPercentString(value: number) {
  if (!Number.isFinite(value)) return String(DEFAULT_QUOTATION_MAX_PERCENT)
  return String(Number(value.toFixed(2)))
}

function resolveQuotationMaxPercent(price: number, maxPrice?: number | null) {
  if (!Number.isFinite(price) || price <= 0) return DEFAULT_QUOTATION_MAX_PERCENT
  if (maxPrice === undefined || maxPrice === null || !Number.isFinite(maxPrice)) {
    return DEFAULT_QUOTATION_MAX_PERCENT
  }
  const percent = (maxPrice / price) * 100
  if (!Number.isFinite(percent)) return DEFAULT_QUOTATION_MAX_PERCENT
  return Math.max(100, Number(percent.toFixed(2)))
}

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
  quotationMaxPercent: String(DEFAULT_QUOTATION_MAX_PERCENT),
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
  quotationMaxPercent: String(DEFAULT_QUOTATION_MAX_PERCENT),
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
    kitPrice: String(part.kit_price ?? part.price),
    quotationMinPrice: String(part.quotation_min_price ?? ''),
    quotationMaxPercent: toPercentString(resolveQuotationMaxPercent(part.price, part.quotation_max_price ?? null)),
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
  const rawPrice = String(getCell(input, ['price', 'precio'])).trim()
  const priceValue = Number(rawPrice.replace(',', '.'))
  const rawMaxPercent = String(
    getCell(input, [
      'quotation_max_percent',
      'quotation_max_percentage',
      'quotationmaxpercent',
      'cotizacion_maxima_percent',
      'cotizacion_maxima_pct',
      'cotizacion_maxima_porcentaje',
    ]),
  ).trim()
  const maxPercentValue = Number(rawMaxPercent.replace(',', '.'))
  const rawMaxPrice = String(getCell(input, ['quotation_max_price', 'quotationmaxprice'])).trim()
  const maxPriceValue = Number(rawMaxPrice.replace(',', '.'))
  const resolvedMaxPercent =
    Number.isFinite(maxPercentValue) && maxPercentValue > 0
      ? Math.max(100, maxPercentValue)
      : resolveQuotationMaxPercent(priceValue, Number.isFinite(maxPriceValue) ? maxPriceValue : null)

  return {
    id: `bulk-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    code: String(getCell(input, ['code', 'codigo'])).trim(),
    name: String(getCell(input, ['name', 'nombre'])).trim(),
    category: String(getCell(input, ['category', 'categoria'])).trim(),
    categoryId: String(getCell(input, ['category_id', 'categoryid'])).trim(),
    branchId: String(getCell(input, ['branch_id', 'branchid'])).trim() || branchId,
    cost: String(getCell(input, ['cost', 'costo'])).trim(),
    price: rawPrice,
    kitPrice: String(getCell(input, ['kit_price', 'kitprice', 'precio_kit'])).trim(),
    quotationMinPrice: String(getCell(input, ['quotation_min_price', 'quotationminprice'])).trim(),
    quotationMaxPercent: toPercentString(resolvedMaxPercent),
    trackingMode,
    requiresSerialization,
    initialQuantity: String(getCell(input, ['initial_quantity', 'initialquantity', 'stock_inicial'])).trim() || '0',
    minQuantity: String(getCell(input, ['min_quantity', 'minquantity', 'stock_minimo'])).trim() || '0',
    imageUrl: String(getCell(input, ['image_url', 'imageurl', 'imagen_url'])).trim(),
  }
}

const BULK_TEMPLATE_HEADERS = [
  'codigo',
  'nombre',
  'categoria',
  'costo',
  'precio',
  'precio_kit',
  'tracking_mode',
  'requires_serialization',
  'stock_inicial',
  'stock_minimo',
  'imagen_url',
]

function isBulkRowEmpty(row: BulkProductRow) {
  return (
    !row.code.trim() &&
    !row.name.trim() &&
    !row.category.trim() &&
    !row.cost.trim() &&
    !row.price.trim() &&
    !row.kitPrice.trim() &&
    !row.imageUrl.trim()
  )
}

function isBulkRowComplete(row: BulkProductRow) {
  return Boolean(row.name.trim() && row.category.trim() && row.cost.trim() && row.price.trim())
}

function getEffectiveProductPrice(part: Part) {
  const tiers = [...(part.price_tiers || [])].sort((a, b) => a.min_quantity - b.min_quantity)
  const base = tiers.find((tier) => tier.min_quantity === 1)
  return base?.price ?? part.price
}

function getMaxQuotationPriceFromPercent(price: number, percent: number) {
  if (!Number.isFinite(price) || !Number.isFinite(percent)) return 0
  return Number((price * (percent / 100)).toFixed(2))
}

function getQuotationRange(part: Part) {
  const referencePrice = Number(part.price || 0)
  const min = part.quotation_min_price ?? Number((referencePrice * 0.9).toFixed(2))
  const max = part.quotation_max_price ?? Number((referencePrice * 1.2).toFixed(2))
  return { min, max }
}

function SerializationToggleCard({
  checked,
  onCheckedChange,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onCheckedChange(!checked)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onCheckedChange(!checked)
        }
      }}
      className={`relative overflow-hidden rounded-xl border p-3 transition-all duration-300 ${
        checked
          ? 'border-sky-400/60 bg-gradient-to-r from-sky-50/80 via-white to-blue-50/80 shadow-[0_0_0_1px_rgba(14,165,233,0.25)] dark:from-slate-950 dark:via-slate-900 dark:to-sky-950/60'
          : 'border-border/70 bg-gradient-to-r from-muted/40 to-background dark:from-slate-950/60 dark:to-slate-900/40'
      } cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50`}
    >
      <div className="pointer-events-none absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_85%_15%,rgba(56,189,248,0.35),transparent_45%)]" />
      <div className="relative flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {checked ? 'Control por serie activado' : 'Control por serie desactivado'}
          </p>
          <p className="text-xs text-muted-foreground">
            {checked
              ? 'Cada unidad se registrara con serial unico para trazabilidad.'
              : 'Se manejara por cantidades sin serial individual.'}
          </p>
        </div>
        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          className="h-6 w-11 data-[state=checked]:bg-sky-500 data-[state=unchecked]:bg-slate-300/70 dark:data-[state=unchecked]:bg-slate-700"
        />
      </div>
      <div className="relative mt-3">
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
            checked
              ? 'border-sky-400/70 bg-sky-500/15 text-sky-700 dark:text-sky-200'
              : 'border-border bg-background/70 text-muted-foreground'
          }`}
        >
          {checked ? 'ACTIVO' : 'INACTIVO'}
        </span>
      </div>
    </div>
  )
}

export default function InventoryProductsPage() {
  const [parts, setParts] = useState<Part[]>([])
  const [stockByPartId, setStockByPartId] = useState<Record<string, number>>({})
  const [availabilityByCode, setAvailabilityByCode] = useState<Record<string, InventoryAvailabilityRow[]>>({})
  const [availabilityLoadingByCode, setAvailabilityLoadingByCode] = useState<Record<string, boolean>>({})
  const [categories, setCategories] = useState<InventoryCategory[]>([])
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [activeRole, setActiveRole] = useState<AppUserRole>(() => getActiveUserContext().role)
  const [activeBranchId, setActiveBranchId] = useState(() => getActiveUserContext().branch_id)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [inventoryReportVariant, setInventoryReportVariant] = useState<'detailed' | 'stock-check' | 'sale-price'>(() => {
    const role = getActiveUserContext().role
    return role === 'admin' ? 'detailed' : 'sale-price'
  })
  const [viewMode, setViewMode] = useState<'cards' | 'rows'>('cards')
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)
  const [productsPage, setProductsPage] = useState(1)
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
  const [isDeleteProductOpen, setIsDeleteProductOpen] = useState(false)
  const [deleteProductTarget, setDeleteProductTarget] = useState<Part | null>(null)
  const [categoryName, setCategoryName] = useState('')
  const [categoryDescription, setCategoryDescription] = useState('')
  const [categoryBranchId, setCategoryBranchId] = useState(() => getActiveUserContext().branch_id)
  const [bulkRows, setBulkRows] = useState<BulkProductRow[]>(() => [createBulkRow(getActiveUserContext().branch_id)])
  const [bulkResults, setBulkResults] = useState<BulkResultRow[]>([])
  const [bulkFileName, setBulkFileName] = useState<string | null>(null)

  const [productForm, setProductForm] = useState<ProductFormData>(() => createEmptyProductForm(getActiveUserContext().branch_id))
  const [editForm, setEditForm] = useState<ProductFormData>(() => createEmptyProductForm(getActiveUserContext().branch_id))

  const canModify = activeRole === 'admin'
  const canSeePurchasePrice = activeRole === 'admin'
  const canSeeFullProductDetails = activeRole === 'admin' || activeRole === 'read_only'

  const normalizePartCode = (code: string) => code.trim().toLowerCase()

  const ensureAvailabilityForCode = async (code: string) => {
    const normalized = normalizePartCode(code)
    if (!normalized || availabilityByCode[normalized] || availabilityLoadingByCode[normalized]) {
      return
    }

    setAvailabilityLoadingByCode((prev) => ({ ...prev, [normalized]: true }))

    try {
      const rows = await inventoryService.getAvailabilityByCode(code)
      setAvailabilityByCode((prev) => ({ ...prev, [normalized]: rows }))
    } catch {
      setAvailabilityByCode((prev) => ({ ...prev, [normalized]: [] }))
    } finally {
      setAvailabilityLoadingByCode((prev) => ({ ...prev, [normalized]: false }))
    }
  }

  const refreshData = async (branchId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const [productsData, categoriesData, inventoryRows] = await Promise.all([
        partsService.getAll(branchId),
        categoriesService.getAll(branchId),
        inventoryService.getByBranch(branchId),
      ])
      const stockMap: Record<string, number> = {}
      for (const row of inventoryRows) {
        stockMap[row.part_id] = Number(row.quantity || 0)
      }
      setParts(productsData)
      setCategories(categoriesData)
      setStockByPartId(stockMap)
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

  const bulkValidCount = useMemo(() => bulkRows.filter(isBulkRowComplete).length, [bulkRows])

  const filteredParts = useMemo(() => {
    setProductsPage(1)
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parts, searchTerm, selectedCategory, minPrice, maxPrice])

  const PRODUCTS_PER_PAGE = 12
  const totalProductPages = Math.max(1, Math.ceil(filteredParts.length / PRODUCTS_PER_PAGE))
  const paginatedParts = useMemo(() => {
    const start = (productsPage - 1) * PRODUCTS_PER_PAGE
    return filteredParts.slice(start, start + PRODUCTS_PER_PAGE)
  }, [filteredParts, productsPage])

  const selectedStock = useMemo(() => {
    if (!selectedProduct) return 0
    return stockByPartId[selectedProduct.id] ?? 0
  }, [selectedProduct, stockByPartId])

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
    void ensureAvailabilityForCode(part.code)
  }

  const openEditProduct = (part: Part) => {
    setEditingProductId(part.id)
    setEditForm(toProductForm(part))
    setIsEditOpen(true)
  }

  const saveEditedProduct = async () => {
    if (!canModify || !editingProductId) return

    if (!editForm.name || !editForm.code || !editForm.category || !editForm.cost || !editForm.price || !editForm.branchId) {
      return
    }

    const referencePrice = Number(editForm.price)
    const minQuotationPrice = Number(editForm.quotationMinPrice || Number((referencePrice * 0.9).toFixed(2)))
    const maxPercentValue = Number(editForm.quotationMaxPercent || DEFAULT_QUOTATION_MAX_PERCENT)

    if (!Number.isFinite(maxPercentValue) || maxPercentValue < 100) {
      setError('El porcentaje de cotización máxima debe ser igual o mayor a 100%.')
      return
    }

    const maxQuotationPrice = Number((referencePrice * (maxPercentValue / 100)).toFixed(2))

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

      await refreshData(editForm.branchId || activeBranchId)
      if (editForm.branchId && editForm.branchId !== activeBranchId) {
        await refreshData(activeBranchId)
      }
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

  const openDeleteProduct = (part: Part) => {
    setDeleteProductTarget(part)
    setIsDeleteProductOpen(true)
  }

  const handleDeleteProduct = async () => {
    if (!canModify || !deleteProductTarget) return

    setIsSaving(true)
    setError(null)

    try {
      await partsService.delete(deleteProductTarget.id)
      setParts((prev) => prev.filter((p) => p.id !== deleteProductTarget.id))
      await refreshData(activeBranchId)
      setIsDeleteProductOpen(false)
      setDeleteProductTarget(null)
      setIsDetailOpen(false)
      setIsEditOpen(false)
      setSelectedProduct(null)
      setEditingProductId(null)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar el producto')
    } finally {
      setIsSaving(false)
    }
  }

  const createProduct = async () => {
    if (!canModify) return

    if (!productForm.name || !productForm.category || !productForm.cost || !productForm.price || !productForm.branchId) {
      return
    }

    const referencePrice = Number(productForm.price)
    const minQuotationPrice = Number(productForm.quotationMinPrice || Number((referencePrice * 0.9).toFixed(2)))
    const maxPercentValue = Number(productForm.quotationMaxPercent || DEFAULT_QUOTATION_MAX_PERCENT)

    if (!Number.isFinite(maxPercentValue) || maxPercentValue < 100) {
      setError('El porcentaje de cotización máxima debe ser igual o mayor a 100%.')
      return
    }

    const maxQuotationPrice = Number((referencePrice * (maxPercentValue / 100)).toFixed(2))

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
      let imageUrl: string | null = null
      const trackingMode = productForm.requiresSerialization ? 'serial' : 'none'
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
        tracking_mode: trackingMode,
        requires_serialization: productForm.requiresSerialization,
        initial_quantity: Number(productForm.initialQuantity || 0),
        min_quantity: Number(productForm.minQuantity || 0),
        price_tiers: additionalTiers,
      })

      await refreshData(productForm.branchId || activeBranchId)
      if (productForm.branchId && productForm.branchId !== activeBranchId) {
        await refreshData(activeBranchId)
      }

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

    setBulkFileName(file.name)
    setBulkResults([])

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

  const downloadBulkTemplate = () => {
    exportToExcel({
      fileName: 'plantilla_carga_masiva_productos',
      sheetName: 'Productos',
      headers: BULK_TEMPLATE_HEADERS,
      rows: [
        ['', 'Bujia Iridium', 'Encendido', '120', '180', '', 'none', 'false', '10', '2', ''],
      ],
    })
  }

  const clearBulkRows = () => {
    setBulkRows([createBulkRow(activeBranchId)])
    setBulkResults([])
    setBulkFileName(null)
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

          const maxPercentValue = Number(row.quotationMaxPercent || DEFAULT_QUOTATION_MAX_PERCENT)
          const safeMaxPercent = Number.isFinite(maxPercentValue) && maxPercentValue >= 100
            ? maxPercentValue
            : DEFAULT_QUOTATION_MAX_PERCENT
          const maxQuotationPrice = Number((Number(row.price) * (safeMaxPercent / 100)).toFixed(2))

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
            kit_price: Number(row.kitPrice !== '' ? row.kitPrice : row.price),
            quotation_min_price: row.quotationMinPrice ? Number(row.quotationMinPrice) : null,
            quotation_max_price: Number.isFinite(maxQuotationPrice) ? maxQuotationPrice : null,
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
                  <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Carga masiva de productos</DialogTitle>
                      <DialogDescription>
                        Sube un Excel o CSV, agrega filas manuales si lo necesitas y revisa los datos antes de guardarlos en el inventario.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 gap-3 rounded-lg border border-dashed border-border/70 bg-muted/30 p-4 md:grid-cols-[1.3fr_1fr]">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <FileSpreadsheet className="h-4 w-4" />
                          Archivo Excel o CSV
                        </label>
                        <Input
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          onChange={(event) => void onExcelSelected(event.target.files?.[0] || null)}
                        />
                        <p className="text-xs text-muted-foreground">
                          {bulkFileName
                            ? `Archivo cargado: ${bulkFileName} (${bulkRows.length} fila${bulkRows.length === 1 ? '' : 's'})`
                            : 'Columnas esperadas: codigo, nombre, categoria, costo, precio, precio_kit, tracking_mode, requires_serialization, stock_inicial, stock_minimo, imagen_url.'}
                        </p>
                      </div>
                      <div className="flex flex-col items-start justify-end gap-2 md:items-end">
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={downloadBulkTemplate}>
                            <Download className="w-4 h-4 mr-2" />
                            Descargar plantilla
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={addBulkRow}>
                            <Plus className="w-4 h-4 mr-2" />
                            Fila manual
                          </Button>
                          <Button type="button" variant="ghost" size="sm" onClick={clearBulkRows}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Limpiar
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border/70">
                      <div className="max-h-[360px] overflow-auto">
                        <Table>
                          <TableHeader className="sticky top-0 z-10 bg-background">
                            <TableRow>
                              <TableHead className="whitespace-nowrap">Codigo</TableHead>
                              <TableHead className="whitespace-nowrap">Nombre</TableHead>
                              <TableHead className="whitespace-nowrap">Categoría</TableHead>
                              <TableHead className="whitespace-nowrap">Precio de compra</TableHead>
                              <TableHead className="whitespace-nowrap">Precio</TableHead>
                              <TableHead className="whitespace-nowrap">Precio kit</TableHead>
                              <TableHead className="whitespace-nowrap">Seguimiento</TableHead>
                              <TableHead className="whitespace-nowrap">Serializa</TableHead>
                              <TableHead className="whitespace-nowrap">Stock inicial</TableHead>
                              <TableHead className="whitespace-nowrap">Enlace de imagen</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {bulkRows.map((row) => {
                              const incomplete = !isBulkRowEmpty(row) && !isBulkRowComplete(row)
                              return (
                                <TableRow key={row.id} className={incomplete ? 'bg-amber-500/10' : undefined}>
                                  <TableCell><Input className="min-w-[100px]" value={row.code} onChange={(event) => updateBulkRow(row.id, { code: event.target.value })} placeholder="Auto" /></TableCell>
                                  <TableCell><Input className="min-w-[160px]" value={row.name} onChange={(event) => updateBulkRow(row.id, { name: event.target.value })} placeholder="Nombre*" /></TableCell>
                                  <TableCell>
                                    <Input
                                      className="min-w-[140px]"
                                      value={row.category}
                                      onChange={(event) => updateBulkRow(row.id, { category: event.target.value })}
                                      placeholder="Categoría*"
                                      list="bulk-category-options"
                                    />
                                  </TableCell>
                                  <TableCell><Input className="min-w-[110px]" type="number" value={row.cost} onChange={(event) => updateBulkRow(row.id, { cost: event.target.value })} placeholder="0.00*" /></TableCell>
                                  <TableCell><Input className="min-w-[110px]" type="number" value={row.price} onChange={(event) => updateBulkRow(row.id, { price: event.target.value })} placeholder="0.00*" /></TableCell>
                                  <TableCell><Input className="min-w-[110px]" type="number" value={row.kitPrice} onChange={(event) => updateBulkRow(row.id, { kitPrice: event.target.value })} placeholder="= Precio" /></TableCell>
                                  <TableCell>
                                    <Select value={row.trackingMode} onValueChange={(value: 'none' | 'serial' | 'lot') => updateBulkRow(row.id, { trackingMode: value })}>
                                      <SelectTrigger className="min-w-[140px]"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">Sin seguimiento</SelectItem>
                                        <SelectItem value="serial">Serie</SelectItem>
                                        <SelectItem value="lot">Lote</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4"
                                      checked={row.requiresSerialization}
                                      onChange={(event) => updateBulkRow(row.id, { requiresSerialization: event.target.checked })}
                                    />
                                  </TableCell>
                                  <TableCell><Input className="min-w-[100px]" type="number" value={row.initialQuantity} onChange={(event) => updateBulkRow(row.id, { initialQuantity: event.target.value })} /></TableCell>
                                  <TableCell><Input className="min-w-[160px]" value={row.imageUrl} onChange={(event) => updateBulkRow(row.id, { imageUrl: event.target.value })} placeholder="https://..." /></TableCell>
                                  <TableCell>
                                    <Button variant="destructive" size="sm" onClick={() => removeBulkRow(row.id)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    <datalist id="bulk-category-options">
                      {categoryOptions.map((category) => (
                        <option key={category} value={category} />
                      ))}
                    </datalist>

                    {bulkResults.length > 0 ? (
                      <div className="rounded-lg border border-border/70 p-3 text-sm space-y-1">
                        {bulkResults.map((result) => (
                          <p key={`${result.row_index}-${result.status}`} className={result.status === 'ok' ? 'text-emerald-600' : 'text-red-600'}>
                            Fila {result.row_index + 1}: {result.status} - {result.message}
                          </p>
                        ))}
                      </div>
                    ) : null}

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm text-muted-foreground">
                        {bulkRows.length} fila{bulkRows.length === 1 ? '' : 's'} · {bulkValidCount} lista{bulkValidCount === 1 ? '' : 's'} para subir
                        {bulkValidCount < bulkRows.length ? ' (faltan nombre, categoría, costo o precio en algunas filas)' : ''}
                      </p>
                      <Button onClick={() => void saveBulkProducts()} disabled={isSaving || bulkValidCount === 0}>
                        <Upload className="w-4 h-4 mr-2" />
                        {isSaving ? 'Procesando...' : `Subir ${bulkValidCount} producto${bulkValidCount === 1 ? '' : 's'}`}
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
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Precio de compra</label>
                        <Input type="number" step="0.01" value={productForm.cost} onChange={(event) => setProductForm((prev) => ({ ...prev, cost: event.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Precio de venta</label>
                        <Input type="number" step="0.01" value={productForm.price} onChange={(event) => setProductForm((prev) => ({ ...prev, price: event.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Precio kit</label>
                        <Input type="number" step="0.01" value={productForm.kitPrice} onChange={(event) => setProductForm((prev) => ({ ...prev, kitPrice: event.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Precio máximo (%)</label>
                        <Input
                          type="number"
                          min={100}
                          step={1}
                          value={productForm.quotationMaxPercent}
                          onChange={(event) => setProductForm((prev) => ({ ...prev, quotationMaxPercent: event.target.value }))}
                        />
                        <p className="text-xs text-muted-foreground">
                          Máximo sugerido: Bs {getMaxQuotationPriceFromPercent(
                            Number(productForm.price || 0),
                            Number(productForm.quotationMaxPercent || DEFAULT_QUOTATION_MAX_PERCENT),
                          ).toFixed(2)}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Precio mínimo</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={productForm.quotationMinPrice}
                          onChange={(event) => setProductForm((prev) => ({ ...prev, quotationMinPrice: event.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Stock inicial</label>
                        <Input type="number" step="0.01" value={productForm.initialQuantity} onChange={(event) => setProductForm((prev) => ({ ...prev, initialQuantity: event.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Stock mínimo</label>
                        <Input type="number" step="0.01" value={productForm.minQuantity} onChange={(event) => setProductForm((prev) => ({ ...prev, minQuantity: event.target.value }))} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-foreground">Requiere serialización</label>
                        <SerializationToggleCard
                          checked={productForm.requiresSerialization}
                          onCheckedChange={(checked) => setProductForm((prev) => ({ ...prev, requiresSerialization: checked }))}
                        />
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
          <Card className="card-financial">
            <CardContent className="pt-6 text-sm text-amber-700 dark:text-amber-300">
              Solo el rol admin puede crear o modificar inventario. Tu rol actual es: {activeRole}.
            </CardContent>
          </Card>
        ) : null}

        {error ? (
          <Card className="card-alert">
            <CardContent className="pt-6 text-sm text-red-700 dark:text-red-300">{error}</CardContent>
          </Card>
        ) : null}

        <InventorySubnav />

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Select value={inventoryReportVariant} onValueChange={(value: 'detailed' | 'stock-check' | 'sale-price') => setInventoryReportVariant(value)}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {canSeePurchasePrice && (
                <SelectItem value="detailed">Reporte con precios</SelectItem>
              )}
              <SelectItem value="sale-price">Reporte precio de venta</SelectItem>
              <SelectItem value="stock-check">Reporte control (sin precios)</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            disabled={filteredParts.length === 0}
            onClick={() => {
              const branchName = branches.find((b) => b.id === activeBranchId)?.name || 'Sucursal'
              generateInventoryPdf({
                branchName,
                variant: inventoryReportVariant,
                rows: filteredParts.map((p) => ({
                  code: p.code,
                  stock: stockByPartId[p.id] ?? 0,
                  name: p.name,
                  branch: branchName,
                  cost: p.cost,
                  price: p.price,
                  quotationMinPrice: getQuotationRange(p).min,
                  quotationMaxPrice: getQuotationRange(p).max,
                })),
              })
            }}
          >
            <Download className="mr-2 h-4 w-4" /> Descargar PDF de inventario
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={filteredParts.length === 0}
            onClick={() => {
              const branchName = branches.find((b) => b.id === activeBranchId)?.name || 'Sucursal'
              const rows = filteredParts.map((p) => ({
                code: p.code,
                stock: stockByPartId[p.id] ?? 0,
                name: p.name,
                branch: branchName,
                cost: p.cost,
                price: p.price,
                quotationMinPrice: getQuotationRange(p).min,
                quotationMaxPrice: getQuotationRange(p).max,
              }))
              if (inventoryReportVariant === 'stock-check') {
                exportToExcel({
                  fileName: `inventario_control_${branchName.replace(/\s+/g, '_')}`,
                  headers: ['Sucursal', 'Codigo producto', 'Nombre producto', 'Stock'],
                  rows: rows.map((r) => [r.branch || branchName, r.code, r.name, r.stock]),
                })
                return
              }
              if (inventoryReportVariant === 'sale-price') {
                exportToExcel({
                  fileName: `inventario_${branchName.replace(/\s+/g, '_')}`,
                  headers: ['#', 'Codigo', 'Stock', 'Producto', 'Precio venta', 'Precio mínimo', 'Precio máximo'],
                  rows: rows.map((r, index) => [
                    index + 1,
                    r.code,
                    r.stock,
                    r.name,
                    r.price ?? 0,
                    r.quotationMinPrice,
                    r.quotationMaxPrice,
                  ]),
                })
                return
              }
              exportToExcel({
                fileName: `inventario_${branchName.replace(/\s+/g, '_')}`,
                headers: ['#', 'Codigo', 'Stock', 'Producto', 'Precio compra', 'Precio venta', 'Precio mínimo', 'Precio máximo'],
                rows: rows.map((r, index) => [
                  index + 1,
                  r.code,
                  r.stock,
                  r.name,
                  r.cost ?? 0,
                  r.price ?? 0,
                  r.quotationMinPrice,
                  r.quotationMaxPrice,
                ]),
              })
            }}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Descargar Excel
          </Button>
        </div>

        <Card className="card-info">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <SlidersHorizontal className="w-4 h-4" />
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
                <SearchableStringPick
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                  options={[
                    { value: 'all', label: 'Todas las categorías' },
                    ...categoryOptions.map((cat) => ({ value: cat, label: cat })),
                  ]}
                  placeholder="Todas las categorías"
                  searchPlaceholder="Buscar categoría..."
                />
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

        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Catálogo de productos</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                onClick={() => setViewMode('cards')}
              >
                <LayoutGrid className="mr-2 h-4 w-4" />
                Tarjetas
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'rows' ? 'default' : 'outline'}
                onClick={() => setViewMode('rows')}
              >
                <List className="mr-2 h-4 w-4" />
                Filas
              </Button>
            </div>
            <Badge className="bg-primary/15 text-primary">{isLoading ? 'Cargando...' : `${filteredParts.length} productos`}</Badge>
          </div>
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
                {canSeeFullProductDetails ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <p><span className="font-medium">Categoría:</span> {selectedProduct.category}</p>
                      <p><span className="font-medium">Stock disponible:</span> {selectedStock}</p>
                      <p><span className="font-medium">Sucursal:</span> {branches.find((b) => b.id === selectedProduct.branch_id)?.name || selectedProduct.branch_id}</p>
                      {canSeePurchasePrice && (
                        <p><span className="font-medium">Precio de compra:</span> Bs {selectedProduct.cost.toFixed(2)}</p>
                      )}
                      <p><span className="font-medium">Precio de venta:</span> Bs {selectedProduct.price.toFixed(2)}</p>
                      <p><span className="font-medium">Precio kit:</span> Bs {(selectedProduct.kit_price ?? selectedProduct.price).toFixed(2)}</p>
                      <p><span className="font-medium">Seguimiento:</span> {getTrackingModeLabel(selectedProduct.tracking_mode)}</p>
                      <p><span className="font-medium">Serialización:</span> {selectedProduct.requires_serialization ? 'sí' : 'no'}</p>
                      <p><span className="font-medium">Cotización:</span> Bs {getQuotationRange(selectedProduct).max.toFixed(2)} - Bs {getQuotationRange(selectedProduct).min.toFixed(2)}</p>
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
                  </>
                ) : (
                  <div className="rounded-md border border-border/70 bg-background/70 p-3">
                    <p className="text-sm font-medium mb-2">Disponibilidad por sucursal</p>
                    {(() => {
                      const key = normalizePartCode(selectedProduct.code)
                      const rows = availabilityByCode[key] || []
                      const loading = availabilityLoadingByCode[key]
                      if (loading) return <p className="text-xs text-muted-foreground">Cargando disponibilidad...</p>
                      if (rows.length === 0) return <p className="text-xs text-muted-foreground">Sin datos de disponibilidad.</p>
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          {rows.map((row) => (
                            <div key={`${row.branch_id}-${row.part_id}`} className="flex items-center justify-between rounded-md border border-border/60 px-2 py-1">
                              <div className="min-w-0">
                                <p className="font-medium truncate">{row.branch_name}</p>
                                <p className="text-muted-foreground">Venta Bs {row.price.toFixed(2)}</p>
                              </div>
                              <span className={row.quantity <= 0 ? 'font-semibold text-red-500' : 'font-semibold text-foreground'}>
                                {row.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                  </div>
                )}

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
                <label className="text-sm font-medium text-foreground">Precio de compra</label>
                <Input type="number" step="0.01" value={editForm.cost} onChange={(event) => setEditForm((prev) => ({ ...prev, cost: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Precio de venta</label>
                <Input type="number" step="0.01" value={editForm.price} onChange={(event) => setEditForm((prev) => ({ ...prev, price: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Precio kit</label>
                <Input type="number" step="0.01" value={editForm.kitPrice} onChange={(event) => setEditForm((prev) => ({ ...prev, kitPrice: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Precio máximo (%)</label>
                <Input
                  type="number"
                  min={100}
                  step={1}
                  value={editForm.quotationMaxPercent}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, quotationMaxPercent: event.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Máximo sugerido: Bs {getMaxQuotationPriceFromPercent(
                    Number(editForm.price || 0),
                    Number(editForm.quotationMaxPercent || DEFAULT_QUOTATION_MAX_PERCENT),
                  ).toFixed(2)}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Precio mínimo</label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.quotationMinPrice}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, quotationMinPrice: event.target.value }))}
                />
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
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Requiere serialización</label>
                <SerializationToggleCard
                  checked={editForm.requiresSerialization}
                  onCheckedChange={(checked) => setEditForm((prev) => ({ ...prev, requiresSerialization: checked }))}
                />
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

            <div className="flex items-center justify-between gap-2">
              {canModify ? (
                <Button
                  variant="destructive"
                  disabled={isSaving}
                  onClick={() => {
                    const part = parts.find((p) => p.id === editingProductId)
                    if (part) openDeleteProduct(part)
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar producto
                </Button>
              ) : <span />}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
                <Button onClick={() => void saveEditedProduct()} disabled={isSaving}>
                  {isSaving ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {viewMode === 'cards' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {paginatedParts.map((part) => {
              const branchName = branches.find((branch) => branch.id === part.branch_id)?.name ?? part.branch_id
              const tiers = [...(part.price_tiers || [])]
                .filter((tier) => tier.min_quantity > 1)
                .sort((a, b) => a.min_quantity - b.min_quantity)
              const stockValue = stockByPartId[part.id] ?? 0

              return (
                <article key={part.id} className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border transition-colors duration-150 ${
                  stockValue <= 0
                    ? 'border-red-300/60 dark:border-red-800/50 bg-red-50/70 dark:bg-red-950/20 hover:border-red-400/70'
                    : 'border-green-200/70 dark:border-green-800/40 bg-green-50/70 dark:bg-green-950/20 hover:border-green-400/60'
                }`}>
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img src={part.image_url || '/placeholder.svg'} alt={part.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = '/placeholder.svg' }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      <Badge className="bg-primary/90 text-primary-foreground">{part.code}</Badge>
                      {part.tracking_mode === 'serial' && (
                        <Badge className="bg-sky-500/90 text-white border-sky-400/50 text-[10px] px-1.5">Serie</Badge>
                      )}
                      {part.tracking_mode === 'lot' && (
                        <Badge className="bg-amber-500/90 text-black border-amber-400/50 text-[10px] px-1.5">Lote</Badge>
                      )}
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-white text-sm font-semibold leading-snug break-words">{part.name}</p>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-3">
                    <div className="text-xs text-muted-foreground">{branchName}</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Stock disponible</span>
                      <span className={stockValue <= 0 ? 'font-semibold text-red-500' : 'font-semibold text-foreground'}>
                        {stockValue}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      {canSeePurchasePrice ? (
                        <div className="flex items-center gap-1 rounded-md border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-500">
                          <Tags className="w-3 h-3" /> Compra: Bs {part.cost.toFixed(2)}
                        </div>
                      ) : <span />}
                      <p className="text-lg font-bold text-primary">Bs {getEffectiveProductPrice(part).toFixed(2)}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Precio kit: <span className="font-semibold text-foreground">Bs {(part.kit_price ?? part.price).toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Cotización: <span className="font-semibold text-foreground">Bs {getQuotationRange(part).max.toFixed(2)} - Bs {getQuotationRange(part).min.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {part.tracking_mode === 'serial' && (
                        <span className="inline-flex items-center rounded-full border border-sky-400/50 bg-sky-500/15 px-2 py-0.5 text-[10px] font-medium text-sky-400">
                          Control por serie
                        </span>
                      )}
                      {part.tracking_mode === 'lot' && (
                        <span className="inline-flex items-center rounded-full border border-amber-400/50 bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                          Control por lote
                        </span>
                      )}
                      {part.tracking_mode === 'none' && (
                        <span className="inline-flex items-center rounded-full border border-border/50 bg-muted/30 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          Sin seguimiento
                        </span>
                      )}
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
                    <div className="mt-auto flex gap-1.5">
                      <Button className="flex-1" size="sm" variant="outline" onClick={() => openProductDetail(part)}>
                        <Boxes className="w-4 h-4 mr-2" />
                        {canSeeFullProductDetails ? 'Ver detalle' : 'Ver disponibilidad'}
                      </Button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedParts.map((part) => {
              const branchName = branches.find((branch) => branch.id === part.branch_id)?.name ?? part.branch_id
              const tiers = [...(part.price_tiers || [])]
                .filter((tier) => tier.min_quantity > 1)
                .sort((a, b) => a.min_quantity - b.min_quantity)
              const stockValue = stockByPartId[part.id] ?? 0
              const isExpanded = expandedRowId === part.id
              const availabilityKey = normalizePartCode(part.code)
              const availabilityRows = availabilityByCode[availabilityKey] || []
              const availabilityLoading = availabilityLoadingByCode[availabilityKey]

              return (
                <div key={part.id} className="rounded-2xl border border-border/70 bg-card/90">
                  <button
                    type="button"
                    className="flex w-full flex-col gap-3 px-4 py-3 text-left md:flex-row md:items-center md:justify-between"
                    onClick={() => {
                      setExpandedRowId((prev) => {
                        const next = prev === part.id ? null : part.id
                        if (next) {
                          void ensureAvailabilityForCode(part.code)
                        }
                        return next
                      })
                    }}
                    aria-expanded={isExpanded}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold break-words">{part.name}</p>
                      <p className="text-xs text-muted-foreground">Codigo {part.code}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="text-left md:text-right">
                        <p className="text-xs text-muted-foreground">Stock</p>
                        <p className={stockValue <= 0 ? 'font-semibold text-red-500' : 'font-semibold text-foreground'}>{stockValue}</p>
                      </div>
                      <div className="text-left md:text-right">
                        <p className="text-xs text-muted-foreground">Precio</p>
                        <p className="text-sm font-semibold text-primary">Bs {getEffectiveProductPrice(part).toFixed(2)}</p>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {isExpanded ? (
                    <div className="border-t border-border/70 px-4 py-3 space-y-3">
                      {canSeeFullProductDetails && (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <p><span className="font-medium">Sucursal:</span> {branchName}</p>
                            <p><span className="font-medium">Stock disponible:</span> {stockValue}</p>
                            {canSeePurchasePrice && (
                              <p><span className="font-medium">Precio de compra:</span> Bs {part.cost.toFixed(2)}</p>
                            )}
                            <p><span className="font-medium">Precio kit:</span> Bs {(part.kit_price ?? part.price).toFixed(2)}</p>
                            <p><span className="font-medium">Cotización:</span> Bs {getQuotationRange(part).max.toFixed(2)} - Bs {getQuotationRange(part).min.toFixed(2)}</p>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {part.tracking_mode === 'serial' && (
                              <span className="inline-flex items-center rounded-full border border-sky-400/50 bg-sky-500/15 px-2 py-0.5 text-[10px] font-medium text-sky-400">
                                Control por serie
                              </span>
                            )}
                            {part.tracking_mode === 'lot' && (
                              <span className="inline-flex items-center rounded-full border border-amber-400/50 bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                                Control por lote
                              </span>
                            )}
                            {part.tracking_mode === 'none' && (
                              <span className="inline-flex items-center rounded-full border border-border/50 bg-muted/30 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                Sin seguimiento
                              </span>
                            )}
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
                        </>
                      )}

                      <div className="rounded-md border border-border/70 bg-background/70 p-3">
                        <p className="text-sm font-medium mb-2">Disponibilidad por sucursal</p>
                        {availabilityLoading ? (
                          <p className="text-xs text-muted-foreground">Cargando disponibilidad...</p>
                        ) : availabilityRows.length === 0 ? (
                          <p className="text-xs text-muted-foreground">Sin datos de disponibilidad para este producto.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            {availabilityRows.map((row) => (
                              <div key={`${row.branch_id}-${row.part_id}`} className="flex items-center justify-between rounded-md border border-border/60 px-2 py-1">
                                <div className="min-w-0">
                                  <p className="font-medium truncate">{row.branch_name}</p>
                                  <p className="text-muted-foreground">
                                    {canSeePurchasePrice && `Precio de compra Bs ${row.cost.toFixed(2)} · `}
                                    Venta Bs {row.price.toFixed(2)}
                                  </p>
                                </div>
                                <span className={row.quantity <= 0 ? 'font-semibold text-red-500' : 'font-semibold text-foreground'}>
                                  {row.quantity}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {canSeeFullProductDetails && (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openProductDetail(part)}>
                            <Boxes className="w-4 h-4 mr-2" />
                            Ver detalle
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalProductPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => { e.preventDefault(); setProductsPage((p) => Math.max(1, p - 1)) }}
                  aria-disabled={productsPage === 1}
                  className={productsPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              {Array.from({ length: totalProductPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    isActive={page === productsPage}
                    onClick={(e) => { e.preventDefault(); setProductsPage(page) }}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => { e.preventDefault(); setProductsPage((p) => Math.min(totalProductPages, p + 1)) }}
                  aria-disabled={productsPage === totalProductPages}
                  className={productsPage === totalProductPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}

        {/* Delete Product Confirmation */}
        <AlertDialog open={isDeleteProductOpen} onOpenChange={setIsDeleteProductOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
              <AlertDialogDescription>
                El producto <strong>&quot;{deleteProductTarget?.name}&quot;</strong> ({deleteProductTarget?.code}) será
                desactivado. No se eliminará permanentemente y podrá ser restaurado por un administrador.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="sm:justify-between">
              <AlertDialogAction
                onClick={() => void handleDeleteProduct()}
                disabled={isSaving}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isSaving ? 'Eliminando...' : 'Eliminar producto'}
              </AlertDialogAction>
              <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  )
}
