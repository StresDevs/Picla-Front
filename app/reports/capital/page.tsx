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
  Landmark,
  TrendingUp,
  AlertTriangle,
  PackageX,
  BarChart3,
  ArrowUpDown,
  PackageSearch,
} from 'lucide-react'
import {
  reportsService,
  type ReportCapitalSummary,
} from '@/lib/supabase/reports'
import { ACTIVE_ROLE_EVENT } from '@/lib/mock/runtime-store'
import { supabase } from '@/lib/supabase/client'

function formatBs(value: number) {
  return `Bs ${value.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatNum(value: number) {
  return value.toLocaleString('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 3 })
}

/** Simple horizontal bar proportional to max */
function CapitalBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="w-full h-3 rounded-full bg-muted/30 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

/** Donut-style ring using CSS conic-gradient */
function DonutChart({ segments, size = 140 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <p className="text-xs text-muted-foreground">Sin datos</p>
      </div>
    )
  }

  let accumulated = 0
  const gradientParts: string[] = []
  segments.forEach((seg) => {
    const start = (accumulated / total) * 360
    const end = ((accumulated + seg.value) / total) * 360
    gradientParts.push(`${seg.color} ${start}deg ${end}deg`)
    accumulated += seg.value
  })

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="rounded-full relative"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(${gradientParts.join(', ')})`,
        }}
      >
        <div
          className="absolute inset-0 m-auto rounded-full bg-card"
          style={{ width: size * 0.6, height: size * 0.6 }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm font-bold text-foreground">{formatBs(total)}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5 text-[11px]">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-muted-foreground">{seg.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const BRANCH_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7', '#ec4899', '#84cc16']

export default function ReportsCapitalPage() {
  const [summaryData, setSummaryData] = useState<ReportCapitalSummary[]>([])
  const [allBranches, setAllBranches] = useState<{ id: string; name: string }[]>([])

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [branchFilter, setBranchFilter] = useState<string>('all')

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
    try {
      const bid = branchFilter === 'all' ? null : branchFilter
      const res = await reportsService.getCapitalSummary({ branch_id: bid })
      setSummaryData(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el reporte de capital')
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

  const globalTotals = useMemo(() => {
    const totalCost = summaryData.reduce((s, r) => s + Number(r.capital_cost ?? 0), 0)
    const totalRetail = summaryData.reduce((s, r) => s + Number(r.capital_retail ?? 0), 0)
    const totalProfit = summaryData.reduce((s, r) => s + Number(r.potential_profit ?? 0), 0)
    const totalProducts = summaryData.reduce((s, r) => s + Number(r.total_products ?? 0), 0)
    const totalStock = summaryData.reduce((s, r) => s + Number(r.total_stock ?? 0), 0)
    const lowStock = summaryData.reduce((s, r) => s + Number(r.low_stock_count ?? 0), 0)
    const zeroStock = summaryData.reduce((s, r) => s + Number(r.zero_stock_count ?? 0), 0)
    const margin = totalCost > 0 ? ((totalProfit / totalCost) * 100) : 0
    return { totalCost, totalRetail, totalProfit, totalProducts, totalStock, lowStock, zeroStock, margin }
  }, [summaryData])

  const maxBranchCost = useMemo(
    () => Math.max(...summaryData.map((b) => Number(b.capital_cost ?? 0)), 1),
    [summaryData],
  )

  // Donut chart segments
  const donutSegments = useMemo(
    () => summaryData.map((b, i) => ({
      label: b.branch_name,
      value: Number(b.capital_cost ?? 0),
      color: BRANCH_COLORS[i % BRANCH_COLORS.length],
    })),
    [summaryData],
  )

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Capital Invertido"
          description="Resumen global del capital en inventario por sucursal"
        />
        <ReportsSubnav />

        {/* Filtro + consultar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="space-y-1.5 w-full sm:w-64">
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
          <Button size="sm" onClick={() => void loadData()} disabled={isLoading} className="w-full sm:w-auto">
            <RotateCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Consultar
          </Button>
        </div>

        {error && (
          <Card className="border-red-500/40 bg-red-500/8">
            <CardContent className="pt-4 pb-4 text-sm text-red-300">{error}</CardContent>
          </Card>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-7 gap-3">
          {[
            { label: 'Capital Invertido', value: formatBs(globalTotals.totalCost), icon: Landmark, color: 'text-primary' },
            { label: 'Valor de Venta', value: formatBs(globalTotals.totalRetail), icon: TrendingUp, color: 'text-emerald-400' },
            { label: 'Ganancia Potencial', value: formatBs(globalTotals.totalProfit), icon: BarChart3, color: 'text-amber-400' },
            { label: 'Margen', value: `${globalTotals.margin.toFixed(1)}%`, icon: ArrowUpDown, color: 'text-sky-400' },
            { label: 'Productos', value: formatNum(globalTotals.totalProducts), icon: PackageSearch, color: 'text-violet-400' },
            { label: 'Stock Bajo', value: formatNum(globalTotals.lowStock), icon: AlertTriangle, color: 'text-amber-400' },
            { label: 'Sin Stock', value: formatNum(globalTotals.zeroStock), icon: PackageX, color: 'text-rose-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="bg-card/95">
              <CardContent className="pt-5 pb-4 px-4">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon className={`h-3.5 w-3.5 ${color}`} />
                  <p className="text-[11px] text-muted-foreground font-medium truncate">{label}</p>
                </div>
                {isLoading ? (
                  <div className="h-7 w-20 animate-pulse rounded bg-muted/50" />
                ) : (
                  <p className={`text-lg font-bold ${color}`}>{value}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Donut: distribución de capital */}
          <Card className="bg-card/95">
            <CardHeader>
              <CardTitle className="text-sm">Distribución de Capital por Sucursal</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center py-4">
              {isLoading ? (
                <div className="h-36 w-36 animate-pulse rounded-full bg-muted/40" />
              ) : (
                <DonutChart segments={donutSegments} size={160} />
              )}
            </CardContent>
          </Card>

          {/* Horizontal bars: capital por sucursal */}
          <Card className="bg-card/95">
            <CardHeader>
              <CardTitle className="text-sm">Capital por Sucursal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-muted/40" />
                ))
              ) : summaryData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Sin datos.</p>
              ) : (
                summaryData.map((branch, i) => {
                  const cost = Number(branch.capital_cost ?? 0)
                  return (
                    <div key={branch.branch_id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BRANCH_COLORS[i % BRANCH_COLORS.length] }} />
                          <span className="font-medium">{branch.branch_name}</span>
                        </div>
                        <span className="font-bold text-primary">{formatBs(cost)}</span>
                      </div>
                      <CapitalBar value={cost} max={maxBranchCost} color="bg-primary" />
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Branch detail cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="bg-card/95">
                <CardContent className="pt-6"><div className="h-24 animate-pulse rounded-lg bg-muted/40" /></CardContent>
              </Card>
            ))
          ) : summaryData.length === 0 ? (
            <Card className="bg-card/95 col-span-full">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center">No hay datos de capital disponibles.</p>
              </CardContent>
            </Card>
          ) : (
            summaryData.map((branch) => {
              const cost = Number(branch.capital_cost ?? 0)
              const retail = Number(branch.capital_retail ?? 0)
              const profit = Number(branch.potential_profit ?? 0)
              const margin = Number(branch.profit_margin ?? 0)
              return (
                <Card key={branch.branch_id} className="bg-card/95">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>{branch.branch_name}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {formatNum(Number(branch.total_products))} prod.
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-muted/20 p-2.5">
                        <p className="text-muted-foreground">Capital</p>
                        <p className="font-bold text-primary mt-0.5">{formatBs(cost)}</p>
                      </div>
                      <div className="rounded-lg bg-muted/20 p-2.5">
                        <p className="text-muted-foreground">Valor venta</p>
                        <p className="font-bold text-emerald-400 mt-0.5">{formatBs(retail)}</p>
                      </div>
                      <div className="rounded-lg bg-muted/20 p-2.5">
                        <p className="text-muted-foreground">Ganancia</p>
                        <p className="font-bold text-amber-400 mt-0.5">{formatBs(profit)}</p>
                      </div>
                      <div className="rounded-lg bg-muted/20 p-2.5">
                        <p className="text-muted-foreground">Margen</p>
                        <p className="font-bold text-sky-400 mt-0.5">{margin.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-[11px]">
                      <span className="text-amber-400">
                        <AlertTriangle className="w-3 h-3 inline mr-0.5" />
                        {Number(branch.low_stock_count)} bajo
                      </span>
                      <span className="text-rose-400">
                        <PackageX className="w-3 h-3 inline mr-0.5" />
                        {Number(branch.zero_stock_count)} sin stock
                      </span>
                      <span className="text-muted-foreground sm:ml-auto">
                        {formatNum(Number(branch.total_stock))} uds
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </MainLayout>
  )
}
