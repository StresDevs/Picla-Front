'use client'

import { useEffect, useState, useCallback } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  Package,
  ShoppingCart,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  RotateCw,
  XCircle,
} from 'lucide-react'
import { dashboardService, type DashboardSummary } from '@/lib/supabase/dashboard'
import { ACTIVE_ROLE_EVENT, getActiveUserContext } from '@/lib/mock/runtime-store'

const COLORS = [
  'hsl(210, 100%, 55%)',
  'hsl(160, 70%, 48%)',
  'hsl(38, 92%, 55%)',
  'hsl(280, 70%, 60%)',
  'hsl(10, 83%, 66%)',
]

const METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  qr: 'QR/Transferencia',
  credit: 'Crédito',
}

function currency(value: number) {
  return `Bs ${value.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDay(dateStr: string) {
  try {
    const d = new Date(`${dateStr}T12:00:00`)
    return d.toLocaleDateString('es-BO', { weekday: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

interface StatCardProps {
  label: string
  value: string
  subtext?: string
  icon: React.ComponentType<{ className?: string }>
  color?: 'default' | 'green' | 'red' | 'amber'
  loading?: boolean
}

function StatCard({ label, value, subtext, icon: Icon, color = 'default', loading }: StatCardProps) {
  const colorMap = {
    default: 'text-blue-600 dark:text-blue-400',
    green: 'text-emerald-600 dark:text-emerald-400',
    red: 'text-rose-600 dark:text-rose-400',
    amber: 'text-amber-600 dark:text-amber-400',
  }
  // Each color variant gets a distinct colored background
  const bgMap = {
    default: 'kpi-blue',
    green: 'kpi-green',
    red: 'kpi-red',
    amber: 'kpi-yellow',
  }
  const borderMap = {
    default: 'border-l-blue-500',
    green: 'border-l-emerald-500',
    red: 'border-l-rose-500',
    amber: 'border-l-amber-500',
  }

  return (
    <Card className={`border-l-[3px] ${borderMap[color]} ${bgMap[color]}`}>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
          <Icon className={`h-5 w-5 shrink-0 ${colorMap[color]}`} />
        </div>
        {loading ? (
          <div className="h-8 w-32 animate-pulse rounded-sm bg-muted/60 mt-1" />
        ) : (
          <p className={`text-3xl font-bold tabular-nums ${colorMap[color]}`}>{value}</p>
        )}
        {subtext && <p className="text-xs text-muted-foreground mt-2">{subtext}</p>}
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [branchId, setBranchId] = useState<string>(() => getActiveUserContext().branch_id)

  const loadData = useCallback(async (bid?: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await dashboardService.getSummary(bid ?? branchId ?? null)
      setSummary(data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo cargar el dashboard'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [branchId])

  useEffect(() => {
    const syncContext = () => {
      const ctx = getActiveUserContext()
      setBranchId(ctx.branch_id)
      void loadData(ctx.branch_id)
    }

    syncContext()
    window.addEventListener(ACTIVE_ROLE_EVENT, syncContext)
    return () => window.removeEventListener(ACTIVE_ROLE_EVENT, syncContext)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const salesChartData = (summary?.sales_last_7_days ?? []).map((d) => ({
    name: formatDay(d.date),
    ventas: Number(d.total ?? 0),
    cantidad: Number(d.count ?? 0),
  }))

  const methodChartData = (summary?.sales_by_method ?? []).map((m) => ({
    name: METHOD_LABELS[m.method] ?? m.method,
    total: Number(m.total ?? 0),
  }))

  const topProductsData = (summary?.top_products_week ?? []).map((p) => ({
    name: p.name.length > 20 ? p.name.slice(0, 18) + '…' : p.name,
    ingresos: Number(p.total ?? 0),
    unidades: Number(p.quantity ?? 0),
  }))

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Panel Principal"
          description="Vista general en tiempo real del sistema de gestión"
          action={
            <Button variant="outline" onClick={() => void loadData()} disabled={isLoading}>
              <RotateCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          }
        />

        {error && (
          <Card className="border-red-500/40 bg-red-500/8">
            <CardContent className="pt-6 flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-300">Error al cargar el dashboard</p>
                <p className="text-xs text-red-300/80 mt-1">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPIs — sticky strip with the main figures pinned while scrolling */}
        <div className="kpi-sticky top-14 lg:top-0 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 py-3 border-b border-border/60 bg-background/85">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Ventas hoy"
              value={summary ? currency(summary.sales_today) : '—'}
              subtext={summary ? `${summary.sales_today_count} transacciones` : undefined}
              icon={ShoppingCart}
              color="default"
              loading={isLoading}
            />
            <StatCard
              label="Ventas esta semana"
              value={summary ? currency(summary.sales_week) : '—'}
              subtext="Últimos 7 días"
              icon={TrendingUp}
              color="green"
              loading={isLoading}
            />
            <StatCard
              label="Créditos activos"
              value={summary ? `${summary.credits_active_count}` : '—'}
              subtext={summary ? `Saldo: ${currency(summary.credits_active_balance)}` : undefined}
              icon={CreditCard}
              color={summary && summary.credits_overdue_count > 0 ? 'red' : 'amber'}
              loading={isLoading}
            />
            <StatCard
              label="Productos sin stock"
              value={summary ? `${summary.zero_stock_count}` : '—'}
              subtext={summary ? `${summary.low_stock_count} en stock crítico` : undefined}
              icon={Package}
              color={summary && summary.zero_stock_count > 0 ? 'red' : 'default'}
              loading={isLoading}
            />
          </div>
        </div>

        {/* Alertas */}
        {summary && (summary.credits_overdue_count > 0 || summary.zero_stock_count > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {summary.credits_overdue_count > 0 && (
              <Card className="border-rose-500/40 bg-rose-500/8">
                <CardContent className="pt-4 pb-4 flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                  <p className="text-sm text-rose-300">
                    <span className="font-semibold">{summary.credits_overdue_count}</span> crédito(s) vencido(s) requieren atención.
                  </p>
                </CardContent>
              </Card>
            )}
            {summary.zero_stock_count > 0 && (
              <Card className="border-amber-500/40 bg-amber-500/8">
                <CardContent className="pt-4 pb-4 flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                  <p className="text-sm text-amber-300">
                    <span className="font-semibold">{summary.zero_stock_count}</span> producto(s) sin stock disponible.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Gráficas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ventas últimos 7 días */}
          <Card className="lg:col-span-2 card-sales">
            <CardHeader>
              <CardTitle className="text-orange-700 dark:text-orange-300">📈 Ventas últimos 7 días</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-72 animate-pulse rounded-xl bg-muted/40" />
              ) : salesChartData.length === 0 ? (
                <div className="h-72 flex items-center justify-center text-sm text-muted-foreground">
                  Sin datos para el período seleccionado.
                </div>
              ) : (
                <div className="w-full h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                      <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                      <YAxis className="text-xs fill-muted-foreground" />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        formatter={(v: number) => [`Bs ${v.toFixed(2)}`, 'Total']}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="ventas"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2.5}
                        dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                        name="Bs (ventas)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Por método de pago */}
          <Card className="card-financial">
            <CardHeader>
              <CardTitle className="text-amber-700 dark:text-amber-300">💳 Por método de pago</CardTitle>
              <p className="text-sm text-muted-foreground">Últimos 7 días</p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-64 animate-pulse rounded-xl bg-muted/40" />
              ) : methodChartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                  Sin datos disponibles.
                </div>
              ) : (
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={methodChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="total"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {methodChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => [`Bs ${v.toFixed(2)}`, 'Total']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top productos de la semana */}
        <Card className="card-products">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-green-700 dark:text-green-300">📦 Top productos esta semana</CardTitle>
              <Badge variant="outline">{topProductsData.length} productos</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 animate-pulse rounded-xl bg-muted/40" />
            ) : topProductsData.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                Sin ventas registradas en los últimos 7 días.
              </div>
            ) : (
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProductsData} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border/40" />
                    <XAxis type="number" className="text-xs fill-muted-foreground" tickFormatter={(v) => `Bs ${v}`} />
                    <YAxis type="category" dataKey="name" className="text-xs fill-muted-foreground" width={110} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      formatter={(v: number) => [`Bs ${v.toFixed(2)}`, 'Ingresos']}
                    />
                    <Bar dataKey="ingresos" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} name="Ingresos" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
