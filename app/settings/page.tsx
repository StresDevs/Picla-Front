'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getSupabaseClient } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import type { AppSettings } from '@/types/database'

const WEEK_DAYS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
]

const fallbackSettings: AppSettings = {
  id: '',
  settings_key: 'default',
  company_name: '',
  company_email: null,
  company_phone: null,
  default_currency: 'BOB',
  usd_to_bob_rate: 6.96,
  max_open_credits_per_customer: 2,
  credit_reminder_weekly_day: 1,
  credit_due_daily_threshold_days: 5,
  created_by: null,
  updated_by: null,
  created_at: '',
  updated_at: '',
}

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false)
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const weeklyLabel = useMemo(() => {
    const value = settings?.credit_reminder_weekly_day ?? 1
    return WEEK_DAYS.find((day) => day.value === value)?.label || 'Lunes'
  }, [settings?.credit_reminder_weekly_day])

  const loadSettings = async () => {
    const supabase = getSupabaseClient()
    const { data, error: loadError } = await supabase.rpc('get_app_settings')

    if (loadError) {
      toast({
        title: 'Error al cargar configuracion',
        description: loadError.message,
        variant: 'destructive',
      })
      setSettings(fallbackSettings)
      return
    }

    const row = Array.isArray(data) ? data[0] : data
    setSettings((row as AppSettings | null) || fallbackSettings)
  }

  useEffect(() => {
    setMounted(true)
    void loadSettings()
  }, [])

  const handleSaveSettings = async () => {
    if (!settings) return
    setIsSaving(true)

    try {
      const supabase = getSupabaseClient()
      const { error: saveError } = await supabase.rpc('set_app_settings', {
        p_company_name: settings.company_name,
        p_company_email: settings.company_email ?? null,
        p_company_phone: settings.company_phone ?? null,
        p_default_currency: settings.default_currency,
        p_usd_to_bob_rate: settings.usd_to_bob_rate,
        p_max_open_credits_per_customer: settings.max_open_credits_per_customer,
        p_credit_reminder_weekly_day: settings.credit_reminder_weekly_day,
        p_credit_due_daily_threshold_days: settings.credit_due_daily_threshold_days,
      })

      if (saveError) {
        toast({
          title: 'Error al guardar configuracion',
          description: saveError.message,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Configuracion guardada',
        description: 'Los cambios se aplicaron correctamente.',
      })
      await loadSettings()
    } finally {
      setIsSaving(false)
    }
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
            <div className="space-y-2">
              <Label className="text-foreground">Día semanal de recordatorio</Label>
              <Select
                value={String(settings?.credit_reminder_weekly_day ?? 1)}
                onValueChange={(value) => setSettings((prev) => prev ? { ...prev, credit_reminder_weekly_day: Number(value) } : prev)}
              >
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue placeholder={weeklyLabel} />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {WEEK_DAYS.map((day) => (
                    <SelectItem key={day.value} value={String(day.value)}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Umbral para alerta diaria (días)</Label>
              <Input
                type="number"
                min="1"
                step="1"
                value={settings?.credit_due_daily_threshold_days ?? 5}
                onChange={(event) => {
                  const parsed = Math.floor(Number(event.target.value))
                  setSettings((prev) => prev ? {
                    ...prev,
                    credit_due_daily_threshold_days: Number.isFinite(parsed) && parsed > 0 ? parsed : 1,
                  } : prev)
                }}
                className="bg-input border-border text-foreground"
              />
              <p className="text-xs text-muted-foreground">Cuando faltan estos días o menos, el recordatorio se vuelve diario.</p>
            </div>
          </div>
          <Button className="w-full md:w-auto" onClick={handleSaveSettings} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </CardContent>
      </Card>

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
