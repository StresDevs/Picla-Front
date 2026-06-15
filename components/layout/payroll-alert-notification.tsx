'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wallet } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { PayrollScheduleRecord } from '@/lib/supabase/payroll'
import { ACTIVE_ROLE_EVENT, getActiveUserContext } from '@/lib/mock/runtime-store'

const LAST_SHOWN_KEY = 'payroll_alert_last_shown_date'
const CHECK_INTERVAL_MS = 5 * 60 * 1000

export function PayrollAlertNotification() {
  const router = useRouter()
  const [activeRole, setActiveRole] = useState(() => getActiveUserContext().role)
  const [alerts, setAlerts] = useState<PayrollScheduleRecord[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const alertsRef = useRef<PayrollScheduleRecord[]>([])

  useEffect(() => {
    const syncRole = () => setActiveRole(getActiveUserContext().role)
    syncRole()
    window.addEventListener(ACTIVE_ROLE_EVENT, syncRole)
    window.addEventListener('focus', syncRole)
    return () => {
      window.removeEventListener(ACTIVE_ROLE_EVENT, syncRole)
      window.removeEventListener('focus', syncRole)
    }
  }, [])

  const hasAccess = activeRole === 'admin'

  useEffect(() => {
    if (!hasAccess) return

    const fetchAlerts = async () => {
      try {
        const supabase = getSupabaseClient()
        const { data } = await supabase.auth.getSession()
        const token = data.session?.access_token
        if (!token) return alertsRef.current

        const response = await fetch('/api/payroll/alerts', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) return alertsRef.current

        const next = (await response.json()) as PayrollScheduleRecord[]
        alertsRef.current = next
        setAlerts(next)
        return next
      } catch {
        return alertsRef.current
      }
    }

    const maybeShowPopup = (current: PayrollScheduleRecord[]) => {
      if (current.length === 0) return
      const today = new Date().toISOString().slice(0, 10)
      const lastShown = localStorage.getItem(LAST_SHOWN_KEY)
      if (lastShown !== today) {
        localStorage.setItem(LAST_SHOWN_KEY, today)
        setIsOpen(true)
      }
    }

    void fetchAlerts().then(maybeShowPopup)

    const interval = setInterval(() => {
      void fetchAlerts().then(maybeShowPopup)
    }, CHECK_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [hasAccess])

  if (!hasAccess || alerts.length === 0) return null

  const today = new Date()
  const overdueCount = alerts.filter((alert) => new Date(alert.due_date) < today).length

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Pagos de sueldo próximos
          </AlertDialogTitle>
          <AlertDialogDescription>
            Tienes {alerts.length} pago{alerts.length !== 1 ? 's' : ''} de sueldo que vence{alerts.length !== 1 ? 'n' : ''} en los próximos 5 días
            {overdueCount > 0 && ` — ${overdueCount} ya vencido${overdueCount !== 1 ? 's' : ''}`}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cerrar</AlertDialogCancel>
          <AlertDialogAction onClick={() => router.push('/management/payroll')}>
            Ver planilla
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
