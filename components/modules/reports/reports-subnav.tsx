'use client'

import Link from 'next/link'
import { ModuleSubnav } from '@/components/layout/module-subnav'
import { useActiveRole } from '@/hooks/use-active-role'
import { getModuleNavigation } from '@/lib/navigation'
import { usePathname } from 'next/navigation'

const capitalSubItems = [
  { label: 'Resumen', href: '/reports/capital' },
  { label: 'Categorías', href: '/reports/capital/categories' },
  { label: 'Productos', href: '/reports/capital/products' },
]

export function ReportsSubnav() {
  const pathname = usePathname()
  const role = useActiveRole()
  if (!role || !getModuleNavigation(role, 'reports').length) return null
  const isCapitalSection = pathname.startsWith('/reports/capital')

  return (
    <div className="space-y-2 mb-6">
      <ModuleSubnav module="reports" className="mb-0" />
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
