'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Filter,
  Download,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Clock3,
  UserCircle2,
  Boxes,
  Search,
} from 'lucide-react'

type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE'

// Datos de ejemplo
const auditLogs = [
  {
    id: '1',
    timestamp: '2024-03-07 14:30:45',
    user: 'Admin User',
    action: 'CREATE' as AuditAction,
    entity: 'Part',
    description: 'Creó nuevo repuesto: Filtro de Aire (REP-001)',
    details: 'Precio: $5.50, Stock Mín: 10',
  },
  {
    id: '2',
    timestamp: '2024-03-07 13:15:20',
    user: 'Vendedor 1',
    action: 'UPDATE' as AuditAction,
    entity: 'Sale',
    description: 'Modificó venta #S-001',
    details: 'Total anterior: $150, Total nuevo: $145',
  },
  {
    id: '3',
    timestamp: '2024-03-07 12:45:10',
    user: 'Admin User',
    action: 'DELETE' as AuditAction,
    entity: 'Inventory',
    description: 'Eliminó registro de inventario',
    details: 'Parte: Correa de Distribución, Sucursal: Centro',
  },
  {
    id: '4',
    timestamp: '2024-03-07 11:20:35',
    user: 'Vendedor 2',
    action: 'CREATE' as AuditAction,
    entity: 'Credit',
    description: 'Creó nuevo crédito para cliente',
    details: 'Cliente: Juan García, Monto: $500',
  },
  {
    id: '5',
    timestamp: '2024-03-07 10:05:15',
    user: 'Admin User',
    action: 'UPDATE' as AuditAction,
    entity: 'CashBox',
    description: 'Cerró caja diaria',
    details: 'Balance esperado: $1,200, Balance real: $1,185',
  },
]

const actionStyles: Record<AuditAction, string> = {
  CREATE: 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/35 dark:text-emerald-300 dark:border-emerald-500/30',
  UPDATE: 'bg-sky-100 text-sky-800 border border-sky-300 dark:bg-sky-900/35 dark:text-sky-300 dark:border-sky-500/30',
  DELETE: 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-900/35 dark:text-rose-300 dark:border-rose-500/30',
}

function logTone(action: AuditAction) {
  if (action === 'DELETE') return 'border-rose-300 bg-rose-50 dark:border-rose-800/60 dark:bg-rose-950/30'
  if (action === 'CREATE') return 'border-emerald-300 bg-emerald-50 dark:border-emerald-800/60 dark:bg-emerald-950/25'
  return 'border-sky-300 bg-sky-50 dark:border-sky-800/60 dark:bg-sky-950/25'
}

