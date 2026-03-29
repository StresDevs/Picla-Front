'use client'

import { useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { ReportsSubnav } from '@/components/modules/reports/reports-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { mockBranches } from '@/lib/mock/data'
import { getConfirmedPayrollTotal } from '@/lib/mock/runtime-store'

interface ProfitRecord {
  date: string
  branch: string
  profit: number
  topProduct: string
}

const profitRecords: ProfitRecord[] = [
  { date: '2026-03-21', branch: 'Sucursal Centro', profit: 2980, topProduct: 'Bomba hidráulica' },
  { date: '2026-03-21', branch: 'Sucursal Norte', profit: 2340, topProduct: 'Filtro de aceite' },
  { date: '2026-03-21', branch: 'Sucursal Sur', profit: 1860, topProduct: 'Pastillas de freno' },
  { date: '2026-03-22', branch: 'Sucursal Centro', profit: 3150, topProduct: 'Bomba hidráulica' },
  { date: '2026-03-22', branch: 'Sucursal Norte', profit: 2490, topProduct: 'Aceite 5W-40' },
  { date: '2026-03-22', branch: 'Sucursal Sur', profit: 1940, topProduct: 'Correa de distribución' },
  { date: '2026-03-23', branch: 'Sucursal Centro', profit: 3040, topProduct: 'Bomba hidráulica' },
  { date: '2026-03-23', branch: 'Sucursal Norte', profit: 2520, topProduct: 'Filtro de combustible' },
  { date: '2026-03-23', branch: 'Sucursal Sur', profit: 2010, topProduct: 'Pastillas de freno' },
  { date: '2026-03-24', branch: 'Sucursal Centro', profit: 3270, topProduct: 'Bomba hidráulica' },
  { date: '2026-03-24', branch: 'Sucursal Norte', profit: 2610, topProduct: 'Aceite 5W-40' },
  { date: '2026-03-24', branch: 'Sucursal Sur', profit: 2080, topProduct: 'Amortiguador delantero' },
]

function formatBs(value: number) {
  return `Bs ${value.toLocaleString('es-BO')}`
}

export default function ReportsProfitPage() {
  const [filterMode, setFilterMode] = useState<'day' | 'range'>('day')
  const [singleDate, setSingleDate] = useState('2026-03-24')
  const [startDate, setStartDate] = useState('2026-03-21')
  const [endDate, setEndDate] = useState('2026-03-24')
  const [branchFilter, setBranchFilter] = useState('all')

  const filteredRecords = useMemo(() => {
    const selectedBranchName =
      branchFilter === 'all'
        ? null
        : mockBranches.find((branch) => branch.id === branchFilter)?.name || null

    if (filterMode === 'day') {
      if (!singleDate) return []
      return profitRecords.filter((item) => item.date === singleDate && (!selectedBranchName || item.branch === selectedBranchName))
    }

    if (!startDate && !endDate) return profitRecords

    return profitRecords.filter((item) => {
      const current = new Date(`${item.date}T00:00:00`).getTime()
      const min = startDate ? new Date(`${startDate}T00:00:00`).getTime() : null
      const max = endDate ? new Date(`${endDate}T23:59:59.999`).getTime() : null

      const byDate = (!min || current >= min) && (!max || current <= max)
      const byBranch = !selectedBranchName || item.branch === selectedBranchName
      return byDate && byBranch
    })
  }, [filterMode, singleDate, startDate, endDate, branchFilter])

  const totalProfit = useMemo(
    () => filteredRecords.reduce((acc, item) => acc + item.profit, 0),
    [filteredRecords]
  )

  const payrollExpense = useMemo(() => {
    const dateParams =
      filterMode === 'day'
        ? { startDate: singleDate, endDate: singleDate }
        : { startDate, endDate }

    return getConfirmedPayrollTotal({
      ...dateParams,
      branchId: branchFilter === 'all' ? undefined : branchFilter,
    })
  }, [filterMode, singleDate, startDate, endDate, branchFilter])

  const netProfit = Math.max(totalProfit - payrollExpense, 0)

  const branchProfit = useMemo(() => {
    const grouped = new Map<string, number>()

    filteredRecords.forEach((record) => {
      grouped.set(record.branch, (grouped.get(record.branch) || 0) + record.profit)
    })

    return [...grouped.entries()]
      .map(([branch, profit]) => ({ branch, profit }))
      .sort((a, b) => b.profit - a.profit)
  }, [filteredRecords])

  const topProduct = useMemo(() => {
    const grouped = new Map<string, number>()

    filteredRecords.forEach((record) => {
      grouped.set(record.topProduct, (grouped.get(record.topProduct) || 0) + record.profit)
    })

    const sorted = [...grouped.entries()].sort((a, b) => b[1] - a[1])
    return sorted[0]?.[0] || 'Sin datos'
  }, [filteredRecords])

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Reporte de Ganancias" description="Consulta ganancias por día o por rango de fechas" />
        <ReportsSubnav />

        <Card className="bg-zinc-950/70 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Filtros de fecha</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-200">Modo</label>
              <Select value={filterMode} onValueChange={(value: 'day' | 'range') => setFilterMode(value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Fecha exacta</SelectItem>
                  <SelectItem value="range">Rango de fechas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filterMode === 'day' ? (
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-zinc-200">Fecha</label>
                <Input type="date" value={singleDate} onChange={(event) => setSingleDate(event.target.value)} />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-200">Desde</label>
                  <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-200">Hasta</label>
                  <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-200">Sucursal</label>
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {mockBranches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-200">Registros</label>
              <div className="h-9 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200">
                {filteredRecords.length}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-950/70">
            <CardContent className="pt-6">
              <p className="text-zinc-400 text-sm">Ganancia global filtrada</p>
              <p className="text-zinc-100 text-3xl font-semibold mt-2">{formatBs(totalProfit)}</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-950/70">
            <CardContent className="pt-6">
              <p className="text-zinc-400 text-sm">Sueldos confirmados</p>
              <p className="text-rose-300 text-3xl font-semibold mt-2">- {formatBs(payrollExpense)}</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-950/70">
            <CardContent className="pt-6">
              <p className="text-zinc-400 text-sm">Ganancia neta (después sueldos)</p>
              <p className="text-emerald-300 text-3xl font-semibold mt-2">{formatBs(netProfit)}</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-950/70">
            <CardContent className="pt-6">
              <p className="text-zinc-400 text-sm">Sucursales con movimiento</p>
              <p className="text-emerald-300 text-3xl font-semibold mt-2">{branchProfit.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-950/70">
            <CardContent className="pt-6">
              <p className="text-zinc-400 text-sm">Promedio por registro</p>
              <p className="text-sky-300 text-3xl font-semibold mt-2">
                {formatBs(filteredRecords.length ? Math.round(totalProfit / filteredRecords.length) : 0)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-950/70">
            <CardContent className="pt-6">
              <p className="text-zinc-400 text-sm">Producto con mayor margen</p>
              <p className="text-zinc-100 text-xl font-semibold mt-2">{topProduct}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-zinc-950/70">
          <CardHeader><CardTitle className="text-zinc-100">Ganancia por sucursal</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {branchProfit.map((item) => (
              <div key={item.branch} className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-sm">
                <p className="font-semibold text-zinc-100">{item.branch}</p>
                <p className="text-zinc-400">Ganancia acumulada del filtro: {formatBs(item.profit)}</p>
              </div>
            ))}

            {branchProfit.length === 0 ? (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-400">
                No hay ganancias registradas para el filtro de fechas seleccionado.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
