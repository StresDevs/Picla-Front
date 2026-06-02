'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentSession } from '@/lib/supabase/auth'
import { getActiveUserContext } from '@/lib/mock/runtime-store'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const session = await getCurrentSession()
      if (!session) {
        router.replace('/login')
        return
      }
      const { role } = getActiveUserContext()
      if (role === 'manager' || role === 'employee') {
        router.replace('/inventory/products')
      } else if (role === 'read_only') {
        router.replace('/pos/sales')
      } else {
        router.replace('/dashboard')
      }
    }

    void checkSession()
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    </div>
  )
}
