'use client'

import { useCallback, useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { ReportsSubnav } from '@/components/modules/reports/reports-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RotateCw, Trophy, Package } from 'lucide-react'
import { reportsService, type ReportTopProduct } from '@/lib/supabase/reports'
import { ACTIVE_ROLE_EVENT, getActiveUserContext } from '@/lib/mock/runtime-store'

function formatBs(value: number) {
  return `Bs ${value.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const RANK_COLORS = [
  'text-yellow-400',
  'text-zinc-300',
  'text-amber-600',
]

export default function ReportsTopProductsPage() {
  const [rows, setRows] = useState<ReportTopProduct[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().slice(0, 10)
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10))

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const bid = getActiveUserContext().branch_id || null
      const data = await reportsService.getTopProducts({
        branch_id: bid,
        date_from: startDate || null,
        date_to: endDate || null,
        limit: 30,
      })
      setRows(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el reporte')
    } finally {
      setIsLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => {
    void loadData()
    const onCtxChange = () => void loadData()
    window.addEventListener(ACTIVE_ROLE_EVENT, onCtxChange)
    return () => window.removeEventListener(ACTIVE_ROLE_EVENT, onCtxChange)
  }, [loadData])

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Productos más vendidos" description="Ranking de productos por ingresos reales desde Supabase" />
        <ReportsSubnav />

        {/* Filtros */}
        <Card className="bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>Rango de fechas</span>
              <Button size="sm" onClick={() => void loadData()} disabled={isLoading}>
                <RotateCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Consultar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Desde</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Hasta</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Resultados</label>
              <div className="h-10 rounded-md border border-border/70 bg-muted/30 px-3 py-2 text-sm flex items-center">
                {isLoading ? '…' : `${rows.length} productos`}
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-500/40 bg-red-500/8">
            <CardContent className="pt-4 pb-4 text-sm text-red-300">{error}</CardContent>
          </Card>
        )}

        {/* Podio top 3 */}
        {!isLoading && rows.length >= 3 && (
          <div className="grid grid-cols-3 gap-4">
            {rows.slice(0, 3).map((row, i) => (
              <Card key={row.part_id} className={`bg-card/95 ${i === 0 ? 'border-yellow-400/40' : ''}`}>
                <CardContent className="pt-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Trophy className={`h-5 w-5 ${RANK_COLORS[i]}`} />
                    <span className={`text-lg font-bold ${RANK_COLORS[i]}`}>#{i + 1}</span>
                  </div>
                  <p className="text-sm font-semibold line-clamp-2 min-h-[2.5rem]">{row.part_name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{row.category_name}</p>
                  <p className="text-2xl font-bold text-primary mt-3">{formatBs(Number(row.revenue))}</p>
                  <p className="text-xs text-muted-foreground mt-1">{row.units_sold} unidades</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tabla completa */}
        <Card className="bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Ranking completo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-muted/40" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No hay ventas en el período seleccionado.
              </p>
            ) : (
              <div className="space-y-2">
                {rows.map((row, i) => (
                  <div
                    key={row.part_id}
                    className="rounded-xl border border-border/60 bg-muted/10 px-4 py-3 flex items-center gap-4 hover:bg-muted/20 transition-colors"
                  >
                    <span className={`text-lg font-bold shrink-0 w-8 text-center ${RANK_COLORS[i] ?? 'text-muted-foreground'}`}>
                      #{i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{row.part_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px]">{row.part_code}</Badge>
                        <span className="text-xs text-muted-foreground">{row.category_name}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-primary">{formatBs(Number(row.revenue))}</p>
                      <p className="text-xs text-muted-foreground">{row.units_sold} u. · Bs {Number(row.avg_price).toFixed(2)}/u</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
