'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CreditCard, X } from 'lucide-react'
import { creditsService } from '@/lib/supabase/credits'
import { ACTIVE_ROLE_EVENT, getActiveUserContext } from '@/lib/mock/runtime-store'

const SESSION_KEY = 'credits_pending_notification_dismissed'

interface CreditSummary {
  active: number
  overdue: number
}

export function CreditPendingNotification() {
  const [activeRole, setActiveRole] = useState(() => getActiveUserContext().role)
  const [summary, setSummary] = useState<CreditSummary | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [loaded, setLoaded] = useState(false)

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
    if (typeof window !== 'undefined' && sessionStorage.getItem(SESSION_KEY)) {
      setLoaded(true)
      return
    }

    const fetchPending = async () => {
      try {
        const portfolio = await creditsService.getPortfolio()
        const active = portfolio.filter((c) => c.status === 'active').length
        const overdue = portfolio.filter((c) => c.status === 'overdue').length
        if (active + overdue > 0) {
          setSummary({ active, overdue })
        }
      } catch {
        // silently fail — never block the UI for a notification
      } finally {
        setLoaded(true)
      }
    }

    void fetchPending()
  }, [hasCreditsAccess])

  const handleDismiss = () => {
    if (typeof window !== 'undefined') sessionStorage.setItem(SESSION_KEY, '1')
    setDismissed(true)
  }

  if (!hasCreditsAccess || !loaded || !summary || dismissed) return null

  const total = summary.active + summary.overdue
  const hasOverdue = summary.overdue > 0

  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 text-sm mb-4 ${
        hasOverdue
          ? 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300'
          : 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <CreditCard className="h-4 w-4 shrink-0" />
        <p className="font-medium leading-snug">
          Tienes{' '}
          <span className="font-bold">{total}</span>{' '}
          crédito{total !== 1 ? 's' : ''} pendiente{total !== 1 ? 's' : ''}
          {hasOverdue && (
            <span className="ml-1 font-normal opacity-80">
              — {summary.overdue} vencido{summary.overdue !== 1 ? 's' : ''}
            </span>
          )}
        </p>
        <Link
          href="/credits/portfolio"
          onClick={handleDismiss}
          className="shrink-0 underline underline-offset-2 hover:opacity-80 font-semibold whitespace-nowrap"
        >
          Ver cartera
        </Link>
      </div>
      <button
        onClick={handleDismiss}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity rounded"
        aria-label="Cerrar notificación"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
