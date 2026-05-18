'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ShieldCheck,
  Activity,
  AlertTriangle,
  Clock3,
  UserCircle2,
  Boxes,
  Search,
  RotateCw,
  XCircle,
  FileSpreadsheet,
} from 'lucide-react'
import { auditService, type AuditLogRow } from '@/lib/supabase/audit'
import { getSupabaseClient } from '@/lib/supabase/client'
import { generateAuditPdf, type AuditReportRow } from '@/lib/pdf/generators'
import { exportToExcel } from '@/lib/excel/export'
import { ACTIVE_ROLE_EVENT } from '@/lib/mock/runtime-store'

type AuditAction = 'CREACION' | 'ACTUALIZACION' | 'ELIMINACION'

const actionStyles: Record<AuditAction, string> = {
  CREACION:
    'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/35 dark:text-emerald-300 dark:border-emerald-500/30',
  ACTUALIZACION:
    'bg-sky-100 text-sky-800 border border-sky-300 dark:bg-sky-900/35 dark:text-sky-300 dark:border-sky-500/30',
  ELIMINACION:
    'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-900/35 dark:text-rose-300 dark:border-rose-500/30',
}

function logTone(action: AuditAction) {
  if (action === 'ELIMINACION')
    return 'border-rose-300 bg-rose-50 dark:border-rose-800/60 dark:bg-rose-950/30'
  if (action === 'CREACION')
    return 'border-emerald-300 bg-emerald-50 dark:border-emerald-800/60 dark:bg-emerald-950/25'
  return 'border-sky-300 bg-sky-50 dark:border-sky-800/60 dark:bg-sky-950/25'
}

function formatTime(ts: string) {
  try {
    return new Date(ts).toLocaleString('es-BO')
  } catch {
    return ts
  }
}

function sanitizeDescription(raw: string, entityId?: string | null, resolvedName?: string) {
  const fallback = resolvedName && resolvedName !== '-' ? resolvedName : 'registro'
  let output = raw

  if (entityId) {
    output = output.split(entityId).join(fallback)
  }

  const uuidRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g
  output = output.replace(uuidRegex, fallback)

  return output
}

function resolveStockImpact(metadata: Record<string, unknown> | null) {
  if (!metadata) return ''

  const toNumber = (value: unknown) => {
    if (typeof value === 'number') return value
    if (typeof value === 'string' && value.trim() !== '') return Number(value)
    return NaN
  }

  const before = toNumber(
    metadata.quantity_before ??
      metadata.stock_before ??
      metadata.previous_stock ??
      metadata.prev_stock,
  )
  const after = toNumber(
    metadata.quantity_after ??
      metadata.stock_after ??
      metadata.new_stock ??
      metadata.quantity ??
      metadata.stock ??
      metadata.current_stock,
  )

  if (Number.isFinite(before) && Number.isFinite(after)) {
    return `Stock: ${before} -> ${after}`
  }

  if (Number.isFinite(after)) {
    return `Stock: ${after}`
  }

  return ''
}

const ENTITY_OPTIONS = [
  { label: 'Ventas', value: 'pos_sales' },
  { label: 'Ítems de venta', value: 'pos_sale_items' },
  { label: 'Créditos', value: 'credits' },
  { label: 'Pagos de crédito', value: 'credit_payments' },
  { label: 'Sesiones de caja', value: 'cash_sessions' },
  { label: 'Movimientos de caja', value: 'cash_movements' },
  { label: 'Inventario', value: 'inventory' },
  { label: 'Productos', value: 'parts' },
  { label: 'Clientes', value: 'customers' },
]

