'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ClipboardList, X } from 'lucide-react'
import { posService } from '@/lib/supabase/pos'
import { ACTIVE_ROLE_EVENT, getActiveUserContext } from '@/lib/mock/runtime-store'

const SESSION_KEY = 'pos_queue_pending_notification_dismissed'

export function QueuedSaleNotification() {
  const [activeRole, setActiveRole] = useState(() => getActiveUserContext().role)
  const [pendingCount, setPendingCount] = useState(0)
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

  const canApproveQueue = activeRole === 'admin' || activeRole === 'manager' || activeRole === 'employee'

  useEffect(() => {
    if (!canApproveQueue) return
    if (typeof window !== 'undefined' && sessionStorage.getItem(SESSION_KEY)) {
      setLoaded(true)
      return
    }

    const fetchPending = async () => {
      try {
        const queued = await posService.getQueuedSales({ status: 'queued' })
        setPendingCount(queued.length)
      } catch {
        // silently fail — never block the UI for a notification
      } finally {
        setLoaded(true)
      }
    }

    void fetchPending()
  }, [canApproveQueue])

  const handleDismiss = () => {
    if (typeof window !== 'undefined') sessionStorage.setItem(SESSION_KEY, '1')
    setDismissed(true)
  }

  if (!canApproveQueue || !loaded || pendingCount === 0 || dismissed) return null

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300 px-4 py-3 text-sm mb-4">
      <div className="flex items-center gap-3 min-w-0">
        <ClipboardList className="h-4 w-4 shrink-0" />
        <p className="font-medium leading-snug">
          Tienes{' '}
          <span className="font-bold">{pendingCount}</span>{' '}
          venta{pendingCount !== 1 ? 's' : ''} en cola pendiente{pendingCount !== 1 ? 's' : ''} de aprobación
        </p>
        <Link
          href="/pos/sales"
          onClick={handleDismiss}
          className="shrink-0 underline underline-offset-2 hover:opacity-80 font-semibold whitespace-nowrap"
        >
          Ver cola
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
