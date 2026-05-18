'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { CreditsSubnav } from '@/components/modules/credits/credits-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { creditsService, type CreditAlertRow } from '@/lib/supabase/credits'
import { getSupabaseClient } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import { ACTIVE_ROLE_EVENT, getActiveUserContext, type AppUserRole } from '@/lib/mock/runtime-store'

function formatAlertType(alert: CreditAlertRow) {
  if (alert.alert_type === 'daily_due') return 'Diario'
  if (alert.alert_type === 'weekly') return 'Semanal'
  return 'Pendiente'
}

function formatStatus(status: CreditAlertRow['status']) {
  if (status === 'overdue') return 'Vencido'
  if (status === 'paid') return 'Pagado'
  return 'Activo'
}

export default function CreditsAlertsPage() {
  const [activeRole, setActiveRole] = useState<AppUserRole>(() => getActiveUserContext().role)
  const [activeBranchId, setActiveBranchId] = useState(() => getActiveUserContext().branch_id)

  const [alerts, setAlerts] = useState<CreditAlertRow[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const branchScope = activeRole === 'admin' ? null : activeBranchId

  const loadAlerts = async () => {
    setIsLoading(true)
    try {
      const rows = await creditsService.getAlerts({ branch_id: branchScope })
      setAlerts(rows)
    } catch (loadError) {
      toast({
        title: 'Error al cargar alertas',
        description:
          loadError instanceof Error ? loadError.message : 'No se pudieron cargar alertas',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const syncContext = () => {
      const context = getActiveUserContext()
      setActiveRole(context.role)
      setActiveBranchId(context.branch_id)
    }

    syncContext()

    window.addEventListener(ACTIVE_ROLE_EVENT, syncContext)

    return () => {
      window.removeEventListener(ACTIVE_ROLE_EVENT, syncContext)
    }
  }, [])

  useEffect(() => {
    let eventSource: EventSource | null = null
    let isActive = true

    const startStream = async () => {
      setIsLoading(true)
      try {
        const supabase = getSupabaseClient()
        const { data } = await supabase.auth.getSession()
        const token = data.session?.access_token

        if (!token) {
          toast({
            title: 'Sesion expirada',
            description: 'Vuelve a iniciar sesion para ver las alertas de credito.',
            variant: 'destructive',
          })
          setIsLoading(false)
          return
        }

        const params = new URLSearchParams({ token })
        if (branchScope) {
          params.set('branch_id', branchScope)
        }

        eventSource = new EventSource(`/api/credits/alerts/stream?${params.toString()}`)

        eventSource.addEventListener('alerts', (event) => {
          if (!isActive) return
          try {
            const data = JSON.parse(event.data) as CreditAlertRow[]
            setAlerts(data)
          } catch (parseError) {
            toast({
              title: 'Error al procesar alertas',
              description: parseError instanceof Error ? parseError.message : 'Respuesta invalida',
              variant: 'destructive',
            })
          } finally {
            setIsLoading(false)
          }
        })

        eventSource.addEventListener('error', (event) => {
          if (!isActive) return
          try {
            const payload = JSON.parse((event as MessageEvent).data) as { error?: string }
            toast({
              title: 'Error en alertas',
              description: payload.error || 'No se pudo actualizar alertas',
              variant: 'destructive',
            })
          } catch {
            toast({
              title: 'Error en alertas',
              description: 'No se pudo actualizar alertas',
              variant: 'destructive',
            })
          }
        })

        eventSource.onerror = () => {
          if (!isActive) return
          toast({
            title: 'Conexion interrumpida',
            description: 'Intentando restablecer alertas en tiempo real.',
            variant: 'destructive',
          })
        }
      } catch (streamError) {
        toast({
          title: 'Error al iniciar alertas',
          description:
            streamError instanceof Error ? streamError.message : 'No se pudo iniciar el stream',
          variant: 'destructive',
        })
        setIsLoading(false)
      }
    }

    void startStream()

    return () => {
      isActive = false
      eventSource?.close()
    }
  }, [branchScope])

  const summaryText = useMemo(() => {
    if (alerts.length === 0) return 'Sin alertas activas.'
    return `${alerts.length} alertas activas.`
  }, [alerts.length])

  const handleMarkSeen = async (creditId: string) => {
    try {
      await creditsService.markAlertSeen(creditId)
      toast({
        title: 'Recordatorio actualizado',
        description: 'Se marco el recordatorio como visto.',
      })
      await loadAlerts()
    } catch (markError) {
      toast({
        title: 'No se pudo marcar el recordatorio',
        description:
          markError instanceof Error ? markError.message : 'Intenta nuevamente en unos segundos',
        variant: 'destructive',
      })
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Alertas de Crédito" description="Recordatorios por vencimiento para sucursal y propietario" />
        <CreditsSubnav />

        <Card>
          <CardHeader>
            <CardTitle>Recordatorios activos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Cargando alertas...</p>
            ) : alerts.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">{summaryText}</p>
            ) : (
              alerts.map((alert) => (
                <div key={alert.credit_id} className="rounded-lg border border-border bg-card/70 p-3 text-sm">
                  <p className="font-semibold text-foreground">Crédito - {alert.customer_name}</p>
                  <p className="text-muted-foreground">
                    {alert.branch_name} | Vence: {new Date(alert.due_date).toLocaleDateString('es-BO')} | Frecuencia: {formatAlertType(alert)}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-amber-500">{formatStatus(alert.status)}</span>
                    <Button size="sm" variant="outline" onClick={() => handleMarkSeen(alert.credit_id)}>Marcar visto</Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
