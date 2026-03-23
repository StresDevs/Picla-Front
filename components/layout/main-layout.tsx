'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Sidebar } from './sidebar'
import { getCurrentAuthUser, getCurrentSession } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase/client'

export function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

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
          .select('id, is_active')
          .eq('id', authUser.id)
          .single()

        if (!userProfile?.is_active) {
          router.replace('/login')
          return
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
    <div className="flex h-svh bg-transparent text-foreground overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pt-14 lg:pt-0 lg:pl-0">
        <div className="page-fade p-4 lg:p-8 xl:p-10 max-w-[120rem]">
          <div className="surface-panel p-4 md:p-6 lg:p-8 min-h-[calc(100svh-6rem)]">
          {children}
          </div>
        </div>
      </main>
    </div>
  )
}
