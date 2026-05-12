'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { ReportsSubnav } from '@/components/modules/reports/reports-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  RotateCw,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { reportsService, type ReportCapitalCategory } from '@/lib/supabase/reports'
import { ACTIVE_ROLE_EVENT } from '@/lib/mock/runtime-store'
import { supabase } from '@/lib/supabase/client'

function formatBs(value: number) {
  return `Bs ${value.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatNum(value: number) {
  return value.toLocaleString('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 3 })
}

function CapitalBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="w-full h-2.5 rounded-full bg-muted/30 overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-700 ease-out ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

const ITEMS_PER_PAGE = 15
const CAT_COLORS = ['bg-violet-500', 'bg-indigo-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-fuchsia-500', 'bg-teal-500']

export default function CapitalCategoriesPage() {
  const [categories, setCategories] = useState<ReportCapitalCategory[]>([])
  const [allBranches, setAllBranches] = useState<{ id: string; name: string }[]>([])

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [branchFilter, setBranchFilter] = useState('all')
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
      const res = await reportsService.getCapitalByCategory({ branch_id: bid })
      setCategories(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar categorías')
    } finally {
      setIsLoading(false)
    }
  }, [branchFilter])

  useEffect(() => {
    void loadData()
    const onCtxChange = () => void loadData()
    window.addEventListener(ACTIVE_ROLE_EVENT, onCtxChange)
    return () => window.removeEventListener(ACTIVE_ROLE_EVENT, onCtxChange)
  }, [loadData])

  const totalPages = Math.max(1, Math.ceil(categories.length / ITEMS_PER_PAGE))
  const paginated = useMemo(
    () => categories.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
    [categories, page],
  )

  const maxCost = useMemo(
    () => Math.max(...categories.map((c) => Number(c.capital_cost ?? 0)), 1),
    [categories],
  )

  // Totals
  const totalCost = useMemo(() => categories.reduce((s, c) => s + Number(c.capital_cost ?? 0), 0), [categories])
  const totalRetail = useMemo(() => categories.reduce((s, c) => s + Number(c.capital_retail ?? 0), 0), [categories])
  const totalProfit = useMemo(() => categories.reduce((s, c) => s + Number(c.potential_profit ?? 0), 0), [categories])

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Capital por Categoría" description="Desglose del capital invertido agrupado por categoría de productos" />
        <ReportsSubnav />

        {/* Filter */}
        <div className="flex items-end gap-3">
          <div className="space-y-1.5 w-64">
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
          <Button size="sm" onClick={() => void loadData()} disabled={isLoading}>
            <RotateCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Consultar
          </Button>
        </div>

        {error && (
          <Card className="border-red-500/40 bg-red-500/8">
            <CardContent className="pt-4 pb-4 text-sm text-red-300">{error}</CardContent>
          </Card>
        )}

        {/* KPI totals */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-card/95">
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-muted-foreground">Capital Total</p>
              {isLoading ? <div className="h-7 w-24 animate-pulse rounded bg-muted/50 mt-1" /> : (
                <p className="text-2xl font-bold text-primary mt-1">{formatBs(totalCost)}</p>
              )}
              <p className="text-[11px] text-muted-foreground mt-0.5">{categories.length} categorías</p>
            </CardContent>
          </Card>
          <Card className="bg-card/95">
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-muted-foreground">Valor de Venta</p>
              {isLoading ? <div className="h-7 w-24 animate-pulse rounded bg-muted/50 mt-1" /> : (
                <p className="text-2xl font-bold text-emerald-400 mt-1">{formatBs(totalRetail)}</p>
              )}
            </CardContent>
          </Card>
          <Card className="bg-card/95">
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-muted-foreground">Ganancia Potencial</p>
              {isLoading ? <div className="h-7 w-24 animate-pulse rounded bg-muted/50 mt-1" /> : (
                <p className="text-2xl font-bold text-amber-400 mt-1">{formatBs(totalProfit)}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Categories list */}
        <Card className="bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-violet-400" />
              Categorías
              {!isLoading && (
                <Badge variant="outline" className="ml-2 text-[10px]">{categories.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/40" />
                ))}
              </div>
            ) : categories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin datos de categoría.</p>
            ) : (
              <>
                <div className="space-y-2.5">
                  {paginated.map((cat, idx) => {
                    const cost = Number(cat.capital_cost ?? 0)
                    const retail = Number(cat.capital_retail ?? 0)
                    const profit = Number(cat.potential_profit ?? 0)
                    const barColor = CAT_COLORS[((page - 1) * ITEMS_PER_PAGE + idx) % CAT_COLORS.length]
                    return (
                      <div key={`${cat.category_name}-${cat.branch_id}-${idx}`} className="rounded-xl border border-border/40 bg-muted/10 px-4 py-3 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">{cat.category_name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {cat.branch_name} · {Number(cat.product_count)} productos · {formatNum(Number(cat.total_stock))} uds
                            </p>
                          </div>
                          <p className="font-bold text-primary">{formatBs(cost)}</p>
                        </div>
                        <CapitalBar value={cost} max={maxCost} color={barColor} />
                        <div className="flex gap-6 text-[11px] text-muted-foreground">
                          <span>Venta: <span className="text-emerald-400 font-medium">{formatBs(retail)}</span></span>
                          <span>Ganancia: <span className="text-amber-400 font-medium">{formatBs(profit)}</span></span>
                          <span className="ml-auto">
                            Margen: <span className="text-sky-400 font-medium">{cost > 0 ? ((profit / cost) * 100).toFixed(1) : '0'}%</span>
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <p className="text-xs text-muted-foreground">
                      Página {page} de {totalPages} · {categories.length} categorías
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
