'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  { label: 'Ventas', href: '/pos/sales' },
  { label: 'Anulación Ventas', href: '/pos/void-sales' },
  { label: 'Venta Adelantada', href: '/pos/advance-sales' },
  { label: 'Por Entregar', href: '/pos/deliveries' },
  { label: 'Devoluciones', href: '/pos/returns' },
]

export function POSSubnav() {
  const pathname = usePathname()

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {items.map((item) => {
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
