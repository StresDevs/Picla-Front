'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { InventorySubnav } from '@/components/modules/inventory/inventory-subnav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  branchesService,
  catalogImportService,
  partsService,
} from '@/lib/supabase/inventory'
import {
  ACTIVE_ROLE_EVENT,
  getActiveUserContext,
  type AppUserRole,
} from '@/lib/mock/runtime-store'
import type { Part } from '@/types/database'

interface ImportPriceRow {
  id: string
  sourcePart: Part
  targetPartId: string | null
  targetPartName: string | null
  selected: boolean
  price: string
  kitPrice: string
  quotationMinPrice: string
  quotationMaxPrice: string
}

function normalizeCode(value: string) {
  return value.trim().toLowerCase()
}

function formatAdjusted(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : '0.00'
}

function buildImportRows(sourceProducts: Part[], targetProducts: Part[]) {
  const targetByCode = new Map<string, Part>()
  for (const target of targetProducts) {
    targetByCode.set(normalizeCode(target.code), target)
  }

  return sourceProducts.map((source) => {
    const target = targetByCode.get(normalizeCode(source.code))
    return {
      id: source.id,
      sourcePart: source,
      targetPartId: target?.id || null,
      targetPartName: target?.name || null,
      selected: true,
      price: formatAdjusted(Number(source.price || 0)),
      kitPrice: formatAdjusted(Number(source.kit_price ?? source.price ?? 0)),
      quotationMinPrice:
        source.quotation_min_price === undefined || source.quotation_min_price === null
          ? ''
          : formatAdjusted(Number(source.quotation_min_price)),
      quotationMaxPrice:
        source.quotation_max_price === undefined || source.quotation_max_price === null
          ? ''
          : formatAdjusted(Number(source.quotation_max_price)),
    } as ImportPriceRow
  })
}

