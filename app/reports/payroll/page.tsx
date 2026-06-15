'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { ReportsSubnav } from '@/components/modules/reports/reports-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RotateCw, Wallet, Download, FileSpreadsheet } from 'lucide-react'
import { exportToExcel } from '@/lib/excel/export'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { PayrollHistoryRecord } from '@/lib/supabase/payroll'
import { getActiveUserContext, type AppUserRole } from '@/lib/mock/runtime-store'

function formatBs(value: number) {
  return `Bs ${value.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function ReportsPayrollPage() {
  const [activeRole] = useState<AppUserRole>(() => getActiveUserContext().role)
  const [rows, setRows] = useState<PayrollHistoryRecord[]>([])
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
      const supabase = getSupabaseClient()
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) {
        setError('Sesión inválida. Vuelve a iniciar sesión.')
        setIsLoading(false)
        return
      }

      const params = new URLSearchParams({ date_from: startDate, date_to: endDate })
      const response = await fetch(`/api/payroll/history?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        setError('No se pudo cargar el reporte de sueldos.')
        setIsLoading(false)
        return
      }

      const data2 = (await response.json()) as PayrollHistoryRecord[]
      setRows(data2)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el reporte')
    } finally {
      setIsLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const total = useMemo(() => rows.reduce((sum, row) => sum + Number(row.amount), 0), [rows])

  const byUser = useMemo(() => {
    const map = new Map<string, { user_name: string; total: number; count: number }>()
    rows.forEach((row) => {
      const current = map.get(row.user_id) ?? { user_name: row.user_name, total: 0, count: 0 }
      current.total += Number(row.amount)
      current.count += 1
      map.set(row.user_id, current)
    })
    return [...map.values()].sort((a, b) => b.total - a.total)
  }, [rows])

  const handleDownloadExcel = () => {
    const headers = ['Trabajador', 'Pagos', 'Total pagado']
    const excelRows = byUser.map((row) => [row.user_name, row.count, row.total.toFixed(2)])
    exportToExcel({
      fileName: `sueldos_${startDate}_a_${endDate}`,
      headers,
      rows: excelRows,
    })
  }

  if (activeRole !== 'admin') {
    return (
      <MainLayout>
        <div className="space-y-6">
          <PageHeader title="Reporte de Sueldos" description="Gasto en sueldos por período (solo admin)" />
          <ReportsSubnav />

          <Card>
            <CardHeader>
              <CardTitle>Acceso restringido</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Solo administradores pueden ver el reporte de sueldos.</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Reporte de Sueldos" description="Gasto en sueldos pagados por período" />
        <ReportsSubnav />

        <Card className="bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>Rango de fechas</span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleDownloadExcel} disabled={isLoading || byUser.length === 0}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                <Button size="sm" onClick={() => void loadData()} disabled={isLoading}>
                  <RotateCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Consultar
                </Button>
              </div>
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
              <label className="text-xs font-medium text-muted-foreground">Total pagado</label>
              <div className="h-10 rounded-md border border-border/70 bg-muted/30 px-3 py-2 text-sm flex items-center font-semibold text-rose-400">
                {isLoading ? '…' : formatBs(total)}
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-500/40 bg-red-500/8">
            <CardContent className="pt-4 pb-4 text-sm text-red-300">{error}</CardContent>
          </Card>
        )}

        <Card className="bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Pagos por trabajador
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-muted/40" />
                ))}
              </div>
            ) : byUser.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No hay pagos de sueldo en el período seleccionado.
              </p>
            ) : (
              <div className="space-y-2">
                {byUser.map((row) => (
                  <div
                    key={row.user_name}
                    className="rounded-xl border border-border/60 bg-muted/10 px-4 py-3 flex items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-semibold">{row.user_name}</p>
                      <p className="text-xs text-muted-foreground">{row.count} pago{row.count !== 1 ? 's' : ''}</p>
                    </div>
                    <p className="font-bold text-rose-400">{formatBs(row.total)}</p>
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
