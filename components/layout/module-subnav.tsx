'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useActiveRole } from '@/hooks/use-active-role'
import { getModuleNavigation, type NavigationModule } from '@/lib/navigation'
import { cn } from '@/lib/utils'

export function ModuleSubnav({ module, className }: { module: NavigationModule; className?: string }) {
  const pathname = usePathname()
  const role = useActiveRole()
  const items = role ? getModuleNavigation(role, module) : []
  if (!items.length) return null

  return <nav aria-label="Submódulos" className={cn('mb-6 flex flex-wrap gap-2', className)}>
    {items.map(item => {
      const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
      return <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined}
        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150 ${active ? 'bg-primary text-primary-foreground' : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
        {item.label}
      </Link>
    })}
  </nav>
}
