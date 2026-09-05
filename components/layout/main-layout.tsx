'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Sidebar } from './sidebar'
import { TopSellerPopup } from './top-seller-popup'
import { CreditPendingNotification } from './credit-notification'
import { QueuedSaleNotification } from './queued-sale-notification'
import { PayrollAlertNotification } from './payroll-alert-notification'
import { getCurrentAuthUser, getCurrentSession } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase/client'
import {
  ACTIVE_ROLE_EVENT,
  getActiveUserContext,
  setActiveUserContext,
  type AppUserRole,
} from '@/lib/mock/runtime-store'

function normalizeRole(value: unknown): AppUserRole {
  const role = String(value || '').toLowerCase()
  if (role === 'admin' || role === 'manager' || role === 'employee' || role === 'read_only') {
    return role
  }
  return 'employee'
}

export function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [missingBranch, setMissingBranch] = useState(false)

  useEffect(() => {
    const basicInventoryRoutes = new Set(['/inventory/products', '/inventory/kits', '/inventory/categories'])
    const managerEmployeeRestrictedRoutes = ['/management', '/reports', '/audit', '/settings', '/pos/void-sales']

    const enforceRouteAccess = () => {
      const context = getActiveUserContext()

      if (context.role === 'manager' || context.role === 'employee') {
        if (pathname === '/dashboard' || managerEmployeeRestrictedRoutes.some((r) => pathname.startsWith(r))) {
          router.replace('/inventory/products')
          return
        }
        if (pathname.startsWith('/inventory') && pathname !== '/inventory/products') {
          router.replace('/inventory/products')
          return
        }
        return
      }

      if (context.role === 'read_only') {
        if (pathname === '/dashboard') {
          router.replace('/pos/sales')
          return
        }
        if (!basicInventoryRoutes.has(pathname) && pathname.startsWith('/inventory')) {
          router.replace('/inventory/products')
        }
      }
    }

    enforceRouteAccess()

    window.addEventListener(ACTIVE_ROLE_EVENT, enforceRouteAccess)
    window.addEventListener('focus', enforceRouteAccess)

    return () => {
      window.removeEventListener(ACTIVE_ROLE_EVENT, enforceRouteAccess)
      window.removeEventListener('focus', enforceRouteAccess)
    }
  }, [pathname, router])

  useEffect(() => {
    let mounted = true

    const checkAccess = async () => {
      try {
        const session = await getCurrentSession()

        if (!session?.access_token) {
          router.replace('/login')
          return
        }

        const authUser = await getCurrentAuthUser()
        if (!authUser) {
          router.replace('/login')
          return
        }

        const { data: userProfile } = await supabase
          .from('users')
          .select('id, is_active, must_change_password')
          .eq('id', authUser.id)
          .single()

        if (!userProfile?.is_active) {
          router.replace('/login')
          return
        }

        if (userProfile?.must_change_password && pathname !== '/change-password') {
          router.replace('/change-password')
          return
        }

        // Rol y sucursal se guardaban en localStorage al iniciar sesion y no se
        // volvian a mirar: si un admin reasignaba la sucursal de un usuario, esa
        // maquina seguia viendo la anterior indefinidamente.
        const { data: profile } = await supabase.rpc('get_current_user_profile').single()
        const typedProfile = profile as { role_name?: string; branch_id?: string | null } | null

        if (mounted && typedProfile) {
          const role = normalizeRole(typedProfile.role_name)
          const branchId = typedProfile.branch_id || ''

          // El admin elige sucursal desde la barra lateral; el resto la hereda
          // de su perfil y no puede quedar desincronizada.
          if (role === 'admin') {
            setMissingBranch(false)
            if (getActiveUserContext().role !== role) {
              setActiveUserContext({ role })
            }
          } else {
            setMissingBranch(!branchId)
            const current = getActiveUserContext()
            if (branchId && (current.branch_id !== branchId || current.role !== role)) {
              setActiveUserContext({ role, branch_id: branchId })
            }
          }
        }

        if (mounted) {
          setIsChecking(false)
        }
      } catch {
        router.replace('/login')
      }
    }

    void checkAccess()

    const { data: authSubscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/login')
      }
    })

    return () => {
      mounted = false
      authSubscription.subscription.unsubscribe()
    }
  }, [router, pathname])

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="flex h-svh bg-transparent text-foreground overflow-x-hidden">
      <Sidebar
        desktopOpen={isSidebarOpen}
        onDesktopToggle={() => setIsSidebarOpen((prev) => !prev)}
      />
      <main className="flex-1 overflow-y-auto pt-14 lg:pt-0 lg:pl-0">
        <div className="page-fade p-4 lg:p-8 xl:p-10 max-w-[120rem]">
          <div className="surface-panel p-4 md:p-6 lg:p-8 min-h-[calc(100svh-6rem)]">
            {missingBranch ? (
              <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
                Tu usuario no tiene sucursal asignada, por eso no ves inventario ni ventas.
                Pide a un administrador que te asigne una en Gestión &gt; Usuarios.
              </div>
            ) : null}
            <CreditPendingNotification />
            <QueuedSaleNotification />
            <PayrollAlertNotification />
            {children}
          </div>
        </div>
      </main>
      <TopSellerPopup />
    </div>
  )
}
