'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard } from 'lucide-react'
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
import { creditsService } from '@/lib/supabase/credits'
import { ACTIVE_ROLE_EVENT, getActiveUserContext } from '@/lib/mock/runtime-store'

const LAST_SHOWN_KEY = 'credits_pending_popup_last_shown'
const CHECK_INTERVAL_MS = 60 * 1000
const POPUP_INTERVAL_MS = 60 * 60 * 1000

interface CreditSummary {
  active: number
  overdue: number
}

export function CreditPendingNotification() {
  const router = useRouter()
  const [activeRole, setActiveRole] = useState(() => getActiveUserContext().role)
  const [summary, setSummary] = useState<CreditSummary | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const summaryRef = useRef<CreditSummary | null>(null)

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

  const hasCreditsAccess = activeRole === 'admin' || activeRole === 'manager' || activeRole === 'employee'

  useEffect(() => {
    if (!hasCreditsAccess) return

    const fetchPending = async () => {
      try {
        const portfolio = await creditsService.getPortfolio()
        const active = portfolio.filter((c) => c.status === 'active').length
        const overdue = portfolio.filter((c) => c.status === 'overdue').length
        const next = active + overdue > 0 ? { active, overdue } : null
        summaryRef.current = next
        setSummary(next)
        return next
      } catch {
        return summaryRef.current
      }
    }

    const maybeShowPopup = (current: CreditSummary | null) => {
      if (!current) return
      const lastShown = Number(sessionStorage.getItem(LAST_SHOWN_KEY) || '0')
      if (Date.now() - lastShown >= POPUP_INTERVAL_MS) {
        sessionStorage.setItem(LAST_SHOWN_KEY, String(Date.now()))
        setIsOpen(true)
      }
    }

    void fetchPending().then(maybeShowPopup)

    const interval = setInterval(() => {
      void fetchPending().then(maybeShowPopup)
    }, CHECK_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [hasCreditsAccess])

  if (!hasCreditsAccess || !summary) return null

  const total = summary.active + summary.overdue
  const hasOverdue = summary.overdue > 0

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Créditos pendientes
          </AlertDialogTitle>
          <AlertDialogDescription>
            Tienes {total} crédito{total !== 1 ? 's' : ''} pendiente{total !== 1 ? 's' : ''}
            {hasOverdue && ` — ${summary.overdue} vencido${summary.overdue !== 1 ? 's' : ''}`}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cerrar</AlertDialogCancel>
          <AlertDialogAction onClick={() => router.push('/credits/portfolio')}>
            Ver cartera
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
