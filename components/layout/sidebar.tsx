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
  ClipboardList,
  Menu,
  X,
  DollarSign,
  Users,
  ChevronDown,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useMemo, useState } from 'react'
import { ThemeSwitcher } from './theme-switcher'
import { signOutEmployee } from '@/lib/supabase/auth'
import {
  ACTIVE_ROLE_EVENT,
  getActiveUserContext,
  getActiveUserRole,
  setActiveUserRole,
  type AppUserRole,
} from '@/lib/mock/runtime-store'

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
      { label: 'Kits', href: '/inventory/kits' },
      { label: 'Ingresos', href: '/inventory/entries' },
      { label: 'Salidas', href: '/inventory/exits' },
      { label: 'Traspasos', href: '/inventory/transfers' },
      { label: 'Anulaciones', href: '/inventory/voids' },
      { label: 'Historial de traspasos', href: '/inventory/history' },
      { label: 'Historial inventario', href: '/inventory/stock-history' },
      { label: 'Control', href: '/inventory/control' },
    ],
  },
  {
    label: 'Punto de Venta',
    href: '/pos/sales',
    icon: ShoppingCart,
    subItems: [
      { label: 'Ventas', href: '/pos/sales' },
      { label: 'Historial de Ventas', href: '/pos/sales-history' },
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
    label: 'Cotizaciones',
    href: '/cotizaciones/cotizacion',
    icon: ClipboardList,
    subItems: [
      { label: 'Cotización', href: '/cotizaciones/cotizacion' },
      { label: 'Historial de Cotizaciones', href: '/cotizaciones/historial' },
    ],
  },
  {
    label: 'Gestión',
    href: '/management/users',
    icon: Users,
    subItems: [
      { label: 'Usuarios', href: '/management/users' },
      { label: 'Dispositivos', href: '/management/devices' },
      { label: 'Clientes', href: '/management/customers' },
      { label: 'Sucursales', href: '/management/branches' },
      { label: 'Planilla de Sueldos', href: '/management/payroll' },
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
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [activeRole, setActiveRole] = useState<AppUserRole>('employee')
  const [activeUserName, setActiveUserName] = useState('Usuario Demo')
  const pathname = usePathname()

  useEffect(() => {
    const syncRole = () => {
      const context = getActiveUserContext()
      setActiveRole(context.role)
      setActiveUserName(context.user_name)
    }

    syncRole()
    const onRoleChanged = () => syncRole()
    window.addEventListener(ACTIVE_ROLE_EVENT, onRoleChanged)
    window.addEventListener('focus', syncRole)

    return () => {
      window.removeEventListener(ACTIVE_ROLE_EVENT, onRoleChanged)
      window.removeEventListener('focus', syncRole)
    }
  }, [])

  const visibleMenuItems = useMemo(() => {
    if (activeRole === 'read_only') {
      return [
        {
          label: 'Dashboard',
          href: '/dashboard',
          icon: BarChart3,
        },
        {
          label: 'Punto de Venta',
          href: '/pos/sales',
          icon: ShoppingCart,
          subItems: [
            { label: 'Ventas (Cola)', href: '/pos/sales' },
            { label: 'Historial de Ventas', href: '/pos/sales-history' },
          ],
        },
        {
          label: 'Inventario',
          href: '/inventory/control',
          icon: Package,
          subItems: [
            { label: 'Control', href: '/inventory/control' },
            { label: 'Historial de traspasos', href: '/inventory/history' },
            { label: 'Historial inventario', href: '/inventory/stock-history' },
            { label: 'Salidas', href: '/inventory/exits' },
          ],
        },
      ]
    }

    return menuItems.map((item) => {
      if (item.label !== 'Gestión') return item

      return {
        ...item,
        subItems: (item.subItems || []).filter((subItem) =>
          subItem.href === '/management/payroll' ? activeRole === 'admin' : true,
        ),
      }
    })
  }, [activeRole])

  useEffect(() => {
    const sectionToExpand = visibleMenuItems
      .filter(item => item.subItems?.length)
      .find(item =>
        item.subItems?.some(subItem => pathname === subItem.href || pathname.startsWith(`${subItem.href}/`))
      )

    if (!sectionToExpand) return

    setExpandedItems(prev =>
      prev.includes(sectionToExpand.label) ? prev : [...prev, sectionToExpand.label]
    )
  }, [pathname, visibleMenuItems])

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

  const switchRole = (role: AppUserRole) => {
    setActiveUserRole(role)
    setActiveRole(getActiveUserRole())
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between h-14 px-4 bg-sidebar/90 backdrop-blur-md border-b border-sidebar-border lg:hidden">
        <div className="font-bold text-lg text-sidebar-foreground tracking-tight">Picla</div>
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
        className={`fixed inset-y-14 left-0 z-50 w-[88vw] max-w-[22rem] bg-sidebar/95 border-r border-sidebar-border transform transition-transform duration-200 ease-out overflow-y-auto h-[calc(100svh-56px)] backdrop-blur-xl lg:relative lg:inset-y-0 lg:left-auto lg:w-72 lg:max-w-none lg:h-svh lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col min-h-full pt-6 px-4 pb-4">
          {/* Hidden on Mobile, shown on Desktop */}
          <div className="hidden lg:block mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sidebar-foreground/55 mb-2">
              Sistema Integral
            </p>
            <h1 className="text-xl font-bold text-sidebar-foreground leading-tight">
              Picla
            </h1>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 space-y-1">
            {visibleMenuItems.map((item) => {
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
                            ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-red-950/35'
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
                          {item.subItems?.map((subItem) => {
                            const isSubActive = pathname === subItem.href
                            return (
                              <Button
                                key={subItem.href}
                                asChild
                                variant="ghost"
                                className={`w-full justify-start text-xs rounded-lg ${
                                  isSubActive
                                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                                    : 'text-sidebar-foreground hover:bg-sidebar-accent/90'
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
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-red-950/35'
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
            <div className="space-y-2 rounded-xl border border-sidebar-border/70 px-3 py-2">
              <div>
                <p className="text-sm font-semibold text-sidebar-foreground">Rol de prueba (mock)</p>
                <p className="text-xs text-sidebar-foreground/70 mt-1">Usuario activo: {activeUserName}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button size="sm" variant={activeRole === 'admin' ? 'default' : 'outline'} onClick={() => switchRole('admin')}>
                  Admin
                </Button>
                <Button size="sm" variant={activeRole === 'manager' ? 'default' : 'outline'} onClick={() => switchRole('manager')}>
                  Encargado
                </Button>
                <Button size="sm" variant={activeRole === 'employee' ? 'default' : 'outline'} onClick={() => switchRole('employee')}>
                  Empleado
                </Button>
                <Button size="sm" variant={activeRole === 'read_only' ? 'default' : 'outline'} onClick={() => switchRole('read_only')}>
                  Solo lectura
                </Button>
              </div>
            </div>
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
