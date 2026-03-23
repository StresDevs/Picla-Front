'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { getAppSettings, saveAppSettings, type AppSettingsRecord } from '@/lib/mock/runtime-store'

// Datos de ejemplo
const branchesData = [
  {
    id: '1',
    name: 'Sucursal Centro',
    location: 'Calle Principal 123',
    manager: 'Carlos López',
    phone: '555-0101',
  },
  {
    id: '2',
    name: 'Sucursal Norte',
    location: 'Avenida Norte 456',
    manager: 'María García',
    phone: '555-0102',
  },
  {
    id: '3',
    name: 'Sucursal Sur',
    location: 'Calle Sur 789',
    manager: 'Juan Rodríguez',
    phone: '555-0103',
  },
]

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false)
  const [settings, setSettings] = useState<AppSettingsRecord | null>(null)

  useEffect(() => {
    setMounted(true)
    setSettings(getAppSettings())
  }, [])

  const handleSaveSettings = () => {
    if (!settings) return
    saveAppSettings(settings)
  }

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
        title="Configuración"
        description="Gestiona la configuración del sistema"
      />

      {/* General Settings */}
      <Card className="mb-6 bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Configuración General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-foreground">Nombre de Empresa</Label>
              <Input
                value={settings?.company_name ?? ''}
                onChange={(event) => setSettings((prev) => prev ? { ...prev, company_name: event.target.value } : prev)}
                className="bg-input border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Email Empresa</Label>
              <Input
                type="email"
                value={settings?.company_email ?? ''}
                onChange={(event) => setSettings((prev) => prev ? { ...prev, company_email: event.target.value } : prev)}
                className="bg-input border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Teléfono Empresa</Label>
              <Input
                value={settings?.company_phone ?? ''}
                onChange={(event) => setSettings((prev) => prev ? { ...prev, company_phone: event.target.value } : prev)}
                className="bg-input border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Moneda</Label>
              <Select value={settings?.default_currency ?? 'BOB'} onValueChange={(value: 'BOB' | 'USD') => setSettings((prev) => prev ? { ...prev, default_currency: value } : prev)}>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="BOB">BOB (Bs)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Tipo de Cambio USD a BOB</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={settings?.usd_to_bob_rate ?? 0}
                onChange={(event) => {
                  const parsed = Number(event.target.value)
                  setSettings((prev) => prev ? { ...prev, usd_to_bob_rate: Number.isFinite(parsed) && parsed > 0 ? parsed : 0 } : prev)
                }}
                className="bg-input border-border text-foreground"
              />
              <p className="text-xs text-muted-foreground">Este valor se usa en POS cuando el pago se realiza en USD.</p>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Límite de créditos abiertos/vencidos por cliente</Label>
              <Input
                type="number"
                min="1"
                step="1"
                value={settings?.max_open_credits_per_customer ?? 2}
                onChange={(event) => {
                  const parsed = Math.floor(Number(event.target.value))
                  setSettings((prev) => prev ? {
                    ...prev,
                    max_open_credits_per_customer: Number.isFinite(parsed) && parsed > 0 ? parsed : 1,
                  } : prev)
                }}
                className="bg-input border-border text-foreground"
              />
              <p className="text-xs text-muted-foreground">Se bloquea la creación de nuevos créditos cuando el cliente alcance o supere este límite.</p>
            </div>
          </div>
          <Button className="w-full md:w-auto" onClick={handleSaveSettings}>Guardar Cambios</Button>
        </CardContent>
      </Card>

      {/* Branches Management */}
      <Card className="mb-6 bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground">Sucursales</CardTitle>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Nueva Sucursal
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {branchesData.map((branch) => (
              <div
                key={branch.id}
                className="p-4 border border-border rounded-lg bg-muted/20 flex items-start justify-between"
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">{branch.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {branch.location}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                    <span>Gerente: {branch.manager}</span>
                    <span>Teléfono: {branch.phone}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Información del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="text-sm text-muted-foreground">Versión del Sistema</span>
              <Badge>v1.0.0</Badge>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="text-sm text-muted-foreground">Última Actualización</span>
              <span className="text-sm text-foreground">7 de marzo, 2024</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="text-sm text-muted-foreground">Estado de Conexión</span>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Conectado
              </Badge>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-muted-foreground">Registros en la Base de Datos</span>
              <span className="text-sm font-semibold text-foreground">12,450</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  )
}