export default function AuditPage() {
  const [rows, setRows] = useState<AuditLogRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [entityFilter, setEntityFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [nameMap, setNameMap] = useState<Record<string, string>>({})

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const data = await auditService.getLogs({
        date_from: dateFrom || null,
        date_to: dateTo || null,
        entity_type: entityFilter || null,
        user_search: userFilter || null,
        limit: 300,
      })
      setRows(data)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'No se pudo cargar la auditoría')
    } finally {
      setIsLoading(false)
    }
  }, [dateFrom, dateTo, entityFilter, userFilter])

  useEffect(() => {
    void loadData()
    const onCtxChange = () => void loadData()
    window.addEventListener(ACTIVE_ROLE_EVENT, onCtxChange)
    return () => window.removeEventListener(ACTIVE_ROLE_EVENT, onCtxChange)
  }, [loadData])

  const filteredLogs = useMemo(() => {
    return rows.filter((log) => {
      const resolvedName = log.entity_id ? nameMap[log.entity_id] : undefined
      const safeDescription = sanitizeDescription(log.description, log.entity_id, resolvedName)
      const actionMatch = actionFilter
        ? log.action.toLowerCase().includes(actionFilter.toLowerCase())
        : true
      const textMatch = search
        ? `${safeDescription} ${log.entity_type} ${log.actor_name} ${log.branch_name}`
            .toLowerCase()
            .includes(search.toLowerCase())
        : true
      return actionMatch && textMatch
    })
  }, [rows, search, actionFilter, nameMap])

  useEffect(() => {
    const resolveNames = async () => {
      if (rows.length === 0) {
        setNameMap({})
        return
      }

      const supabase = getSupabaseClient()
      const ids = rows
        .map((row) => row.entity_id)
        .filter((value) => Boolean(value) && value !== '-')

      const unique = Array.from(new Set(ids))
      if (unique.length === 0) {
        setNameMap({})
        return
      }

      const map: Record<string, string> = {}

      const fetchTableNames = async (table: string, nameField: string) => {
        const { data, error } = await supabase
          .from(table)
          .select(`id, ${nameField}`)
          .in('id', unique)

        if (error) return
        for (const row of (data || []) as Array<{ id: string; [key: string]: string | null }>) {
          if (row.id && row[nameField]) {
            map[row.id] = String(row[nameField])
          }
        }
      }

      await Promise.all([
        fetchTableNames('parts', 'name'),
        fetchTableNames('customers', 'full_name'),
        fetchTableNames('branches', 'name'),
        fetchTableNames('users', 'full_name'),
      ])

      setNameMap(map)
    }

    void resolveNames()
  }, [rows])

  const stats = useMemo(() => ({
    total: filteredLogs.length,
    creates: filteredLogs.filter((l) => l.action === 'CREACION').length,
    updates: filteredLogs.filter((l) => l.action === 'ACTUALIZACION').length,
    deletes: filteredLogs.filter((l) => l.action === 'ELIMINACION').length,
  }), [filteredLogs])

  const handleExport = () => {
    const rowsForPdf: AuditReportRow[] = filteredLogs.map((log) => {
      const entityId = log.entity_id || ''
      const resolvedName = (entityId && nameMap[entityId]) || '-'
      const stockInfo = resolveStockImpact(log.metadata)
      const stockImpact =
        log.entity_type === 'Inventario'
          ? `${resolvedName}${stockInfo ? ` · ${stockInfo}` : ''}`
          : ''
      return {
        date: log.event_time,
        entity: log.entity_type,
        action: log.action,
        description: sanitizeDescription(log.description, entityId, resolvedName),
        actor: log.actor_name,
        branch: log.branch_name,
        stockImpact,
      }
    })

    const branchNames = Array.from(
      new Set(filteredLogs.map((log) => log.branch_name).filter((name) => Boolean(name))),
    ) as string[]
    const branchLabel = branchNames.length === 1 ? branchNames[0] : 'Todas las sucursales'
    const entityLabel = ENTITY_OPTIONS.find((option) => option.value === entityFilter)?.label
    const subtitleLabel = entityLabel ? `${branchLabel} · ${entityLabel}` : branchLabel

    generateAuditPdf({
      branchName: subtitleLabel,
      from: dateFrom || undefined,
      to: dateTo || undefined,
      rows: rowsForPdf,
    })
  }

  const handleExportExcel = () => {
    const rowsForExcel = filteredLogs.map((log) => {
      const entityId = log.entity_id || ''
      const resolvedName = (entityId && nameMap[entityId]) || '-'
      const stockInfo = resolveStockImpact(log.metadata)
      const stockImpact =
        log.entity_type === 'Inventario'
          ? `${resolvedName}${stockInfo ? ` · ${stockInfo}` : ''}`
          : ''
      return {
        date: log.event_time,
        entity: log.entity_type,
        action: log.action,
        description: sanitizeDescription(log.description, entityId, resolvedName),
        actor: log.actor_name,
        branch: log.branch_name,
        stockImpact,
      }
    })

    const branchNames = Array.from(
      new Set(filteredLogs.map((log) => log.branch_name).filter((name) => Boolean(name))),
    ) as string[]
    const branchLabel = branchNames.length === 1 ? branchNames[0] : 'Todas las sucursales'
    const entityLabel = ENTITY_OPTIONS.find((option) => option.value === entityFilter)?.label
    const subtitleLabel = entityLabel ? `${branchLabel} · ${entityLabel}` : branchLabel

    exportToExcel({
      fileName: `auditoria_${subtitleLabel.replace(/\s+/g, '_')}`,
      headers: ['#', 'Fecha', 'Entidad', 'Accion', 'Descripcion', 'Actor', 'Sucursal', 'Stock'],
      rows: rowsForExcel.map((row, index) => [
        index + 1,
        new Date(row.date).toLocaleString('es-BO'),
        row.entity,
        row.action,
        row.description,
        row.actor,
        row.branch,
        row.stockImpact || '-',
      ]),
    })
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Auditoría y Registro de Cambios"
          description="Eventos reales de ventas, créditos, pagos y caja desde Supabase"
          action={
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => void loadData()} disabled={isLoading}>
                <RotateCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <Button
                variant="outline"
                className="border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
                onClick={handleExport}
                disabled={filteredLogs.length === 0}
              >
                Descargar PDF
              </Button>
              <Button
                variant="outline"
                className="border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
                onClick={handleExportExcel}
                disabled={filteredLogs.length === 0}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" /> Descargar Excel
              </Button>
            </div>
          }
        />

        {/* Estado de auditoría */}
        <Card className="border-sky-300 bg-white dark:border-sky-500/40 dark:bg-zinc-950/70">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3 text-slate-900 dark:text-zinc-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                Estado de Auditoría
              </div>
              <Badge className="bg-emerald-700 text-white border border-emerald-500/40">
                {isLoading ? 'Cargando…' : 'Monitoreo Activo'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="rounded-xl bg-slate-100 p-4 border border-slate-200 dark:bg-zinc-800/70 dark:border-zinc-700">
                <p className="text-xs text-slate-600 dark:text-zinc-400">Eventos visibles</p>
                {isLoading ? (
                  <div className="h-8 w-12 animate-pulse rounded bg-zinc-700/50 mt-2" />
                ) : (
                  <p className="text-3xl font-semibold text-slate-900 mt-2 dark:text-zinc-100">{stats.total}</p>
                )}
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
                Datos en tiempo real desde Supabase
              </div>
              <div className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-2 text-slate-700 flex items-center gap-2 dark:bg-zinc-900/70 dark:border-zinc-800 dark:text-zinc-300">
                <UserCircle2 className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
                Trazabilidad por usuario y acción
              </div>
              <div className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-2 text-slate-700 flex items-center gap-2 dark:bg-zinc-900/70 dark:border-zinc-800 dark:text-zinc-300">
                <Boxes className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
                Ventas, créditos y caja cubiertos
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error de carga */}
        {loadError && (
          <Card className="border-red-500/40 bg-red-500/8">
            <CardContent className="pt-4 pb-4 flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{loadError}</p>
            </CardContent>
          </Card>
        )}

        {/* Filtros */}
        <Card className="bg-white border-slate-200 dark:bg-zinc-950/70 dark:border-zinc-800">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-700 dark:text-zinc-200">Buscar evento</Label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 dark:text-zinc-500" />
                  <Input
                    placeholder="Descripción, actor, sucursal..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-zinc-200">Entidad</Label>
                <Select value={entityFilter} onValueChange={(v) => setEntityFilter(v === '__all__' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todas</SelectItem>
                    {ENTITY_OPTIONS.map((e) => (
                      <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-zinc-200">Acción</Label>
                <Select value={actionFilter} onValueChange={(v) => setActionFilter(v === '__all__' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todas</SelectItem>
                    <SelectItem value="CREACION">CREACION</SelectItem>
                    <SelectItem value="ACTUALIZACION">ACTUALIZACION</SelectItem>
                    <SelectItem value="ELIMINACION">ELIMINACION</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-zinc-200">Usuario</Label>
                <Input
                  placeholder="Nombre del actor..."
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-zinc-200">Rango de fecha</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="bg-slate-50 border-slate-300 text-slate-900 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
                  />
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="bg-slate-50 border-slate-300 text-slate-900 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
                  />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={() => void loadData()} disabled={isLoading} className="w-full sm:w-auto">
                  <RotateCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Aplicar filtros
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 pt-1">
              <Badge className={actionStyles.CREACION}>CREACION</Badge>
              <Badge className={actionStyles.ACTUALIZACION}>ACTUALIZACION</Badge>
              <Badge className={actionStyles.ELIMINACION}>ELIMINACION</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Lista de eventos */}
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted/30 border border-border/30" />
            ))
          ) : filteredLogs.length === 0 ? (
            <Card className="border-slate-300 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950/70">
              <CardContent className="py-10 text-center">
                <AlertTriangle className="w-6 h-6 mx-auto text-slate-500 mb-3 dark:text-zinc-500" />
                <p className="text-slate-800 font-medium dark:text-zinc-200">
                  No se encontraron eventos con los filtros actuales
                </p>
                <p className="text-sm text-slate-500 mt-1 dark:text-zinc-500">
                  Prueba con otro rango de fechas o ajusta los filtros.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredLogs.map((log) => {
              const resolvedName = log.entity_id ? nameMap[log.entity_id] : undefined
              const safeDescription = sanitizeDescription(log.description, log.entity_id, resolvedName)

              return (
                <Card key={log.event_id} className={`border ${logTone(log.action)} transition-colors`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-slate-900 dark:text-zinc-100">
                              {safeDescription}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              Entidad: <span className="font-medium">{log.entity_type}</span>
                            </p>
                          </div>
                          <Badge className={actionStyles[log.action]}>{log.action}</Badge>
                        </div>

                        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                          <div className="rounded-md bg-white border border-slate-300 px-3 py-2 text-slate-700 dark:bg-zinc-900/75 dark:border-zinc-800 dark:text-zinc-300">
                            <UserCircle2 className="inline w-3.5 h-3.5 mr-1" />
                            Actor:{' '}
                            <span className="text-slate-900 font-medium dark:text-zinc-100">
                              {log.actor_name}
                            </span>
                          </div>
                          <div className="rounded-md bg-white border border-slate-300 px-3 py-2 text-slate-700 dark:bg-zinc-900/75 dark:border-zinc-800 dark:text-zinc-300">
                            Sucursal:{' '}
                            <span className="text-slate-900 font-medium dark:text-zinc-100">
                              {log.branch_name}
                            </span>
                          </div>
                          <div className="rounded-md bg-white border border-slate-300 px-3 py-2 text-slate-700 flex items-center gap-2 dark:bg-zinc-900/75 dark:border-zinc-800 dark:text-zinc-300">
                            <Activity className="w-3.5 h-3.5" />
                            {formatTime(log.event_time)}
                          </div>
                        </div>
                      </div>
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
