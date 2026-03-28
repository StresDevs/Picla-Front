'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { ManagementSubnav } from '@/components/modules/management/management-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/common/data-table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { mockBranches } from '@/lib/mock/data'
import { getDeviceSessions, type DeviceSessionRecord } from '@/lib/mock/runtime-store'

export default function ManagementDevicesPage() {
  const [sessions, setSessions] = useState<DeviceSessionRecord[]>(getDeviceSessions())
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [branchFilter, setBranchFilter] = useState('all')
  const [emailFilter, setEmailFilter] = useState('')

  useEffect(() => {
    setSessions(getDeviceSessions())
  }, [])

  const filtered = useMemo(() => {
    return sessions.filter((item) => {
      const byRole = roleFilter === 'all' || item.role === roleFilter
      const byStatus = statusFilter === 'all' || item.status === statusFilter
      const byBranch = branchFilter === 'all' || item.branch_id === branchFilter
      const byEmail = !emailFilter.trim() || item.user_email.toLowerCase().includes(emailFilter.toLowerCase())
      return byRole && byStatus && byBranch && byEmail
    })
  }, [sessions, roleFilter, statusFilter, branchFilter, emailFilter])

  const activeCount = useMemo(
    () => filtered.filter((item) => item.status === 'active').length,
    [filtered]
  )

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Gestión - Dispositivos"
          description="Control mock de dispositivos donde los trabajadores iniciaron sesión (pendiente backend)"
        />
        <ManagementSubnav />

        <Card className="border-primary/35 bg-gradient-to-r from-sky-950/40 via-slate-950/50 to-emerald-950/40">
          <CardHeader>
            <CardTitle>Filtros y resumen</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rol</label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="manager">Gerente</SelectItem>
                  <SelectItem value="employee">Empleado</SelectItem>
                  <SelectItem value="read_only">Solo lectura</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="closed">Cerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sucursal</label>
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

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Correo trabajador</label>
              <Input
                value={emailFilter}
                onChange={(event) => setEmailFilter(event.target.value)}
                placeholder="Buscar por correo"
              />
            </div>

            <div className="rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-sm">
              <p className="text-muted-foreground">Sesiones filtradas</p>
              <p className="font-semibold text-lg">{filtered.length}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-sm">
              <p className="text-muted-foreground">Activas</p>
              <p className="font-semibold text-lg text-emerald-400">{activeCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registro de inicios de sesión por dispositivo</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: 'login_at', label: 'Fecha', render: (value) => new Date(String(value)).toLocaleString() },
                { key: 'user_name', label: 'Trabajador', render: (value) => String(value) },
                { key: 'user_email', label: 'Correo', render: (value) => String(value) },
                { key: 'role', label: 'Rol', render: (value) => <Badge className="bg-primary/15 text-primary">{String(value)}</Badge> },
                { key: 'device_name', label: 'Dispositivo', render: (value) => String(value) },
                { key: 'browser', label: 'Navegador', render: (value) => String(value) },
                { key: 'os', label: 'SO', render: (value) => String(value) },
                { key: 'ip_address', label: 'IP', render: (value) => String(value) },
                {
                  key: 'status',
                  label: 'Estado',
                  render: (value) => {
                    const isActive = String(value) === 'active'
                    return <Badge className={isActive ? 'bg-emerald-600 text-white' : 'bg-slate-600 text-white'}>{isActive ? 'Activo' : 'Cerrado'}</Badge>
                  },
                },
              ]}
              data={filtered}
              emptyMessage="No hay sesiones para los filtros aplicados"
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
