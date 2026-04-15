'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  { label: 'Cotización', href: '/cotizaciones/cotizacion' },
  { label: 'Historial de Cotizaciones', href: '/cotizaciones/historial' },
]

export function QuotationsSubnav() {
  const pathname = usePathname()

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {items.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link key={item.href} href={item.href}>
            <button
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
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
