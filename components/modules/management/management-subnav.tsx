'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ACTIVE_ROLE_EVENT, getActiveUserRole, type AppUserRole } from '@/lib/mock/runtime-store'

const items = [
  { label: 'Usuarios', href: '/management/users' },
  { label: 'Dispositivos', href: '/management/devices' },
  { label: 'Clientes', href: '/management/customers' },
  { label: 'Sucursales', href: '/management/branches' },
  { label: 'Planilla de Sueldos', href: '/management/payroll', adminOnly: true },
]

export function ManagementSubnav() {
  const pathname = usePathname()
  const [role, setRole] = useState<AppUserRole>('employee')

  useEffect(() => {
    const syncRole = () => setRole(getActiveUserRole())
    syncRole()
    window.addEventListener(ACTIVE_ROLE_EVENT, syncRole)
    window.addEventListener('focus', syncRole)
    return () => {
      window.removeEventListener(ACTIVE_ROLE_EVENT, syncRole)
      window.removeEventListener('focus', syncRole)
    }
  }, [])

  const visibleItems = useMemo(
    () => items.filter((item) => ('adminOnly' in item ? (item.adminOnly ? role === 'admin' : true) : true)),
    [role],
  )

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {visibleItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link key={item.href} href={item.href}>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-150 ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {item.label}
            </button>
          </Link>
        )
      })}
    </div>
  )
}
