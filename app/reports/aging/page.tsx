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
  AlertCircle,
  Clock,
  Users,
  Banknote,
  ChevronLeft,
  ChevronRight,
  Phone,
  Download,
  FileSpreadsheet,
} from 'lucide-react'
import { exportToExcel } from '@/lib/excel/export'
import {
  reportsService,
  type ReportAgingDetail,
  type ReportAgingSummary,
} from '@/lib/supabase/reports'
import { ACTIVE_ROLE_EVENT } from '@/lib/mock/runtime-store'
import { supabase } from '@/lib/supabase/client'

function formatBs(value: number) {
  return `Bs ${value.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const BUCKET_COLORS: Record<string, string> = {
  vigente: 'bg-emerald-500',
  '1-30 días': 'bg-amber-500',
  '31-60 días': 'bg-orange-500',
  '61-90 días': 'bg-rose-500',
  '90+ días': 'bg-red-700',
}

const BUCKET_TEXT: Record<string, string> = {
  vigente: 'text-emerald-400',
  '1-30 días': 'text-amber-400',
  '31-60 días': 'text-orange-400',
  '61-90 días': 'text-rose-400',
  '90+ días': 'text-red-400',
}

function AgingBucketBadge({ bucket }: { bucket: string }) {
  const cls = BUCKET_TEXT[bucket] ?? 'text-muted-foreground'
  const bg = BUCKET_COLORS[bucket] ?? 'bg-muted'
  return (
    <Badge className={`${bg}/15 ${cls} border-current/30 text-[10px]`}>
      {bucket}
    </Badge>
  )
}

/** Stacked horizontal bar */
function AgingBar({ segments }: { segments: { label: string; value: number }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  if (total === 0) return null
  return (
    <div className="w-full h-3 rounded-full bg-muted/30 overflow-hidden flex">
      {segments.filter((s) => s.value > 0).map((seg) => (
        <div
          key={seg.label}
          className={`h-full transition-all duration-700 ease-out ${BUCKET_COLORS[seg.label] ?? 'bg-muted'}`}
          style={{ width: `${(seg.value / total) * 100}%` }}
          title={`${seg.label}: ${formatBs(seg.value)}`}
        />
      ))}
    </div>
  )
}

const ITEMS_PER_PAGE = 15
const AGING_BUCKETS = ['vigente', '1-30 días', '31-60 días', '61-90 días', '90+ días'] as const

export default function ReportsAgingPage() {
  const [details, setDetails] = useState<ReportAgingDetail[]>([])
  const [summaryData, setSummaryData] = useState<ReportAgingSummary[]>([])
  const [allBranches, setAllBranches] = useState<{ id: string; name: string }[]>([])

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [branchFilter, setBranchFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
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
      const st = statusFilter === 'all' ? null : statusFilter
      const [detailRes, summaryRes] = await Promise.all([
        reportsService.getAgingDetail({ branch_id: bid, status: st }),
        reportsService.getAgingSummary({ branch_id: bid }),
      ])
      setDetails(detailRes)
      setSummaryData(summaryRes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar cuentas por cobrar')
    } finally {
      setIsLoading(false)
    }
  }, [branchFilter, statusFilter])

  useEffect(() => {
    void loadData()
    const onCtxChange = () => void loadData()
    window.addEventListener(ACTIVE_ROLE_EVENT, onCtxChange)
    return () => window.removeEventListener(ACTIVE_ROLE_EVENT, onCtxChange)
  }, [loadData])

  // Aggregations
  const globalTotals = useMemo(() => {
    const totalBalance = summaryData.reduce((s, r) => s + Number(r.total_balance ?? 0), 0)
    const overdueBalance = summaryData.reduce((s, r) => s + Number(r.overdue_balance ?? 0), 0)
    const activeBalance = summaryData.reduce((s, r) => s + Number(r.active_balance ?? 0), 0)
    const totalCredits = summaryData.reduce((s, r) => s + Number(r.total_credits ?? 0), 0)
    const overdueCount = summaryData.reduce((s, r) => s + Number(r.overdue_count ?? 0), 0)
    return { totalBalance, overdueBalance, activeBalance, totalCredits, overdueCount }
  }, [summaryData])

  // Bucket distribution
  const bucketData = useMemo(() => {
    const map = new Map<string, number>()
    AGING_BUCKETS.forEach((b) => map.set(b, 0))
    details.forEach((d) => {
      const cur = map.get(d.aging_bucket) ?? 0
      map.set(d.aging_bucket, cur + Number(d.balance ?? 0))
    })
    return AGING_BUCKETS.map((b) => ({ label: b, value: map.get(b) ?? 0 }))
  }, [details])

  const handleDownloadExcel = () => {
    const headers = ['Cliente', 'NIT', 'Teléfono', 'Producto', 'Vendedor', 'Sucursal', 'Total', 'Pagado', 'Saldo', 'Vencimiento', 'Días Vencido', 'Antigüedad', 'Estado']
    const excelRows = details.map((c) => [
      c.customer_name,
      c.customer_nit,
      c.customer_phone ?? '',
      c.product_name,
      c.seller_name,
      c.branch_name,
      Number(c.total_amount ?? 0).toFixed(2),
      Number(c.paid_amount ?? 0).toFixed(2),
      Number(c.balance ?? 0).toFixed(2),
      c.due_date,
      Number(c.days_overdue ?? 0),
      c.aging_bucket,
      c.status === 'overdue' ? 'Vencido' : 'Vigente',
    ])
    exportToExcel({
      fileName: `cuentas_por_cobrar`,
      headers: ['#', ...headers],
      rows: excelRows.map((row, i) => [i + 1, ...row]),
    })
  }

  const handleDownloadCSV = () => {
    const headers = ['#', 'Cliente', 'NIT', 'Teléfono', 'Producto', 'Vendedor', 'Sucursal', 'Total', 'Pagado', 'Saldo', 'Vencimiento', 'Días Vencido', 'Antigüedad', 'Estado']
    const csvRows = details.map((c, i) =>
      [i + 1, `"${c.customer_name}"`, c.customer_nit, c.customer_phone ?? '', `"${c.product_name}"`, `"${c.seller_name}"`, `"${c.branch_name}"`, Number(c.total_amount ?? 0).toFixed(2), Number(c.paid_amount ?? 0).toFixed(2), Number(c.balance ?? 0).toFixed(2), c.due_date, Number(c.days_overdue ?? 0), c.aging_bucket, c.status === 'overdue' ? 'Vencido' : 'Vigente'].join(',')
    )
    const csv = [headers.join(','), ...csvRows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cuentas_por_cobrar.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Pagination
  const totalPages = Math.max(1, Math.ceil(details.length / ITEMS_PER_PAGE))
  const paginated = useMemo(
    () => details.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
    [details, page],
  )

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Cuentas por Cobrar" description="Análisis de antigüedad de cartera y créditos pendientes" />
        <ReportsSubnav />

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5 w-56">
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
          <div className="space-y-1.5 w-44">
            <label className="text-xs font-medium text-muted-foreground">Estado</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Vigentes</SelectItem>
                <SelectItem value="overdue">Vencidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleDownloadExcel} disabled={isLoading || details.length === 0}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button size="sm" variant="outline" onClick={handleDownloadCSV} disabled={isLoading || details.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button size="sm" onClick={() => void loadData()} disabled={isLoading}>
              <RotateCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Consultar
            </Button>
          </div>
        </div>

        {error && (
          <Card className="border-red-500/40 bg-red-500/8">
            <CardContent className="pt-4 pb-4 text-sm text-red-300">{error}</CardContent>
          </Card>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Saldo Total', value: formatBs(globalTotals.totalBalance), icon: Banknote, color: 'text-primary' },
            { label: 'Saldo Vencido', value: formatBs(globalTotals.overdueBalance), icon: AlertCircle, color: 'text-rose-400' },
            { label: 'Saldo Vigente', value: formatBs(globalTotals.activeBalance), icon: Clock, color: 'text-emerald-400' },
            { label: 'Total Créditos', value: String(globalTotals.totalCredits), icon: Users, color: 'text-violet-400' },
            { label: 'Vencidos', value: String(globalTotals.overdueCount), icon: AlertCircle, color: 'text-rose-400' },
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

        {/* Aging distribution bar + legend */}
        <Card className="bg-card/95">
          <CardHeader>
            <CardTitle className="text-sm">Distribución por Antigüedad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="h-4 animate-pulse rounded-full bg-muted/40" />
            ) : (
              <>
                <AgingBar segments={bucketData} />
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {bucketData.map((seg) => (
                    <div key={seg.label} className="flex items-center gap-2 text-xs">
                      <div className={`w-3 h-3 rounded-full ${BUCKET_COLORS[seg.label] ?? 'bg-muted'}`} />
                      <div>
                        <p className="text-muted-foreground">{seg.label}</p>
                        <p className={`font-bold ${BUCKET_TEXT[seg.label] ?? ''}`}>{formatBs(seg.value)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Per-branch summary */}
        {summaryData.length > 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {summaryData.map((branch) => (
              <Card key={branch.branch_id} className="bg-card/95">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>{branch.branch_name}</span>
                    <Badge variant="outline" className="text-[10px]">{Number(branch.total_credits)} créditos</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-muted/20 p-2.5">
                      <p className="text-muted-foreground">Saldo total</p>
                      <p className="font-bold text-primary mt-0.5">{formatBs(Number(branch.total_balance))}</p>
                    </div>
                    <div className="rounded-lg bg-muted/20 p-2.5">
                      <p className="text-muted-foreground">Vencido</p>
                      <p className="font-bold text-rose-400 mt-0.5">{formatBs(Number(branch.overdue_balance))}</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {Number(branch.overdue_count)} vencidos · {Number(branch.active_count)} vigentes
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Detail table */}
        <Card className="bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-violet-400" />
              Detalle de Créditos
              {!isLoading && (
                <Badge variant="outline" className="ml-2 text-[10px]">{details.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/40" />
                ))}
              </div>
            ) : details.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No hay créditos pendientes para los filtros aplicados.
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/60">
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Cliente</th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium hidden md:table-cell">Producto</th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium hidden lg:table-cell">Sucursal</th>
                        <th className="text-right py-2 px-3 text-muted-foreground font-medium">Total</th>
                        <th className="text-right py-2 px-3 text-muted-foreground font-medium">Pagado</th>
                        <th className="text-right py-2 px-3 text-muted-foreground font-medium">Saldo</th>
                        <th className="text-center py-2 px-3 text-muted-foreground font-medium hidden sm:table-cell">Vencimiento</th>
                        <th className="text-center py-2 px-3 text-muted-foreground font-medium">Antigüedad</th>
                        <th className="text-center py-2 px-3 text-muted-foreground font-medium hidden sm:table-cell">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((credit) => (
                        <tr key={credit.credit_id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                          <td className="py-2 px-3">
                            <p className="font-medium truncate max-w-[160px]">{credit.customer_name}</p>
                            <p className="text-[10px] text-muted-foreground">{credit.customer_nit}</p>
                            {credit.customer_phone && (
                              <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <Phone className="w-2.5 h-2.5" />{credit.customer_phone}
                              </p>
                            )}
                          </td>
                          <td className="py-2 px-3 hidden md:table-cell">
                            <p className="text-muted-foreground text-xs whitespace-nowrap">{credit.product_name}</p>
                            <p className="text-[10px] text-muted-foreground">Vendedor: {credit.seller_name}</p>
                          </td>
                          <td className="py-2 px-3 hidden lg:table-cell text-muted-foreground text-xs">{credit.branch_name}</td>
                          <td className="py-2 px-3 text-right text-muted-foreground">{formatBs(Number(credit.total_amount))}</td>
                          <td className="py-2 px-3 text-right text-emerald-400">{formatBs(Number(credit.paid_amount))}</td>
                          <td className="py-2 px-3 text-right font-bold text-primary">{formatBs(Number(credit.balance))}</td>
                          <td className="py-2 px-3 text-center hidden sm:table-cell text-xs text-muted-foreground">
                            {new Date(credit.due_date + 'T00:00:00').toLocaleDateString('es-BO')}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <AgingBucketBadge bucket={credit.aging_bucket} />
                            {Number(credit.days_overdue) > 0 && (
                              <p className="text-[10px] text-rose-400 mt-0.5">{credit.days_overdue}d</p>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center hidden sm:table-cell">
                            {credit.status === 'overdue' ? (
                              <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/30 text-[10px]">Vencido</Badge>
                            ) : (
                              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">Vigente</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-border/60 bg-muted/10">
                        <td colSpan={3} className="py-2 px-3 font-semibold text-muted-foreground hidden lg:table-cell">
                          Total ({details.length} créditos)
                        </td>
                        <td colSpan={1} className="py-2 px-3 font-semibold text-muted-foreground lg:hidden">Total</td>
                        <td className="py-2 px-3 text-right font-bold text-muted-foreground">
                          {formatBs(details.reduce((s, c) => s + Number(c.total_amount ?? 0), 0))}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-400">
                          {formatBs(details.reduce((s, c) => s + Number(c.paid_amount ?? 0), 0))}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-primary">
                          {formatBs(details.reduce((s, c) => s + Number(c.balance ?? 0), 0))}
                        </td>
                        <td className="py-2 px-3 hidden sm:table-cell" />
                        <td className="py-2 px-3" />
                        <td className="py-2 px-3 hidden sm:table-cell" />
                      </tr>
                    </tfoot>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <p className="text-xs text-muted-foreground">
                      Mostrando {((page - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(page * ITEMS_PER_PAGE, details.length)} de {details.length} · Página {page} de {totalPages}
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
