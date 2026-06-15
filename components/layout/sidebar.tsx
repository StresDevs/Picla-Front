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
  ChevronLeft,
  ChevronRight,
  LogOut,
  Wrench,
  Building2,
  UserRound,
  KeyRound,
  Bell,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useMemo, useState } from 'react'
import { ThemeSwitcher } from './theme-switcher'
import { getCurrentAuthUser, signOutEmployee } from '@/lib/supabase/auth'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ACTIVE_ROLE_EVENT,
  getActiveUserContext,
  setActiveUserContext,
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
    label: 'Panel principal',
    href: '/dashboard',
    icon: BarChart3,
  },
  {
    label: 'Inventario',
    href: '/inventory/entries',
    icon: Package,
    subItems: [
      { label: 'Productos', href: '/inventory/products' },
      { label: 'Categorías', href: '/inventory/categories' },
      { label: 'Kits', href: '/inventory/kits' },
      { label: 'Ingresos', href: '/inventory/entries' },
      { label: 'Salidas', href: '/inventory/exits' },
      { label: 'Traspasos', href: '/inventory/transfers' },
      { label: 'Importación de catálogo', href: '/inventory/catalog-import' },
      { label: 'Anulaciones', href: '/inventory/voids' },
      { label: 'Historial de traspasos', href: '/inventory/history' },
      { label: 'Historial de inventario', href: '/inventory/stock-history' },
      { label: 'Control', href: '/inventory/control' },
      { label: 'Recuperar productos', href: '/inventory/recovery' },
      { label: 'Matriz de precios', href: '/inventory/price-matrix' },
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
      { label: 'Historial de cobros', href: '/credits/kardex' },
    ],
  },
  {
    label: 'Reportes',
    href: '/reports/profit',
    icon: FileText,
    subItems: [
      { label: 'Ganancias', href: '/reports/profit' },
      { label: 'Capital', href: '/reports/capital' },
      { label: 'Productos más vendidos', href: '/reports/top-products' },
      { label: 'Cuentas por Cobrar', href: '/reports/aging' },
      { label: 'Sueldos', href: '/reports/payroll' },
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

const inventoryBasicRoutes = new Set(['/inventory/products', '/inventory/kits', '/inventory/categories'])
const inventoryAdminRoutes = new Set(['/inventory/recovery', '/inventory/price-matrix'])

interface SidebarProps {
  desktopOpen?: boolean
  onDesktopToggle?: () => void
}

export function Sidebar({ desktopOpen = true, onDesktopToggle }: SidebarProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [activeRole, setActiveRole] = useState<AppUserRole>('employee')
  const [activeUserName, setActiveUserName] = useState('Usuario Demo')
  const [activeBranchId, setActiveBranchId] = useState('branch-1')
  const [activeBranchName, setActiveBranchName] = useState('Sin sucursal')
  const [availableBranches, setAvailableBranches] = useState<Array<{ id: string; name: string }>>([])
  const [notificationCount, setNotificationCount] = useState(0)
  const pathname = usePathname()

  // Desktop rail mode: when the sidebar is collapsed it becomes an icon-only rail.
  const collapsed = !desktopOpen

  useEffect(() => {
    const syncRole = () => {
      const context = getActiveUserContext()
      setActiveRole(context.role)
      setActiveUserName(context.user_name)
      setActiveBranchId(context.branch_id)
    }

    const normalizeRole = (value: string | null | undefined): AppUserRole => {
      if (value === 'admin' || value === 'manager' || value === 'employee' || value === 'read_only') {
        return value
      }
      return 'employee'
    }

    const hydrateProfile = async () => {
      try {
        const authUser = await getCurrentAuthUser()
        if (!authUser?.id) return

        const supabase = getSupabaseClient()
        const { data } = await supabase
          .rpc('get_current_user_profile')
          .single()

        const profile = data as any

        if (!profile) return

        const resolvedRole = normalizeRole(profile?.role_name)
        const fallbackBranchId = profile?.branch_id || 'branch-1'
        const resolvedUserName =
          profile?.full_name ||
          (authUser.user_metadata as { full_name?: string } | undefined)?.full_name ||
          'Usuario'
        const resolvedBranchName = profile?.branch_name || 'Sin sucursal'

        if (resolvedRole === 'admin') {
          const { data: branches } = await supabase
            .from('branches')
            .select('id, name')
            .order('name', { ascending: true })

          const branchOptions = (branches || []) as Array<{ id: string; name: string }>
          setAvailableBranches(branchOptions)

          const currentContext = getActiveUserContext()
          const isCurrentBranchValid = branchOptions.some((item) => item.id === currentContext.branch_id)
          const selectedBranchId = isCurrentBranchValid ? currentContext.branch_id : (branchOptions[0]?.id || fallbackBranchId)
          const selectedBranchName = branchOptions.find((item) => item.id === selectedBranchId)?.name || 'Sin sucursal'

          setActiveBranchName(selectedBranchName)
          setActiveUserContext({
            role: resolvedRole,
            user_name: resolvedUserName,
            branch_id: selectedBranchId,
          })
          return
        }

        setAvailableBranches([])
        setActiveBranchName(resolvedBranchName)
        setActiveUserContext({
          role: resolvedRole,
          user_name: resolvedUserName,
          branch_id: fallbackBranchId,
        })
      } catch {
        // Si falla la carga del perfil, se conserva el contexto existente.
      }
    }

    syncRole()
    void hydrateProfile()
    const onRoleChanged = () => syncRole()
    window.addEventListener(ACTIVE_ROLE_EVENT, onRoleChanged)
    window.addEventListener('focus', syncRole)

    return () => {
      window.removeEventListener(ACTIVE_ROLE_EVENT, onRoleChanged)
      window.removeEventListener('focus', syncRole)
    }
  }, [])

  // Fetch notification count for admin
  useEffect(() => {
    if (activeRole !== 'admin') {
      setNotificationCount(0)
      return
    }

    const fetchNotifications = async () => {
      try {
        const supabase = getSupabaseClient()
        const { count } = await supabase
          .from('credit_payment_requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending')
        setNotificationCount(count || 0)
      } catch {
        // silently fail
      }
    }

    void fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [activeRole])

  const visibleMenuItems = useMemo(() => {
    if (activeRole === 'read_only') {
      return [
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
          href: '/inventory/products',
          icon: Package,
          subItems: [
            { label: 'Productos', href: '/inventory/products' },
            { label: 'Categorías', href: '/inventory/categories' },
            { label: 'Kits', href: '/inventory/kits' },
          ],
        },
      ]
    }

    if (activeRole === 'manager' || activeRole === 'employee') {
      const hiddenModules = new Set(['Panel principal', 'Gestión', 'Reportes', 'Auditoría', 'Configuración'])
      return menuItems
        .filter((item) => !hiddenModules.has(item.label))
        .map((item) => {
          if (item.label === 'Inventario') {
            return {
              ...item,
              href: '/inventory/products',
              subItems: [{ label: 'Productos', href: '/inventory/products' }],
            }
          }
          if (item.label === 'Punto de Venta') {
            return {
              ...item,
              subItems: (item.subItems || []).filter((sub) => sub.href !== '/pos/void-sales'),
            }
          }
          return item
        })
    }

    // admin only path
    return menuItems
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

  // In rail mode, clicking a section icon expands the rail and opens that section.
  const handleSectionClick = (label: string) => {
    if (collapsed) {
      onDesktopToggle?.()
      setExpandedItems(prev => (prev.includes(label) ? prev : [...prev, label]))
      return
    }
    toggleExpanded(label)
  }

  const handleLogout = async () => {
    const deviceSessionId = window.sessionStorage.getItem('device_session_id')

    if (deviceSessionId) {
      try {
        const supabase = getSupabaseClient()
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData.session?.access_token

        if (token) {
          await fetch('/api/devices/sessions/close', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ id: deviceSessionId }),
          })
        }
      } catch {
        // El cierre del registro de dispositivo no debe bloquear el cierre de sesión
      }

      window.sessionStorage.removeItem('device_session_id')
    }

    await signOutEmployee()
    setIsOpen(false)
    router.replace('/login')
  }

  const handleBranchSelection = (branchId: string) => {
    const selected = availableBranches.find((item) => item.id === branchId)
    setActiveBranchId(branchId)
    setActiveBranchName(selected?.name || 'Sin sucursal')
    setActiveUserContext({ branch_id: branchId })
  }

  // Compact brand mark (used in rail mode)
  const BrandMark = () => (
    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-red-600 to-orange-500 shadow-[0_4px_12px_-4px_hsl(0_85%_45%/0.7)]">
      <Wrench className="h-5 w-5 text-white" strokeWidth={2.4} />
    </div>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between h-14 px-4 bg-sidebar/95 backdrop-blur-md border-b border-sidebar-border lg:hidden">
        <div className="flex items-center gap-2.5">
          <BrandMark />
          <span className="font-extrabold text-lg text-sidebar-foreground tracking-tight">Picla</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="text-sidebar-foreground hover:bg-sidebar-accent/70 rounded-md"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Sidebar - Persistente en desktop (riel/colapsable) */}
      <aside
        className={`fixed inset-y-14 left-0 z-50 w-[88vw] max-w-[22rem] shrink-0 bg-sidebar border-r border-sidebar-border transform transition-[transform,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-y-auto overflow-x-hidden h-[calc(100svh-56px)] backdrop-blur-xl lg:relative lg:inset-y-0 lg:left-auto lg:h-svh ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${
          collapsed
            ? 'lg:w-[4.5rem]'
            : 'lg:w-72'
        }`}
      >
        <div className={`flex flex-col min-h-full pb-4 ${collapsed ? 'lg:px-2 lg:pt-3 px-4 pt-6' : 'px-4 pt-6'}`}>
          {/* Header — Desktop only */}
          <div className={`hidden lg:block ${collapsed ? 'lg:mb-4' : 'lg:mb-6'}`}>
            {collapsed ? (
              <div className="flex flex-col items-center gap-3">
                <BrandMark />
                {onDesktopToggle ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-sidebar-foreground hover:bg-sidebar-accent/70 rounded-md"
                    onClick={onDesktopToggle}
                    aria-label="Expandir menú"
                    title="Expandir menú"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0 rounded-md border border-sidebar-border/70 bg-gradient-to-br from-red-950/45 via-orange-950/25 to-zinc-900/40 p-4 shadow-[0_12px_28px_-16px_hsl(0_70%_5%/0.8)]">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/70">
                      <Wrench className="h-3.5 w-3.5 text-orange-400" />
                      Repuestos Mecánicos
                    </div>
                    <h1 className="mt-2 text-[1.6rem] font-extrabold leading-tight tracking-[0.04em] text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-100 to-orange-400">
                      Picla
                    </h1>
                  </div>
                  {onDesktopToggle ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-9 w-9 text-sidebar-foreground hover:bg-sidebar-accent/70 rounded-md"
                      onClick={onDesktopToggle}
                      aria-label="Colapsar menú"
                      title="Colapsar menú"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>

                <div className="mt-3 rounded-md border border-sidebar-border/70 bg-sidebar-accent/35 p-3 space-y-2">
                  <p className="text-xs font-medium text-sidebar-foreground/85 flex items-center gap-2">
                    <UserRound className="h-3.5 w-3.5" />
                    {activeUserName}
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange-300/90">
                    Rol: {activeRole === 'admin' ? 'Administrador' : activeRole === 'manager' ? 'Encargado' : activeRole === 'employee' ? 'Empleado' : 'Solo lectura'}
                  </p>
                  {activeRole === 'admin' ? (
                    <div className="space-y-1">
                      <p className="text-[11px] text-sidebar-foreground/70 flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> Sucursal operativa
                      </p>
                      <Select value={activeBranchId} onValueChange={handleBranchSelection}>
                        <SelectTrigger className="h-8 border-sidebar-border/70 bg-sidebar/40 text-xs text-sidebar-foreground rounded-md">
                          <SelectValue placeholder="Seleccionar sucursal" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableBranches.map((branch) => (
                            <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <p className="text-xs text-sidebar-foreground/75 flex items-center gap-1">
                      <Building2 className="h-3 w-3" /> {activeBranchName}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Navigation Items */}
          <nav className={`flex-1 ${collapsed ? 'lg:space-y-1.5 space-y-1' : 'space-y-1'}`}>
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
                        data-sidebar-item
                        onClick={() => handleSectionClick(item.label)}
                        title={collapsed ? item.label : undefined}
                        className={`relative w-full flex items-center gap-3 rounded-md text-sm font-medium ${
                          collapsed ? 'lg:justify-center lg:px-0 lg:h-11 px-3 py-2.5 justify-between' : 'justify-between px-3 py-2.5'
                        } ${
                          isActive
                            ? 'bg-sidebar-accent/70 text-white nav-active-bar'
                            : 'text-sidebar-foreground/90 hover:bg-sidebar-accent/60 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-orange-300' : ''}`} />
                          <span className={collapsed ? 'lg:hidden' : ''}>{item.label}</span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform shrink-0 ${collapsed ? 'lg:hidden' : ''} ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {isExpanded && (
                        <div className={`space-y-0.5 pl-3 mt-1 border-l-2 border-sidebar-border/60 ml-3.5 animate-expand-down ${collapsed ? 'lg:hidden' : ''}`}>
                          {item.subItems?.map((subItem) => {
                            const isSubActive = pathname === subItem.href || pathname.startsWith(`${subItem.href}/`)
                            return (
                              <Button
                                key={subItem.href}
                                asChild
                                variant="ghost"
                                data-sidebar-item
                                className={`w-full justify-start text-xs rounded-md ${
                                  isSubActive
                                    ? 'bg-sidebar-primary/20 text-white font-semibold border-l-2 border-sidebar-primary'
                                    : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/55 hover:text-white'
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
                      variant="ghost"
                      data-sidebar-item
                      title={collapsed ? item.label : undefined}
                      className={`relative w-full gap-3 rounded-md py-2.5 ${
                        collapsed ? 'lg:justify-center lg:px-0 lg:h-11 justify-start' : 'justify-start'
                      } ${
                        isActive
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-sm shadow-red-950/40 hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground'
                          : 'bg-transparent text-sidebar-foreground/90 shadow-none hover:bg-sidebar-accent/60 hover:text-white'
                      }`}
                    >
                      <Link
                        href={item.href || '#'}
                        onClick={() => setIsOpen(false)}
                      >
                        <Icon className="w-5 h-5 shrink-0" />
                        <span className={collapsed ? 'lg:hidden' : ''}>{item.label}</span>
                      </Link>
                    </Button>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Bottom Section */}
          <div className={`space-y-1.5 border-t border-sidebar-border/80 pt-4 mt-4 ${collapsed ? 'lg:flex lg:flex-col lg:items-center' : ''}`}>
            {activeRole === 'admin' && notificationCount > 0 && (
              <Button
                asChild
                variant="ghost"
                title={collapsed ? 'Solicitudes pendientes' : undefined}
                className={`relative w-full gap-3 rounded-md py-2.5 text-amber-400 hover:bg-amber-500/10 ${
                  collapsed ? 'lg:justify-center lg:px-0 lg:h-11 justify-start' : 'justify-start'
                }`}
              >
                <Link href="/credits/payments" onClick={() => setIsOpen(false)}>
                  <Bell className="w-5 h-5 shrink-0" />
                  <span className={collapsed ? 'lg:hidden' : ''}>Solicitudes pendientes</span>
                  <span className={`inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-amber-500 text-[10px] font-bold text-black ${collapsed ? 'lg:absolute lg:top-1 lg:right-1 ml-auto' : 'ml-auto'}`}>
                    {notificationCount}
                  </span>
                </Link>
              </Button>
            )}
            <ThemeSwitcher collapsed={collapsed} />
            <Button
              asChild
              variant="ghost"
              title={collapsed ? 'Cambiar contraseña' : undefined}
              className={`w-full gap-3 rounded-md py-2.5 text-sidebar-foreground/90 hover:bg-sidebar-accent/60 hover:text-white ${
                collapsed ? 'lg:justify-center lg:px-0 lg:h-11 justify-start' : 'justify-start'
              }`}
            >
              <Link href="/management/change-password" onClick={() => setIsOpen(false)}>
                <KeyRound className="w-5 h-5 shrink-0" />
                <span className={collapsed ? 'lg:hidden' : ''}>Cambiar contraseña</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              title={collapsed ? 'Cerrar sesión' : undefined}
              onClick={handleLogout}
              className={`w-full gap-3 rounded-md py-2.5 text-sidebar-foreground/90 hover:bg-destructive/15 hover:text-red-300 ${
                collapsed ? 'lg:justify-center lg:px-0 lg:h-11 justify-start' : 'justify-start'
              }`}
            >
              <LogOut className="w-5 h-5 shrink-0" />
              <span className={collapsed ? 'lg:hidden' : ''}>Cerrar sesión</span>
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