export default function InventoryCatalogImportPage() {
  const [activeRole, setActiveRole] = useState<AppUserRole>(() => getActiveUserContext().role)
  const [activeBranchId, setActiveBranchId] = useState(() => getActiveUserContext().branch_id)

  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([])
  const [importFromBranch, setImportFromBranch] = useState('')
  const [importToBranch, setImportToBranch] = useState('')
  const [importRows, setImportRows] = useState<ImportPriceRow[]>([])
  const [importPercent, setImportPercent] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isImporting, setIsImporting] = useState(false)
  const [isImportLoading, setIsImportLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    const syncContext = () => {
      const context = getActiveUserContext()
      setActiveRole(context.role)
      setActiveBranchId(context.branch_id)
    }

    const initialize = async () => {
      setIsLoading(true)
      setError(null)
      try {
        syncContext()
        const branchRows = await branchesService.getAll()
        setBranches(branchRows)

        const context = getActiveUserContext()
        const defaultFrom = context.branch_id || branchRows[0]?.id || ''
        const defaultTo = branchRows.find((branch) => branch.id !== defaultFrom)?.id || defaultFrom

        setImportFromBranch(defaultFrom)
        setImportToBranch(defaultTo)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar importación de catálogo')
      } finally {
        setIsLoading(false)
      }
    }

    void initialize()
    window.addEventListener(ACTIVE_ROLE_EVENT, syncContext)
    window.addEventListener('focus', syncContext)

    return () => {
      window.removeEventListener(ACTIVE_ROLE_EVENT, syncContext)
      window.removeEventListener('focus', syncContext)
    }
  }, [])

  useEffect(() => {
    if (!importFromBranch || !importToBranch || importFromBranch === importToBranch) {
      setImportRows([])
      return
    }

    const loadProducts = async () => {
      setIsImportLoading(true)
      setError(null)
      try {
        const [sourceProducts, targetProducts] = await Promise.all([
          partsService.getAll(importFromBranch),
          partsService.getAll(importToBranch),
        ])
        setImportRows(buildImportRows(sourceProducts, targetProducts))
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar productos para importación')
      } finally {
        setIsImportLoading(false)
      }
    }

    void loadProducts()
  }, [importFromBranch, importToBranch])

  const updateImportRow = (id: string, patch: Partial<ImportPriceRow>) => {
    setImportRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  const setAllImportSelection = (selected: boolean) => {
    setImportRows((prev) => prev.map((row) => ({ ...row, selected })))
  }

  const applyPercentageToAllImportRows = () => {
    const factor = 1 + importPercent / 100
    setImportRows((prev) =>
      prev.map((row) => {
        if (!row.selected) return row

        const basePrice = Number(row.sourcePart.price || 0)
        const baseKitPrice = Number(row.sourcePart.kit_price ?? row.sourcePart.price ?? 0)
        const baseMin = row.sourcePart.quotation_min_price
        const baseMax = row.sourcePart.quotation_max_price

        return {
          ...row,
          price: formatAdjusted(basePrice * factor),
          kitPrice: formatAdjusted(baseKitPrice * factor),
          quotationMinPrice:
            baseMin === undefined || baseMin === null ? '' : formatAdjusted(Number(baseMin) * factor),
          quotationMaxPrice:
            baseMax === undefined || baseMax === null ? '' : formatAdjusted(Number(baseMax) * factor),
        }
      }),
    )
  }

  const importCatalog = async () => {
    if (activeRole !== 'admin') {
      setFeedback('Solo admin puede importar productos entre sucursales.')
      return
    }

    if (!importFromBranch || !importToBranch || importFromBranch === importToBranch) {
      setFeedback('Selecciona sucursal origen y destino diferentes para importar productos.')
      return
    }

    const selectedRows = importRows.filter((row) => row.selected)
    if (selectedRows.length === 0) {
      setFeedback('Selecciona al menos un producto para importar.')
      return
    }

    setIsImporting(true)
    setError(null)
    setFeedback(null)
    try {
      for (const row of selectedRows) {
        const source = row.sourcePart
        const adjustedPrice = Number(row.price || source.price || 0)
        const safeSourcePrice = Number(source.price || 0)
        const factor = safeSourcePrice > 0 ? adjustedPrice / safeSourcePrice : 1
        const adjustedKitPrice = Number(row.kitPrice || source.kit_price || source.price || 0)

        const adjustedTiers = (source.price_tiers || []).map((tier) => ({
          id: tier.id,
          min_quantity: tier.min_quantity,
          price: Number((tier.price * factor).toFixed(2)),
        }))

        await catalogImportService.importProduct({
          sourcePart: source,
          targetBranchId: importToBranch,
          targetPartId: row.targetPartId,
          price: adjustedPrice,
          kit_price: adjustedKitPrice,
          quotation_min_price: row.quotationMinPrice ? Number(row.quotationMinPrice) : null,
          quotation_max_price: row.quotationMaxPrice ? Number(row.quotationMaxPrice) : null,
          price_tiers: adjustedTiers,
        })
      }

      const [sourceProducts, targetProducts] = await Promise.all([
        partsService.getAll(importFromBranch),
        partsService.getAll(importToBranch),
      ])
      setImportRows(buildImportRows(sourceProducts, targetProducts))
      setFeedback(`Importación completada: ${selectedRows.length} productos sincronizados.`)
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'No se pudo importar catálogo')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Importación de catálogo"
          description="Sincroniza productos entre sucursales y ajusta precios manualmente o por porcentaje"
        />
        <InventorySubnav />

        {error ? (
          <Card className="border-red-500/40 bg-red-500/5">
            <CardContent className="pt-6 text-sm text-red-700 dark:text-red-300">{error}</CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Importar catálogo entre sucursales</CardTitle>
            <CardDescription>
              Copia productos desde una sucursal a otra manteniendo estructura comercial y permitiendo ajustar precios antes de guardar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeRole !== 'admin' ? (
              <p className="text-sm text-muted-foreground">Solo admin puede ejecutar importaciones entre sucursales.</p>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sucursal origen</label>
                <Select value={importFromBranch} onValueChange={setImportFromBranch}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Sucursal destino</label>
                <Select value={importToBranch} onValueChange={setImportToBranch}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2 xl:col-span-1">
                <label className="text-sm font-medium">Ajuste global (%)</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="range"
                    min={-50}
                    max={100}
                    step={1}
                    value={importPercent}
                    onChange={(event) => setImportPercent(Number(event.target.value))}
                  />
                  <Input
                    type="number"
                    min={-50}
                    max={100}
                    step={1}
                    value={importPercent}
                    onChange={(event) => setImportPercent(Number(event.target.value || 0))}
                    className="w-20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Acciones</label>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={applyPercentageToAllImportRows} disabled={activeRole !== 'admin' || importRows.length === 0}>Aplicar %</Button>
                  <Button onClick={() => void importCatalog()} disabled={activeRole !== 'admin' || isImporting || importRows.length === 0 || isLoading}>
                    {isImporting ? 'Importando...' : 'Importar'}
                  </Button>
                </div>
              </div>
            </div>

            {feedback ? (
              <div className="rounded-lg border border-primary/25 bg-primary/10 px-3 py-2 text-sm">
                {feedback}
              </div>
            ) : null}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{isImportLoading ? 'Cargando productos...' : `${importRows.length} productos disponibles para importar`}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setAllImportSelection(true)} disabled={importRows.length === 0}>Seleccionar todo</Button>
                <Button size="sm" variant="outline" onClick={() => setAllImportSelection(false)} disabled={importRows.length === 0}>Quitar todo</Button>
              </div>
            </div>

            <div className="space-y-2 max-h-[420px] overflow-y-auto rounded-lg border border-border/70 p-2">
              {importRows.map((row) => (
                <div key={row.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 rounded-md border border-border/60 p-2 text-sm">
                  <div className="md:col-span-4 space-y-1">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={row.selected}
                        onChange={(event) => updateImportRow(row.id, { selected: event.target.checked })}
                      />
                      <span className="font-medium">{row.sourcePart.name}</span>
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {row.sourcePart.code} | {row.targetPartId ? `Actualiza ${row.targetPartName || 'producto destino'}` : 'Crea producto nuevo en destino'}
                    </p>
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs">Precio venta</label>
                    <Input type="number" step="0.01" value={row.price} onChange={(event) => updateImportRow(row.id, { price: event.target.value })} />
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs">Precio kit</label>
                    <Input type="number" step="0.01" value={row.kitPrice} onChange={(event) => updateImportRow(row.id, { kitPrice: event.target.value })} />
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs">Cotización mínima</label>
                    <Input type="number" step="0.01" value={row.quotationMinPrice} onChange={(event) => updateImportRow(row.id, { quotationMinPrice: event.target.value })} />
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs">Cotización máxima</label>
                    <Input type="number" step="0.01" value={row.quotationMaxPrice} onChange={(event) => updateImportRow(row.id, { quotationMaxPrice: event.target.value })} />
                  </div>
                </div>
              ))}

              {!isImportLoading && importRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay productos para importar con la combinación seleccionada.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-zinc-500">Sucursal activa actual: {activeBranchId || 'No disponible'}</p>
      </div>
    </MainLayout>
  )
}