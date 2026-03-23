'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BarChart3,
  ShoppingCart,
  Package,
  CreditCard,
  FileText,
  Clock,
  Settings,
  Menu,
  X,
  DollarSign,
  Users,
  ChevronDown,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { ThemeSwitcher } from './theme-switcher'
import { signOutEmployee } from '@/lib/supabase/auth'

interface MenuItem {
  label: string
  href?: string
  icon: any
  subItems?: Array<{
    label: string
    href: string
  }>
}

const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3,
  },
  {
    label: 'Inventario',
    href: '/inventory/entries',
    icon: Package,
    subItems: [
      { label: 'Productos', href: '/inventory/products' },
      { label: 'Ingresos', href: '/inventory/entries' },
      { label: 'Salidas', href: '/inventory/exits' },
      { label: 'Transferencias', href: '/inventory/transfers' },
      { label: 'Anulaciones', href: '/inventory/voids' },
      { label: 'Kardex', href: '/inventory/kardex' },
      { label: 'Control', href: '/inventory/control' },
    ],
  },
  {
    label: 'Punto de Venta',
    href: '/pos/sales',
    icon: ShoppingCart,
    subItems: [
      { label: 'Ventas', href: '/pos/sales' },
      { label: 'Anulación Ventas', href: '/pos/void-sales' },
      { label: 'Venta Adelantada', href: '/pos/advance-sales' },
      { label: 'Por Entregar', href: '/pos/deliveries' },
      { label: 'Devoluciones', href: '/pos/returns' },
    ],
  },
  {
    label: 'Caja',
    href: '/cash',
    icon: DollarSign,
  },
  {
    label: 'Gestión',
    href: '/management/users',
    icon: Users,
    subItems: [
      { label: 'Usuarios', href: '/management/users' },
      { label: 'Clientes', href: '/management/customers' },
      { label: 'Sucursales', href: '/management/branches' },
    ],
  },
  {
    label: 'Créditos',
    href: '/credits/new',
    icon: CreditCard,
    subItems: [
      { label: 'Nuevo Crédito', href: '/credits/new' },
      { label: 'Cartera', href: '/credits/portfolio' },
      { label: 'Pagos', href: '/credits/payments' },
      { label: 'Alertas', href: '/credits/alerts' },
      { label: 'Kardex Cobros', href: '/credits/kardex' },
    ],
  },
  {
    label: 'Reportes',
    href: '/reports/profit',
    icon: FileText,
    subItems: [
      { label: 'Ganancias', href: '/reports/profit' },
      { label: 'Capital', href: '/reports/capital' },
      { label: 'Top Productos', href: '/reports/top-products' },
      { label: 'Cuentas por Cobrar', href: '/reports/aging' },
    ],
  },
  {
    label: 'Auditoría',
    href: '/audit',
    icon: Clock,
  },
  {
    label: 'Configuración',
    href: '/settings',
    icon: Settings,
  },
]

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const sectionToExpand = menuItems
      .filter(item => item.subItems?.length)
      .find(item =>
        item.subItems?.some(subItem => pathname === subItem.href || pathname.startsWith(`${subItem.href}/`))
      )

    if (!sectionToExpand) return

    setExpandedItems(prev =>
      prev.includes(sectionToExpand.label) ? prev : [...prev, sectionToExpand.label]
    )
  }, [pathname])

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    )
  }

  const handleLogout = async () => {
    await signOutEmployee()
    setIsOpen(false)
    router.replace('/login')
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between h-14 px-4 bg-sidebar/90 backdrop-blur-md border-b border-sidebar-border lg:hidden">
        <div className="font-bold text-lg text-sidebar-foreground tracking-tight">Repuestos</div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="text-sidebar-foreground hover:bg-sidebar-accent/70"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Sidebar - Persistente en desktop */}
      <aside
        className={`top-14 left-0 z-50 w-72 bg-sidebar/92 border-r border-sidebar-border transform transition-transform duration-200 lg:translate-x-0 overflow-y-auto max-h-[calc(100vh-56px)] backdrop-blur-xl ${
          isOpen ? 'translate-x-0 fixed' : '-translate-x-full lg:translate-x-0'
        } lg:sticky lg:top-0 lg:h-svh`}
      >
        <div className="flex flex-col min-h-full pt-6 px-4 pb-4">
          {/* Hidden on Mobile, shown on Desktop */}
          <div className="hidden lg:block mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sidebar-foreground/55 mb-2">
              Sistema Integral
            </p>
            <h1 className="text-xl font-bold text-sidebar-foreground leading-tight">
              Gestión de Repuestos
            </h1>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = item.href ? pathname.startsWith(item.href.split('/').slice(0, 2).join('/')) : false
              const isExpanded = expandedItems.includes(item.label)
              const hasSubItems = item.subItems && item.subItems.length > 0

              return (
                <div key={item.label}>
                  {hasSubItems ? (
                    <>
                      <button
                        onClick={() => toggleExpanded(item.label)}
                        className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-primary/25'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent/75'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5" />
                          <span>{item.label}</span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {isExpanded && (
                        <div className="space-y-1 pl-4 mt-1">
                          {item.subItems.map((subItem) => {
                            const isSubActive = pathname === subItem.href
                            return (
                              <Button
                                key={subItem.href}
                                asChild
                                variant="ghost"
                                className={`w-full justify-start text-xs rounded-lg ${
                                  isSubActive
                                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                                    : 'text-sidebar-foreground hover:bg-sidebar-accent/80'
                                }`}
                              >
                                <Link
                                  href={subItem.href}
                                  onClick={() => setIsOpen(false)}
                                >
                                  <span>{subItem.label}</span>
                                </Link>
                              </Button>
                            )
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <Button
                      asChild
                      variant={isActive ? 'default' : 'ghost'}
                      className={`w-full justify-start gap-3 rounded-xl py-2.5 ${
                        isActive
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-primary/25'
                          : 'bg-transparent text-sidebar-foreground shadow-none hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
                      }`}
                    >
                      <Link
                        href={item.href || '#'}
                        onClick={() => setIsOpen(false)}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </Link>
                    </Button>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Bottom Section */}
          <div className="space-y-2 border-t border-sidebar-border/80 pt-4 mt-4">
            <ThemeSwitcher />
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start gap-3 rounded-xl py-2.5 text-sidebar-foreground hover:bg-sidebar-accent/60"
            >
              <LogOut className="w-5 h-5" />
              <span>Cerrar sesión</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
          style={{ top: '56px' }}
        />
      )}
    </>
  )
}
