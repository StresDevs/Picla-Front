'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { InventorySubnav } from '@/components/modules/inventory/inventory-subnav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { branchesService, partsService } from '@/lib/supabase/inventory'
import { getSupabaseClient } from '@/lib/supabase/client'
import { ACTIVE_ROLE_EVENT, getActiveUserContext, type AppUserRole } from '@/lib/mock/runtime-store'

interface BranchOption {
  id: string
  name: string
}

interface PriceMatrixPartRow {
  id: string
  code: string
  name: string
  category: string | null
  branch_id: string
  price: number
  is_active: boolean | null
}

interface MatrixCell {
  partId: string
  price: number
}

interface MatrixRow {
  code: string
  name: string
  category: string | null
  cells: Record<string, MatrixCell>
}

const CENTRAL_BRANCH_ID = 'c2d40d4a-213b-4a65-bfc5-95f8cf64fa61'

function normalizeCode(value: string) {
  return value.trim().toLowerCase()
}

function formatPrice(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : '0.00'
}

export default function InventoryPriceMatrixPage() {
  const [activeRole, setActiveRole] = useState<AppUserRole>(() => getActiveUserContext().role)
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [parts, setParts] = useState<PriceMatrixPartRow[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [rowsPerPage, setRowsPerPage] = useState(15)
  const [currentPage, setCurrentPage] = useState(1)
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({})
  const [savingCells, setSavingCells] = useState<Record<string, boolean>>({})

  const canEdit = activeRole === 'admin'

  useEffect(() => {
    const syncRole = () => {
      setActiveRole(getActiveUserContext().role)
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
    const loadMatrix = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const [branchRows] = await Promise.all([
          branchesService.getAll(),
        ])
        setBranches(branchRows)

        if (!canEdit) {
          setParts([])
          return
        }

        const supabase = getSupabaseClient()
        const { data, error: partsError } = await supabase
          .from('parts')
          .select('id, code, name, category, branch_id, price, is_active')
          .eq('is_active', true)
          .order('code', { ascending: true })

        if (partsError) throw partsError
        setParts((data as PriceMatrixPartRow[]) || [])
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la matriz de precios')
      } finally {
        setIsLoading(false)
      }
    }

    void loadMatrix()
  }, [canEdit])

  const categories = useMemo(() => {
    const items = new Set(parts.map((part) => part.category || 'Sin categoria'))
    return ['all', ...Array.from(items).sort((a, b) => a.localeCompare(b, 'es'))]
  }, [parts])

  const matrixRows = useMemo(() => {
    const rows = new Map<string, MatrixRow>()

    for (const part of parts) {
      const key = normalizeCode(part.code)
      const existing = rows.get(key)
      const fallbackName = part.name
      const fallbackCategory = part.category

      if (!existing) {
        rows.set(key, {
          code: part.code,
          name: fallbackName,
          category: fallbackCategory,
          cells: {
            [part.branch_id]: {
              partId: part.id,
              price: Number(part.price || 0),
            },
          },
        })
      } else {
        existing.cells[part.branch_id] = {
          partId: part.id,
          price: Number(part.price || 0),
        }
        if (part.branch_id === CENTRAL_BRANCH_ID) {
          existing.name = fallbackName
          existing.category = fallbackCategory
        }
      }
    }

    return Array.from(rows.values())
  }, [parts])

  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return matrixRows.filter((row) => {
      const byTerm = !term || row.name.toLowerCase().includes(term) || row.code.toLowerCase().includes(term)
      const byCategory = categoryFilter === 'all' || (row.category || 'Sin categoria') === categoryFilter
      return byTerm && byCategory
    })
  }, [matrixRows, searchTerm, categoryFilter])

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredRows.length / Math.max(rowsPerPage, 1)))
  }, [filteredRows.length, rowsPerPage])

  const paginatedRows = useMemo(() => {
    const safeRowsPerPage = Math.max(rowsPerPage, 1)
    const start = (currentPage - 1) * safeRowsPerPage
    return filteredRows.slice(start, start + safeRowsPerPage)
  }, [filteredRows, currentPage, rowsPerPage])

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages))
  }, [totalPages])

  const handleRowsPerPageChange = (value: string) => {
    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setRowsPerPage(1)
      return
    }

    setRowsPerPage(Math.floor(parsed))
    setCurrentPage(1)
  }

  const handleDraftChange = (partId: string, value: string) => {
    setPriceDrafts((prev) => ({ ...prev, [partId]: value }))
  }

  const handleSavePrice = async (partId: string, currentPrice: number) => {
    if (!canEdit) return

    const draft = priceDrafts[partId] ?? formatPrice(currentPrice)
    const normalized = draft.trim().replace(',', '.')
    const parsed = Number(normalized)

    if (!Number.isFinite(parsed) || parsed <= 0) {
      setPriceDrafts((prev) => ({ ...prev, [partId]: formatPrice(currentPrice) }))
      return
    }

    if (Number(parsed.toFixed(2)) === Number(currentPrice.toFixed(2))) {
      return
    }

    setSavingCells((prev) => ({ ...prev, [partId]: true }))
    setError(null)
    setFeedback(null)

    try {
      await partsService.updatePrice(partId, Number(parsed.toFixed(2)))
      setParts((prev) =>
        prev.map((part) =>
          part.id === partId ? { ...part, price: Number(parsed.toFixed(2)) } : part,
        ),
      )
      setFeedback('Precio actualizado correctamente.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo actualizar el precio')
      setPriceDrafts((prev) => ({ ...prev, [partId]: formatPrice(currentPrice) }))
    } finally {
      setSavingCells((prev) => ({ ...prev, [partId]: false }))
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Matriz de precios"
          description="Administra precios de venta por sucursal y producto en una sola vista."
        />
        <InventorySubnav />

        {!canEdit ? (
          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardContent className="pt-6 text-sm text-amber-700 dark:text-amber-300">
              Esta vista solo está disponible para administradores. Tu rol actual es: {activeRole}.
            </CardContent>
          </Card>
        ) : null}

        {error ? (
          <Card className="border-red-500/40 bg-red-500/5">
            <CardContent className="pt-6 text-sm text-red-700 dark:text-red-300">{error}</CardContent>
          </Card>
        ) : null}

        {feedback ? (
          <Card className="border-primary/25 bg-primary/10">
            <CardContent className="pt-6 text-sm text-primary">{feedback}</CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Precios por sucursal</CardTitle>
            <CardDescription>Filtra por nombre, codigo o categoria y edita cada celda.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <Input
                  placeholder="Buscar por nombre o código"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="min-w-[220px]"
                />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="min-w-[200px]">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Badge className="bg-primary/15 text-primary">
                {isLoading ? 'Cargando...' : `${filteredRows.length} productos`}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Filas por pagina</span>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={rowsPerPage}
                  onChange={(event) => handleRowsPerPageChange(event.target.value)}
                  className="h-8 w-20"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage <= 1}
                >
                  Anterior
                </Button>
                <span className="text-xs text-muted-foreground">
                  Pagina {currentPage} de {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage >= totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-border/70 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[260px] sticky left-0 bg-background z-10">Producto</TableHead>
                    {branches.map((branch) => (
                      <TableHead key={branch.id} className="min-w-[180px] text-center">
                        <span className="block max-w-[160px] whitespace-normal break-words">{branch.name}</span>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={branches.length + 1} className="text-sm text-muted-foreground">
                        Cargando matriz de precios...
                      </TableCell>
                    </TableRow>
                  ) : filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={branches.length + 1} className="text-sm text-muted-foreground">
                        No hay productos para mostrar con los filtros actuales.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedRows.map((row) => (
                      <TableRow key={row.code}>
                        <TableCell className="sticky left-0 bg-background z-10">
                          <div className="space-y-1">
                            <p className="font-medium leading-snug break-words">{row.name}</p>
                            <p className="text-xs text-muted-foreground">{row.code}</p>
                            <p className="text-[11px] text-muted-foreground">{row.category || 'Sin categoria'}</p>
                          </div>
                        </TableCell>
                        {branches.map((branch) => {
                          const cell = row.cells[branch.id]

                          if (!cell) {
                            return (
                              <TableCell key={`${row.code}-${branch.id}`} className="text-center">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground">X</span>
                                  </TooltipTrigger>
                                  <TooltipContent>Producto no existe en esta sucursal.</TooltipContent>
                                </Tooltip>
                              </TableCell>
                            )
                          }

                          const draftValue = priceDrafts[cell.partId] ?? formatPrice(cell.price)

                          return (
                            <TableCell key={cell.partId} className="text-center">
                              <div className="flex flex-col items-center gap-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min={0.01}
                                  value={draftValue}
                                  onChange={(event) => handleDraftChange(cell.partId, event.target.value)}
                                  onBlur={() => void handleSavePrice(cell.partId, cell.price)}
                                  className="h-8 w-24 text-center"
                                  disabled={!canEdit || savingCells[cell.partId]}
                                />
                                {savingCells[cell.partId] ? (
                                  <span className="text-[10px] text-muted-foreground">Guardando...</span>
                                ) : null}
                              </div>
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
