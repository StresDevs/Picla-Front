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
  Cpu,
  Building2,
  UserRound,
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
      { label: 'Kits', href: '/inventory/kits' },
      { label: 'Ingresos', href: '/inventory/entries' },
      { label: 'Salidas', href: '/inventory/exits' },
      { label: 'Traspasos', href: '/inventory/transfers' },
      { label: 'Importación de catálogo', href: '/inventory/catalog-import' },
      { label: 'Anulaciones', href: '/inventory/voids' },
      { label: 'Historial de traspasos', href: '/inventory/history' },
      { label: 'Historial de inventario', href: '/inventory/stock-history' },
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

const inventoryBasicRoutes = new Set(['/inventory/products', '/inventory/kits'])

export function Sidebar() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [activeRole, setActiveRole] = useState<AppUserRole>('employee')
  const [activeUserName, setActiveUserName] = useState('Usuario Demo')
  const [activeBranchId, setActiveBranchId] = useState('branch-1')
  const [activeBranchName, setActiveBranchName] = useState('Sin sucursal')
  const [availableBranches, setAvailableBranches] = useState<Array<{ id: string; name: string }>>([])
  const pathname = usePathname()

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
        const { data: profile } = await supabase
          .rpc('get_current_user_profile')
          .single()

        if (!profile) return

        const resolvedRole = normalizeRole(profile.role_name)
        const fallbackBranchId = profile.branch_id || 'branch-1'
        const resolvedUserName =
          profile.full_name ||
          (authUser.user_metadata as { full_name?: string } | undefined)?.full_name ||
          'Usuario'
        const resolvedBranchName = profile.branch_name || 'Sin sucursal'

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

  const visibleMenuItems = useMemo(() => {
    if (activeRole === 'read_only') {
      return [
        {
          label: 'Panel principal',
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
          href: '/inventory/products',
          icon: Package,
          subItems: [
            { label: 'Productos', href: '/inventory/products' },
            { label: 'Kits', href: '/inventory/kits' },
          ],
        },
      ]
    }

    return menuItems.map((item) => {
      if (item.label === 'Inventario') {
        const canSeeInventoryOps = activeRole === 'admin' || activeRole === 'manager'
        const filteredSubItems = (item.subItems || []).filter((subItem) =>
          canSeeInventoryOps ? true : inventoryBasicRoutes.has(subItem.href)
        )

        return {
          ...item,
          href: canSeeInventoryOps ? item.href : '/inventory/products',
          subItems: filteredSubItems,
        }
      }

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

  const handleBranchSelection = (branchId: string) => {
    const selected = availableBranches.find((item) => item.id === branchId)
    setActiveBranchId(branchId)
    setActiveBranchName(selected?.name || 'Sin sucursal')
    setActiveUserContext({ branch_id: branchId })
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
            <div className="rounded-2xl border border-sidebar-border/70 bg-gradient-to-br from-red-950/35 via-rose-950/25 to-zinc-900/30 p-4 shadow-[0_12px_28px_-16px_hsl(0_70%_5%/0.8)]">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/70">
                <Cpu className="h-3.5 w-3.5 text-cyan-300" />
                Repuestos Mecanicos
              </div>
              <h1 className="mt-2 text-[1.6rem] font-extrabold leading-tight tracking-[0.03em] text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-cyan-200 to-sky-300 drop-shadow-[0_1px_0_hsl(0_0%_100%_/_0.15)]">
                Picla
              </h1>
            </div>

            <div className="mt-3 rounded-xl border border-sidebar-border/70 bg-sidebar-accent/35 p-3 space-y-2">
              <p className="text-xs font-medium text-sidebar-foreground/80 flex items-center gap-2">
                <UserRound className="h-3.5 w-3.5" />
                {activeUserName}
              </p>
              <p className="text-xs uppercase tracking-wide text-sidebar-foreground/65">
                Rol: {activeRole}
              </p>
              {activeRole === 'admin' ? (
                <div className="space-y-1">
                  <p className="text-[11px] text-sidebar-foreground/70 flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> Sucursal operativa
                  </p>
                  <Select value={activeBranchId} onValueChange={handleBranchSelection}>
                    <SelectTrigger className="h-8 border-sidebar-border/70 bg-sidebar/40 text-xs text-sidebar-foreground">
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
