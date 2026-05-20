'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { ReportsSubnav } from '@/components/modules/reports/reports-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  RotateCw,
  PackageSearch,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { reportsService, type ReportCapitalProduct } from '@/lib/supabase/reports'
import { ACTIVE_ROLE_EVENT } from '@/lib/mock/runtime-store'
import { supabase } from '@/lib/supabase/client'

function formatBs(value: number) {
  return `Bs ${value.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatNum(value: number) {
  return value.toLocaleString('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 3 })
}

function stockStatusBadge(status: string) {
  if (status === 'sin_stock') return <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/30 text-[10px]">Sin stock</Badge>
  if (status === 'stock_bajo') return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px]">Stock bajo</Badge>
  return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">Normal</Badge>
}

const ITEMS_PER_PAGE = 20

export default function CapitalProductsPage() {
  const [products, setProducts] = useState<ReportCapitalProduct[]>([])
  const [allBranches, setAllBranches] = useState<{ id: string; name: string }[]>([])

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [branchFilter, setBranchFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('capital_cost')
  const [productLimit, setProductLimit] = useState(100)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const loadBranches = async () => {
      const { data } = await supabase.from('branches').select('id, name').order('name', { ascending: true })
      if (data) setAllBranches(data)
    }
    void loadBranches()
  }, [])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setPage(1)
    try {
      const bid = branchFilter === 'all' ? null : branchFilter
      const res = await reportsService.getCapitalProducts({
        branch_id: bid,
        search: searchTerm || null,
        sort_by: sortBy,
        limit: productLimit,
      })
      setProducts(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar productos')
    } finally {
      setIsLoading(false)
    }
  }, [branchFilter, searchTerm, sortBy, productLimit])

  useEffect(() => {
    void loadData()
    const onCtxChange = () => void loadData()
    window.addEventListener(ACTIVE_ROLE_EVENT, onCtxChange)
    return () => window.removeEventListener(ACTIVE_ROLE_EVENT, onCtxChange)
  }, [loadData])

  const totalPages = Math.max(1, Math.ceil(products.length / ITEMS_PER_PAGE))
  const paginated = useMemo(
    () => products.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
    [products, page],
  )

  // Grand totals across all products
  const totals = useMemo(() => ({
    stock: products.reduce((s, p) => s + Number(p.stock ?? 0), 0),
    cost: products.reduce((s, p) => s + Number(p.capital_cost ?? 0), 0),
    retail: products.reduce((s, p) => s + Number(p.capital_retail ?? 0), 0),
    profit: products.reduce((s, p) => s + Number(p.potential_profit ?? 0), 0),
  }), [products])

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Capital — Detalle por Producto" description="Vista detallada del capital invertido a nivel de producto individual" />
        <ReportsSubnav />

        {/* Filters */}
        <Card className="bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <PackageSearch className="h-5 w-5 text-emerald-400" />
                Filtros
              </span>
              <Button size="sm" onClick={() => void loadData()} disabled={isLoading}>
                <RotateCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Consultar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Sucursal</label>
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las sucursales</SelectItem>
                  {allBranches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Buscar producto</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8" placeholder="Nombre, código o categoría..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Ordenar por</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="capital_cost">Capital invertido</SelectItem>
                  <SelectItem value="capital_retail">Valor de venta</SelectItem>
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="name">Nombre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Límite</label>
              <Select value={String(productLimit)} onValueChange={(v) => setProductLimit(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50 productos</SelectItem>
                  <SelectItem value="100">100 productos</SelectItem>
                  <SelectItem value="250">250 productos</SelectItem>
                  <SelectItem value="500">500 productos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-500/40 bg-red-500/8">
            <CardContent className="pt-4 pb-4 text-sm text-red-300">{error}</CardContent>
          </Card>
        )}

        {/* Product table */}
        <Card className="bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageSearch className="h-5 w-5 text-emerald-400" />
              Productos
              {!isLoading && (
                <Badge variant="outline" className="ml-2 text-[10px]">
                  {products.length} {products.length === 1 ? 'producto' : 'productos'}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-muted/40" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No hay productos que coincidan con los filtros.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/60">
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Código</th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Producto</th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium hidden md:table-cell">Categoría</th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium hidden lg:table-cell">Sucursal</th>
                        <th className="text-right py-2 px-3 text-muted-foreground font-medium">Stock</th>
                        <th className="text-right py-2 px-3 text-muted-foreground font-medium">Costo U.</th>
                        <th className="text-right py-2 px-3 text-muted-foreground font-medium">Precio U.</th>
                        <th className="text-right py-2 px-3 text-muted-foreground font-medium hidden sm:table-cell">Kit</th>
                        <th className="text-right py-2 px-3 text-muted-foreground font-medium">Capital</th>
                        <th className="text-right py-2 px-3 text-muted-foreground font-medium hidden sm:table-cell">Valor Venta</th>
                        <th className="text-right py-2 px-3 text-muted-foreground font-medium hidden md:table-cell">Ganancia</th>
                        <th className="text-center py-2 px-3 text-muted-foreground font-medium">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((p) => (
                        <tr key={`${p.part_id}-${p.branch_id}`} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                          <td className="py-2 px-3 font-mono text-xs text-muted-foreground">{p.part_code}</td>
                          <td className="py-2 px-3"><p className="font-medium whitespace-nowrap">{p.part_name}</p></td>
                          <td className="py-2 px-3 hidden md:table-cell text-muted-foreground text-xs">{p.category_name}</td>
                          <td className="py-2 px-3 hidden lg:table-cell text-muted-foreground text-xs">{p.branch_name}</td>
                          <td className="py-2 px-3 text-right">
                            <span className={
                              Number(p.stock) === 0 ? 'text-rose-400'
                                : Number(p.stock) <= Number(p.min_stock) ? 'text-amber-400'
                                  : 'text-foreground'
                            }>{formatNum(Number(p.stock))}</span>
                            {Number(p.min_stock) > 0 && <span className="text-[10px] text-muted-foreground ml-1">/{formatNum(Number(p.min_stock))}</span>}
                          </td>
                          <td className="py-2 px-3 text-right text-muted-foreground">{formatBs(Number(p.unit_cost))}</td>
                          <td className="py-2 px-3 text-right font-semibold text-emerald-400">{formatBs(Number(p.unit_price))}</td>
                          <td className="py-2 px-3 text-right hidden sm:table-cell text-muted-foreground">
                            {Number(p.kit_price) > 0 ? formatBs(Number(p.kit_price)) : '—'}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-primary">{formatBs(Number(p.capital_cost))}</td>
                          <td className="py-2 px-3 text-right hidden sm:table-cell text-emerald-400">{formatBs(Number(p.capital_retail))}</td>
                          <td className="py-2 px-3 text-right hidden md:table-cell text-amber-400">{formatBs(Number(p.potential_profit))}</td>
                          <td className="py-2 px-3 text-center">{stockStatusBadge(p.stock_status)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-border/60 bg-muted/10">
                        <td colSpan={4} className="py-2 px-3 font-semibold text-muted-foreground hidden lg:table-cell">
                          Total ({products.length} productos)
                        </td>
                        <td colSpan={2} className="py-2 px-3 font-semibold text-muted-foreground lg:hidden">Total</td>
                        <td className="py-2 px-3 text-right font-bold">{formatNum(totals.stock)}</td>
                        <td className="py-2 px-3" />
                        <td className="py-2 px-3" />
                        <td className="py-2 px-3 hidden sm:table-cell" />
                        <td className="py-2 px-3 text-right font-bold text-primary">{formatBs(totals.cost)}</td>
                        <td className="py-2 px-3 text-right hidden sm:table-cell font-bold text-emerald-400">{formatBs(totals.retail)}</td>
                        <td className="py-2 px-3 text-right hidden md:table-cell font-bold text-amber-400">{formatBs(totals.profit)}</td>
                        <td className="py-2 px-3" />
                      </tr>
                    </tfoot>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <p className="text-xs text-muted-foreground">
                      Mostrando {((page - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(page * ITEMS_PER_PAGE, products.length)} de {products.length} · Página {page} de {totalPages}
                    </p>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
