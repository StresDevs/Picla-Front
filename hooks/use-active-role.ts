'use client'

import { useEffect, useState } from 'react'
import { ACTIVE_ROLE_EVENT, getActiveUserContext, type AppUserRole } from '@/lib/mock/runtime-store'

export function useActiveRole() {
  const [role, setRole] = useState<AppUserRole | null>(null)
  useEffect(() => {
    const syncRole = () => setRole(getActiveUserContext().role)
    syncRole()
    window.addEventListener(ACTIVE_ROLE_EVENT, syncRole)
    window.addEventListener('focus', syncRole)
    return () => {
      window.removeEventListener(ACTIVE_ROLE_EVENT, syncRole)
      window.removeEventListener('focus', syncRole)
    }
  }, [])
  return role
}
