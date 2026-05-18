'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  { label: 'Ganancias', href: '/reports/profit' },
  { label: 'Capital', href: '/reports/capital' },
  { label: 'Productos más vendidos', href: '/reports/top-products' },
  { label: 'Cuentas por Cobrar', href: '/reports/aging' },
]

const capitalSubItems = [
  { label: 'Resumen', href: '/reports/capital' },
  { label: 'Categorías', href: '/reports/capital/categories' },
  { label: 'Productos', href: '/reports/capital/products' },
]

export function ReportsSubnav() {
  const pathname = usePathname()
  const isCapitalSection = pathname.startsWith('/reports/capital')

  return (
    <div className="space-y-2 mb-6">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 sm:flex-wrap sm:overflow-visible">
        {items.map((item) => {
          const isActive = item.href === '/reports/capital'
            ? isCapitalSection
            : pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <button
                className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-150 ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                } whitespace-nowrap`}
              >
                {item.label}
              </button>
            </Link>
          )
        })}
      </div>
      {isCapitalSection && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 sm:flex-wrap sm:overflow-visible">
          {capitalSubItems.map((sub) => {
            const isActive = pathname === sub.href
            return (
              <Link key={sub.href} href={sub.href}>
                <button
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors duration-150 ${
                    isActive
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
                  } whitespace-nowrap`}
                >
                  {sub.label}
                </button>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
