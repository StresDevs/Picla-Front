'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ACTIVE_ROLE_EVENT,
  getActiveUserContext,
  type AppUserRole,
} from '@/lib/mock/runtime-store'

const items = [
  { label: 'Productos', href: '/inventory/products' },
  { label: 'Kits', href: '/inventory/kits' },
  { label: 'Ingresos', href: '/inventory/entries' },
  { label: 'Salidas', href: '/inventory/exits' },
  { label: 'Traspasos', href: '/inventory/transfers' },
  { label: 'Importacion de catalogo', href: '/inventory/catalog-import' },
  { label: 'Anulaciones', href: '/inventory/voids' },
  { label: 'Historial de traspasos', href: '/inventory/history' },
  { label: 'Historial inventario', href: '/inventory/stock-history' },
  { label: 'Control', href: '/inventory/control' },
]

const basicInventoryItems = new Set(['/inventory/products', '/inventory/kits'])

export function InventorySubnav() {
  const pathname = usePathname()
  const [activeRole, setActiveRole] = useState<AppUserRole>(() => getActiveUserContext().role)

  useEffect(() => {
    const syncRole = () => {
      setActiveRole(getActiveUserContext().role)
    }

    syncRole()
    window.addEventListener(ACTIVE_ROLE_EVENT, syncRole)
    window.addEventListener('focus', syncRole)

    return () => {
      window.removeEventListener(ACTIVE_ROLE_EVENT, syncRole)
      window.removeEventListener('focus', syncRole)
    }
  }, [])

  const visibleItems = useMemo(() => {
    if (activeRole === 'admin' || activeRole === 'manager') {
      return items
    }

    return items.filter((item) => basicInventoryItems.has(item.href))
  }, [activeRole])

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {visibleItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link key={item.href} href={item.href}>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
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
