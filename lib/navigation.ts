import type { AppUserRole } from '@/lib/mock/runtime-store'

export type NavigationModule = 'inventory' | 'pos' | 'cotizaciones' | 'management' | 'credits' | 'reports'

export interface NavigationLink {
  label: string
  href: string
}

export interface NavigationItem extends NavigationLink {
  module?: NavigationModule
  subItems?: NavigationLink[]
}

const navigationItems: NavigationItem[] = [
  { label: 'Panel principal', href: '/dashboard' },
  {
    label: 'Inventario', href: '/inventory/entries', module: 'inventory',
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
    label: 'Punto de Venta', href: '/pos/sales', module: 'pos',
    subItems: [
      { label: 'Ventas', href: '/pos/sales' },
      { label: 'Historial de Ventas', href: '/pos/sales-history' },
      { label: 'Anulación Ventas', href: '/pos/void-sales' },
      { label: 'Venta Adelantada', href: '/pos/advance-sales' },
      { label: 'Por Entregar', href: '/pos/deliveries' },
      { label: 'Devoluciones', href: '/pos/returns' },
    ],
  },
  { label: 'Caja', href: '/cash' },
  {
    label: 'Cotizaciones', href: '/cotizaciones/cotizacion', module: 'cotizaciones',
    subItems: [
      { label: 'Cotización', href: '/cotizaciones/cotizacion' },
      { label: 'Historial de Cotizaciones', href: '/cotizaciones/historial' },
    ],
  },
  {
    label: 'Gestión', href: '/management/users', module: 'management',
    subItems: [
      { label: 'Usuarios', href: '/management/users' },
      { label: 'Dispositivos', href: '/management/devices' },
      { label: 'Clientes', href: '/management/customers' },
      { label: 'Sucursales', href: '/management/branches' },
      { label: 'Planilla de Sueldos', href: '/management/payroll' },
    ],
  },
  {
    label: 'Créditos', href: '/credits/new', module: 'credits',
    subItems: [
      { label: 'Nuevo Crédito', href: '/credits/new' },
      { label: 'Cartera', href: '/credits/portfolio' },
      { label: 'Pagos', href: '/credits/payments' },
      { label: 'Alertas', href: '/credits/alerts' },
      { label: 'Historial de cobros', href: '/credits/kardex' },
    ],
  },
  {
    label: 'Reportes', href: '/reports/profit', module: 'reports',
    subItems: [
      { label: 'Ganancias', href: '/reports/profit' },
      { label: 'Capital', href: '/reports/capital' },
      { label: 'Productos más vendidos', href: '/reports/top-products' },
      { label: 'Cuentas por Cobrar', href: '/reports/aging' },
      { label: 'Sueldos', href: '/reports/payroll' },
    ],
  },
  { label: 'Auditoría', href: '/audit' },
  { label: 'Configuración', href: '/settings' },
]

const readOnlyRoutes = new Set([
  '/pos/sales', '/pos/sales-history',
  '/inventory/products', '/inventory/categories', '/inventory/kits',
])
const adminModules = new Set(['/dashboard', '/audit', '/settings', '/management/users', '/reports/profit'])

/** Fuente compartida del sidebar, las barras internas y el acceso a páginas. */
export function getNavigationForRole(role: AppUserRole): NavigationItem[] {
  if (role === 'admin') return navigationItems

  if (role === 'read_only') {
    return ['pos', 'inventory'].flatMap(module => {
      const item = navigationItems.find(entry => entry.module === module)!
      const subItems = item.subItems!.filter(link => readOnlyRoutes.has(link.href)).map(link =>
        link.href === '/pos/sales' ? { ...link, label: 'Ventas (Cola)' } : link
      )
      return [{ ...item, href: subItems[0].href, subItems }]
    })
  }

  if (role === 'employee' || role === 'manager') {
    return navigationItems.filter(item => !adminModules.has(item.href)).map(item => {
      if (item.module === 'inventory') {
        return { ...item, href: '/inventory/products', subItems: item.subItems!.filter(link => link.href === '/inventory/products') }
      }
      if (item.module === 'pos') {
        return { ...item, subItems: item.subItems!.filter(link => link.href !== '/pos/void-sales') }
      }
      return item
    })
  }

  return []
}

export function getModuleNavigation(role: AppUserRole, module: NavigationModule): NavigationLink[] {
  return getNavigationForRole(role).find(item => item.module === module)?.subItems || []
}

export function canAccessPage(role: AppUserRole, pathname: string): boolean {
  // El cambio de contraseña propio está disponible en el pie del sidebar para todos.
  if (pathname === '/change-password' || pathname === '/management/change-password') return true
  if (role === 'admin') return true
  return getNavigationForRole(role).some(item =>
    (item.subItems || [item]).some(link => pathname === link.href || pathname.startsWith(`${link.href}/`))
  )
}

export function getRoleHomePage(role: AppUserRole): string {
  return role === 'admin' ? '/dashboard' : role === 'read_only' ? '/pos/sales' : '/inventory/products'
}
