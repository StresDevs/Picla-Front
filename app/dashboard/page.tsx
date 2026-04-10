'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { StatCard } from '@/components/common/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
} from 'lucide-react'

// Datos de ejemplo para los gráficos
const salesData = [
  { name: 'Lun', ventas: 2400, créditos: 1398 },
  { name: 'Mar', ventas: 2210, créditos: 9800 },
  { name: 'Mié', ventas: 2290, créditos: 9800 },
  { name: 'Jue', ventas: 2000, créditos: 9808 },
  { name: 'Vie', ventas: 2181, créditos: 7800 },
  { name: 'Sáb', ventas: 2500, créditos: 9800 },
  { name: 'Dom', ventas: 2100, créditos: 9800 },
]

const categoryData = [
  { name: 'Repuestos Motores', value: 35 },
  { name: 'Repuestos Eléctricos', value: 25 },
  { name: 'Repuestos Frenos', value: 20 },
  { name: 'Otros', value: 20 },
]

const COLORS = [
  'hsl(210, 100%, 45%)',  // Azul
  'hsl(82, 85%, 48%)',    // Verde Lima
  'hsl(210, 95%, 52%)',   // Azul Claro
  'hsl(82, 85%, 55%)',    // Verde Lima Claro
]

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <MainLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-8"></div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <PageHeader
        title="Panel principal"
        description="Vista general del sistema de gestión de repuestos"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Ventas Totales"
          value="$12,500"
          icon={ShoppingCart}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          label="Inventario"
          value="1,245"
          icon={Package}
          trend={{ value: 5, isPositive: false }}
        />
        <StatCard
          label="Créditos Activos"
          value="$8,300"
          icon={CreditCard}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          label="Crecimiento"
          value="23%"
          icon={TrendingUp}
          trend={{ value: 15, isPositive: true }}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <Card className="lg:col-span-2 bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Ventas Semanales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(0, 0%, 92%)"
                    className="dark:stroke-[hsl(0,0%,20%)]"
                  />
                  <XAxis
                    stroke="hsl(0, 0%, 45%)"
                    className="dark:stroke-[hsl(0,0%,65%)]"
                  />
                  <YAxis
                    stroke="hsl(0, 0%, 45%)"
                    className="dark:stroke-[hsl(0,0%,65%)]"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(0, 0%, 98%)',
                      border: '1px solid hsl(0, 0%, 92%)',
                    }}
                    wrapperClassName="dark:bg-[hsl(0,0%,12%)] dark:border-[hsl(0,0%,20%)]"
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="ventas"
                    stroke="hsl(200, 100%, 45%)"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(200, 100%, 45%)', r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="créditos"
                    stroke="hsl(270, 100%, 50%)"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(270, 100%, 50%)', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Pie Chart */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">
              Categorías
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart */}
      <Card className="mt-6 bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Ventas por Método de Pago</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(0, 0%, 92%)"
                  className="dark:stroke-[hsl(0,0%,20%)]"
                />
                <XAxis
                  stroke="hsl(0, 0%, 45%)"
                  className="dark:stroke-[hsl(0,0%,65%)]"
                />
                <YAxis
                  stroke="hsl(0, 0%, 45%)"
                  className="dark:stroke-[hsl(0,0%,65%)]"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0, 0%, 98%)',
                    border: '1px solid hsl(0, 0%, 92%)',
                  }}
                  wrapperClassName="dark:bg-[hsl(0,0%,12%)] dark:border-[hsl(0,0%,20%)]"
                />
                <Legend />
                <Bar
                  dataKey="ventas"
                  fill="hsl(200, 100%, 45%)"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="créditos"
                  fill="hsl(160, 100%, 45%)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  )
}
