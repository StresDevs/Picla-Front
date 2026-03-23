'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentSession } from '@/lib/supabase/auth'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const session = await getCurrentSession()
      router.replace(session ? '/dashboard' : '/login')
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