export default function AuditPage() {
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    user: '',
    action: '',
    dateFrom: '',
    dateTo: '',
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const userMatch = filters.user
        ? log.user.toLowerCase().includes(filters.user.toLowerCase())
        : true

      const actionMatch = filters.action
        ? log.action.toLowerCase().includes(filters.action.toLowerCase())
        : true

      const textMatch = search
        ? `${log.description} ${log.details} ${log.entity}`
            .toLowerCase()
            .includes(search.toLowerCase())
        : true

      const logDate = log.timestamp.slice(0, 10)
      const fromMatch = filters.dateFrom ? logDate >= filters.dateFrom : true
      const toMatch = filters.dateTo ? logDate <= filters.dateTo : true

      return userMatch && actionMatch && textMatch && fromMatch && toMatch
    })
  }, [filters, search])

  const stats = useMemo(() => {
    const creates = filteredLogs.filter((item) => item.action === 'CREATE').length
    const updates = filteredLogs.filter((item) => item.action === 'UPDATE').length
    const deletes = filteredLogs.filter((item) => item.action === 'DELETE').length

    return {
      total: filteredLogs.length,
      creates,
      updates,
      deletes,
    }
  }, [filteredLogs])

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
      <div className="space-y-6">
        <PageHeader
          title="Auditoría y Registro de Cambios"
          description="Revisa quién hizo qué, en qué módulo y en qué momento"
          action={
            <Button variant="outline" className="border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800">
              <Download className="w-4 h-4 mr-2" />
              Exportar Bitácora
            </Button>
          }
        />

        <Card className="border-sky-300 bg-white dark:border-sky-500/40 dark:bg-zinc-950/70">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3 text-slate-900 dark:text-zinc-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                Estado de Auditoría
              </div>
              <Badge className="bg-emerald-700 text-white border border-emerald-500/40">Monitoreo Activo</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="rounded-xl bg-slate-100 p-4 border border-slate-200 dark:bg-zinc-800/70 dark:border-zinc-700">
                <p className="text-xs text-slate-600 dark:text-zinc-400">Eventos visibles</p>
                <p className="text-3xl font-semibold text-slate-900 mt-2 dark:text-zinc-100">{stats.total}</p>
              </div>
              <div className="rounded-xl bg-emerald-100 p-4 border border-emerald-300 dark:bg-emerald-950/35 dark:border-emerald-800/55">
                <p className="text-xs text-emerald-700 dark:text-emerald-300">Creaciones</p>
                <p className="text-3xl font-semibold text-emerald-800 mt-2 dark:text-emerald-300">{stats.creates}</p>
              </div>
              <div className="rounded-xl bg-sky-100 p-4 border border-sky-300 dark:bg-sky-950/35 dark:border-sky-800/55">
                <p className="text-xs text-sky-700 dark:text-sky-300">Actualizaciones</p>
                <p className="text-3xl font-semibold text-sky-800 mt-2 dark:text-sky-300">{stats.updates}</p>
              </div>
              <div className="rounded-xl bg-rose-100 p-4 border border-rose-300 dark:bg-rose-950/35 dark:border-rose-800/55">
                <p className="text-xs text-rose-700 dark:text-rose-300">Eliminaciones</p>
                <p className="text-3xl font-semibold text-rose-800 mt-2 dark:text-rose-300">{stats.deletes}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-2 text-slate-700 flex items-center gap-2 dark:bg-zinc-900/70 dark:border-zinc-800 dark:text-zinc-300">
                <Clock3 className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
                Retención local de bitácora para demo
              </div>
              <div className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-2 text-slate-700 flex items-center gap-2 dark:bg-zinc-900/70 dark:border-zinc-800 dark:text-zinc-300">
                <UserCircle2 className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
                Trazabilidad por usuario y acción
              </div>
              <div className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-2 text-slate-700 flex items-center gap-2 dark:bg-zinc-900/70 dark:border-zinc-800 dark:text-zinc-300">
                <Boxes className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
                Cobertura en ventas, inventario y caja
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 dark:bg-zinc-950/70 dark:border-zinc-800">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-700 dark:text-zinc-200">Buscar evento</Label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 dark:text-zinc-500" />
                  <Input
                    placeholder="Descripción, detalle o entidad..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-zinc-200">Usuario</Label>
                <Input
                  placeholder="Admin, Vendedor..."
                  value={filters.user}
                  onChange={(e) => setFilters({ ...filters, user: e.target.value })}
                  className="bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-zinc-200">Acción</Label>
                <Input
                  placeholder="CREATE, UPDATE, DELETE"
                  value={filters.action}
                  onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                  className="bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-zinc-200">Rango de fecha</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className="bg-slate-50 border-slate-300 text-slate-900 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
                  />
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className="bg-slate-50 border-slate-300 text-slate-900 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
                <Badge className={actionStyles.CREATE}>CREATE</Badge>
                <Badge className={actionStyles.UPDATE}>UPDATE</Badge>
                <Badge className={actionStyles.DELETE}>DELETE</Badge>
              </div>
              <Button variant="outline" className="border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800">
                <Filter className="w-4 h-4 mr-2" />
                Aplicar filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {filteredLogs.map((log) => (
            <Card key={log.id} className={`border ${logTone(log.action)} transition-colors`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-zinc-100">{log.description}</h3>
                        <p className="text-sm text-slate-700 mt-1 dark:text-zinc-300">{log.details}</p>
                      </div>
                      <Badge className={actionStyles[log.action]}>{log.action}</Badge>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                      <div className="rounded-md bg-white border border-slate-300 px-3 py-2 text-slate-700 dark:bg-zinc-900/75 dark:border-zinc-800 dark:text-zinc-300">
                        Usuario: <span className="text-slate-900 font-medium dark:text-zinc-100">{log.user}</span>
                      </div>
                      <div className="rounded-md bg-white border border-slate-300 px-3 py-2 text-slate-700 dark:bg-zinc-900/75 dark:border-zinc-800 dark:text-zinc-300">
                        Entidad: <span className="text-slate-900 font-medium dark:text-zinc-100">{log.entity}</span>
                      </div>
                      <div className="rounded-md bg-white border border-slate-300 px-3 py-2 text-slate-700 flex items-center gap-2 dark:bg-zinc-900/75 dark:border-zinc-800 dark:text-zinc-300">
                        <Activity className="w-3.5 h-3.5" />
                        {log.timestamp}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredLogs.length === 0 && (
            <Card className="border-slate-300 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950/70">
              <CardContent className="py-10 text-center">
                <AlertTriangle className="w-6 h-6 mx-auto text-slate-500 mb-3 dark:text-zinc-500" />
                <p className="text-slate-800 font-medium dark:text-zinc-200">No se encontraron eventos con los filtros actuales</p>
                <p className="text-sm text-slate-500 mt-1 dark:text-zinc-500">Prueba con otro usuario, acción o rango de fechas.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
