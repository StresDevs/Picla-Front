'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { QuotationsSubnav } from '@/components/modules/quotations/quotations-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Trash2, ReceiptText, UserPlus } from 'lucide-react'
import {
  ACTIVE_ROLE_EVENT,
  getActiveUserContext,
  type AppUserRole,
} from '@/lib/mock/runtime-store'
import { getSupabaseClient } from '@/lib/supabase/client'
import { customersService, type CustomerRecord } from '@/lib/supabase/customers'
import { quotationsService } from '@/lib/supabase/quotations'
import { showErrorAlert } from '@/lib/sweet-alert'

interface BranchOption {
  id: string
  name: string
}

interface ProductOption {
  id: string
  branch_id: string
  code: string
  name: string
  category: string | null
  price: number
  quotation_min_price: number | null
  quotation_max_price: number | null
  is_active: boolean | null
}

interface NewCustomerForm {
  full_name: string
  nit_ci: string
  phone: string
  email: string
}

interface QuoteCartItem {
  id: string
  part_id: string
  code: string
  name: string
  unit_price: number
  quantity: number
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function normalizeBranchId(value?: string | null) {
  const raw = (value || '').trim()
  return UUID_PATTERN.test(raw) ? raw : null
}

function canAdjustQuotationPrices(role: AppUserRole) {
  return role === 'admin' || role === 'manager' || role === 'employee' || role === 'read_only'
}

function extractErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object') {
    const candidate = error as {
      message?: unknown
      details?: unknown
      hint?: unknown
      code?: unknown
    }

    const message = typeof candidate.message === 'string' ? candidate.message.trim() : ''
    const details = typeof candidate.details === 'string' ? candidate.details.trim() : ''
    const hint = typeof candidate.hint === 'string' ? candidate.hint.trim() : ''
    const code = typeof candidate.code === 'string' ? candidate.code.trim() : ''

    const parts = [message, details, hint].filter((part) => part.length > 0)
    if (parts.length > 0) {
      return parts.join(' | ')
    }

    if (code.length > 0) {
      return code
    }
  }

  if (error instanceof Error && error.message) return error.message
  return fallback
}

export default function QuotationPage() {
  const [products, setProducts] = useState<ProductOption[]>([])
  const [customers, setCustomers] = useState<CustomerRecord[]>([])
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [customerSearchTerm, setCustomerSearchTerm] = useState('')
  const [cart, setCart] = useState<QuoteCartItem[]>([])
  const [customerId, setCustomerId] = useState('')
  const [branchId, setBranchId] = useState(() => getActiveUserContext().branch_id)
  const [quotedBy, setQuotedBy] = useState(() => getActiveUserContext().user_name)
  const [activeRole, setActiveRole] = useState<AppUserRole>(() => getActiveUserContext().role)
  const [expiresAt, setExpiresAt] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    return date.toISOString().slice(0, 10)
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false)
  const [showCustomerForm, setShowCustomerForm] = useState(false)
  const [priceDraftByItemId, setPriceDraftByItemId] = useState<Record<string, string>>({})
  const [newCustomer, setNewCustomer] = useState<NewCustomerForm>({
    full_name: '',
    nit_ci: '',
    phone: '',
    email: '',
  })
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const displayQuotedBy = quotedBy.trim() || 'Sin usuario activo'

  const notifyError = async (message: string) => {
    setError(message)
    await showErrorAlert(message)
  }

  const loadBranches = async (preferredBranchId?: string | null) => {
    const supabase = getSupabaseClient()
    const { data, error: loadError } = await supabase
      .from('branches')
      .select('id,name')
      .order('name', { ascending: true })

    if (loadError) throw loadError

    const branchRows = (data || []) as BranchOption[]
    setBranches(branchRows)

    if (branchRows.length === 0) return

    const preferred = (preferredBranchId || '').trim()
    const exists = preferred && branchRows.some((branch) => branch.id === preferred)
    if (!exists) {
      setBranchId(branchRows[0].id)
    }
  }

  const loadBranchScopedData = async (targetBranchId: string) => {
    const normalizedBranchId = normalizeBranchId(targetBranchId)
    const supabase = getSupabaseClient()

    const productsQuery = supabase
      .from('parts')
      .select('id,branch_id,code,name,category,price,quotation_min_price,quotation_max_price,is_active')
      .order('name', { ascending: true })

    if (normalizedBranchId) {
      productsQuery.eq('branch_id', normalizedBranchId)
    }

    const [{ data: partsData, error: partsError }, customersData] = await Promise.all([
      productsQuery,
      customersService.getForSales({ branch_id: normalizedBranchId }),
    ])

    if (partsError) throw partsError

    const nextProducts = ((partsData || []) as ProductOption[]).filter((part) => part.is_active !== false)
    setProducts(nextProducts)
    setCustomers(customersData)

    setCustomerId((previousCustomerId) => {
      if (previousCustomerId && customersData.some((customer) => customer.id === previousCustomerId)) {
        return previousCustomerId
      }
      return customersData[0]?.id || ''
    })

    setCart((previousCart) =>
      previousCart.filter((item) => nextProducts.some((part) => part.id === item.part_id)),
    )
  }

  useEffect(() => {
    const syncContext = () => {
      const context = getActiveUserContext()
      setActiveRole(context.role)
      setQuotedBy(context.user_name)
      setBranchId((previousBranch) => previousBranch || context.branch_id)
    }

    syncContext()
    window.addEventListener(ACTIVE_ROLE_EVENT, syncContext)
    window.addEventListener('focus', syncContext)

    return () => {
      window.removeEventListener(ACTIVE_ROLE_EVENT, syncContext)
      window.removeEventListener('focus', syncContext)
    }
  }, [])

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true)
      setError(null)
      setFeedback(null)

      try {
        await loadBranches(branchId)
      } catch (loadError) {
        const message = extractErrorMessage(loadError, 'No se pudieron cargar las sucursales')
        setError(message)
        await showErrorAlert(message)
      } finally {
        setIsLoading(false)
      }
    }

    void initialize()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      setFeedback(null)

      try {
        await loadBranchScopedData(branchId)
      } catch (loadError) {
        const message = extractErrorMessage(loadError, 'No se pudieron cargar productos y clientes')
        setError(message)
        await showErrorAlert(message)
      } finally {
        setIsLoading(false)
      }
    }

    if (!branchId) return
    void fetchData()
  }, [branchId])

  useEffect(() => {
    setPriceDraftByItemId((previous) => {
      const next: Record<string, string> = {}

      for (const item of cart) {
        next[item.id] = previous[item.id] ?? item.unit_price.toFixed(2)
      }

      return next
    })
  }, [cart])

  const filteredProducts = useMemo(() => {
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.code.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [products, searchTerm])

  const filteredCustomers = useMemo(() => {
    const term = customerSearchTerm.trim().toLowerCase()
    if (!term) return customers

    return customers.filter((customer) => {
      const fullName = customer.full_name.toLowerCase()
      const nitCi = customer.nit_ci.toLowerCase()
      return fullName.includes(term) || nitCi.includes(term)
    })
  }, [customers, customerSearchTerm])

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  }, [cart])

  const addToCart = (partId: string) => {
    const part = products.find((item) => item.id === partId)
    if (!part) return

    setCart((prev) => {
      const existing = prev.find((item) => item.part_id === part.id)
      if (existing) {
        return prev.map((item) =>
          item.part_id === part.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
      }

      return [
        ...prev,
        {
          id: `qcart-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
          part_id: part.id,
          code: part.code,
          name: part.name,
          unit_price: Number(part.price || 0),
          quantity: 1,
        },
      ]
    })
  }

  const updateQty = (itemId: string, value: string) => {
    const qty = Math.max(1, Math.floor(Number(value || 1)))
    setCart((prev) => prev.map((item) => (item.id === itemId ? { ...item, quantity: qty } : item)))
  }

  const updateUnitPrice = (itemId: string, value: string) => {
    setPriceDraftByItemId((previous) => ({
      ...previous,
      [itemId]: value,
    }))
  }

  const commitUnitPrice = async (itemId: string) => {
    if (!canAdjustQuotationPrices(activeRole)) return

    const currentItem = cart.find((item) => item.id === itemId)
    if (!currentItem) return

    const rawValue = (priceDraftByItemId[itemId] ?? currentItem.unit_price.toFixed(2)).trim()
    const normalizedValue = rawValue.replace(',', '.')
    const typed = Number(normalizedValue)

    if (!Number.isFinite(typed) || typed <= 0) {
      await notifyError('Ingresa un precio valido para el producto.')
      setPriceDraftByItemId((previous) => ({
        ...previous,
        [itemId]: currentItem.unit_price.toFixed(2),
      }))
      return
    }

    const roundedTyped = Number(typed.toFixed(2))
    const part = products.find((product) => product.id === currentItem.part_id)

    if (part) {
      const basePrice = Number(part.price || 0)
      const minQuotationPrice = part.quotation_min_price ?? Number((basePrice * 0.9).toFixed(2))
      const maxQuotationPrice = part.quotation_max_price ?? Number((basePrice * 1.2).toFixed(2))

      if (roundedTyped < minQuotationPrice || roundedTyped > maxQuotationPrice) {
        await notifyError('No puedes exceder o reducir ese precio permitido para este producto.')
        setPriceDraftByItemId((previous) => ({
          ...previous,
          [itemId]: currentItem.unit_price.toFixed(2),
        }))
        return
      }
    }

    setError(null)

    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item
        return {
          ...item,
          unit_price: roundedTyped,
        }
      }),
    )

    setPriceDraftByItemId((previous) => ({
      ...previous,
      [itemId]: roundedTyped.toFixed(2),
    }))
  }

  const removeItem = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId))
  }

  const handleCreateCustomer = async () => {
    setError(null)
    setFeedback(null)

    const fullName = newCustomer.full_name.trim()
    const nitCi = newCustomer.nit_ci.trim()

    if (!fullName) {
      await notifyError('El nombre del cliente es obligatorio.')
      return
    }

    if (!nitCi) {
      await notifyError('El NIT/CI del cliente es obligatorio.')
      return
    }

    setIsCreatingCustomer(true)

    try {
      const created = await customersService.createQuick({
        branch_id: normalizeBranchId(branchId),
        full_name: fullName,
        nit_ci: nitCi,
        phone: newCustomer.phone.trim() || null,
        email: newCustomer.email.trim() || null,
      })

      if (!created) {
        throw new Error('No se obtuvo el registro creado del cliente')
      }

      setCustomers((previous) => {
        const withoutDuplicate = previous.filter((item) => item.id !== created.id)
        return [created, ...withoutDuplicate].sort((a, b) => a.full_name.localeCompare(b.full_name, 'es'))
      })
      setCustomerId(created.id)
      setShowCustomerForm(false)
      setNewCustomer({ full_name: '', nit_ci: '', phone: '', email: '' })
      setFeedback(`Cliente creado: ${created.full_name}`)
    } catch (createError) {
      await notifyError(extractErrorMessage(createError, 'No se pudo crear el cliente'))
    } finally {
      setIsCreatingCustomer(false)
    }
  }

  const handleCreateQuotation = async () => {
    setFeedback(null)
    setError(null)

    if (!customerId) {
      await notifyError('Selecciona un cliente para continuar.')
      return
    }

    if (!quotedBy.trim()) {
      await notifyError('No se detecto el usuario que cotiza.')
      return
    }

    if (cart.length === 0) {
      await notifyError('Agrega al menos un producto antes de guardar la cotizacion.')
      return
    }

    setIsSaving(true)

    try {
      const quotationId = await quotationsService.create({
        branch_id: normalizeBranchId(branchId),
        customer_id: customerId,
        expires_at: expiresAt,
        notes: null,
        metadata: {
          ui_module: 'quotations/create',
          quoted_by_name: quotedBy.trim(),
          role: activeRole,
        },
        items: cart.map((item) => ({
          part_id: item.part_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          metadata: {
            source: 'ui',
          },
        })),
      })

      setFeedback(`Cotizacion ${quotationId} registrada correctamente.`)
      setCart([])
    } catch (createError) {
      await notifyError(extractErrorMessage(createError, 'No se pudo registrar la cotizacion'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Cotizacion" description="Crea cotizaciones reales desde Supabase y asignalas a clientes" />
        <QuotationsSubnav />

        {error ? (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>
        ) : null}
        {feedback ? (
          <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{feedback}</div>
        ) : null}

        <Card>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>Cliente</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => setShowCustomerForm((previous) => !previous)}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  {showCustomerForm ? 'Ocultar' : 'Nuevo'}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Buscar cliente por nombre o NIT/CI"
                  value={customerSearchTerm}
                  onChange={(event) => setCustomerSearchTerm(event.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCustomerSearchTerm('')}
                  disabled={!customerSearchTerm.trim()}
                >
                  Limpiar
                </Button>
              </div>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCustomers.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-muted-foreground">No se encontraron clientes.</p>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.full_name} ({customer.nit_ci})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sucursal</Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cotizado por</Label>
              <div
                aria-readonly="true"
                className="h-10 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground"
              >
                {displayQuotedBy}
              </div>
              <p className="text-xs text-muted-foreground">Este campo se toma del usuario activo.</p>
            </div>

            <div className="space-y-2">
              <Label>Vigencia hasta</Label>
              <Input type="date" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
            </div>

            {showCustomerForm ? (
              <div className="md:col-span-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                <p className="text-sm font-semibold text-primary">Crear cliente rapido</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Nombre completo</Label>
                    <Input
                      placeholder="Nombre del cliente"
                      value={newCustomer.full_name}
                      onChange={(event) =>
                        setNewCustomer((previous) => ({ ...previous, full_name: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>NIT/CI</Label>
                    <Input
                      placeholder="NIT o CI"
                      value={newCustomer.nit_ci}
                      onChange={(event) =>
                        setNewCustomer((previous) => ({ ...previous, nit_ci: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefono (opcional)</Label>
                    <Input
                      placeholder="Telefono"
                      value={newCustomer.phone}
                      onChange={(event) =>
                        setNewCustomer((previous) => ({ ...previous, phone: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Correo (opcional)</Label>
                    <Input
                      placeholder="Correo electronico"
                      value={newCustomer.email}
                      onChange={(event) =>
                        setNewCustomer((previous) => ({ ...previous, email: event.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleCreateCustomer} disabled={isCreatingCustomer}>
                    {isCreatingCustomer ? 'Guardando...' : 'Guardar cliente'}
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <section className="xl:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Productos de Inventario</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative max-w-xl">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Buscar por nombre o código"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {isLoading ? (
                    <p className="text-sm text-muted-foreground">Cargando productos...</p>
                  ) : filteredProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay productos disponibles para cotizar.</p>
                  ) : filteredProducts.map((product) => (
                    <article key={product.id} className="rounded-2xl border border-border/70 bg-card/90 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <Badge className="bg-primary/15 text-primary">{product.code}</Badge>
                        <p className="text-sm font-bold text-primary">Bs {Number(product.price || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.category || 'Sin categoria'}</p>
                      </div>
                      <Button className="w-full" size="sm" onClick={() => addToCart(product.id)}>
                        <Plus className="mr-2 h-4 w-4" /> Agregar a cotización
                      </Button>
                    </article>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          <aside className="xl:col-span-1">
            <Card className="xl:sticky xl:top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ReceiptText className="h-5 w-5 text-primary" />
                  Carrito de cotización
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No hay productos agregados.</p>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div key={item.id} className="rounded-xl border border-border/70 p-3 bg-muted/20 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.code}</p>
                          </div>
                          <Button variant="ghost" size="icon-sm" onClick={() => removeItem(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(event) => updateQty(item.id, event.target.value)}
                          />

                          {canAdjustQuotationPrices(activeRole) ? (
                            <Input
                              type="number"
                              min={0.01}
                              step="0.01"
                              value={priceDraftByItemId[item.id] ?? item.unit_price.toString()}
                              onChange={(event) => updateUnitPrice(item.id, event.target.value)}
                              onBlur={() => void commitUnitPrice(item.id)}
                            />
                          ) : (
                            <div className="h-9 rounded-md border border-border/70 bg-muted/10 px-3 py-2 text-sm">
                              Bs {item.unit_price.toFixed(2)}
                            </div>
                          )}
                        </div>
                        {(() => {
                          const part = products.find((product) => product.id === item.part_id)
                          if (!part) return null
                          const basePrice = Number(part.price || 0)
                          const minQuotationPrice = part.quotation_min_price ?? Number((basePrice * 0.9).toFixed(2))
                          const maxQuotationPrice = part.quotation_max_price ?? Number((basePrice * 1.2).toFixed(2))
                          return (
                            <p className="text-[11px] text-muted-foreground">
                              Rango cotizacion: Bs {minQuotationPrice.toFixed(2)} - Bs {maxQuotationPrice.toFixed(2)}
                            </p>
                          )
                        })()}
                        <p className="text-sm font-semibold text-primary">
                          Bs {(item.quantity * item.unit_price).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {!canAdjustQuotationPrices(activeRole) ? (
                  <p className="text-xs text-muted-foreground">Tu rol actual no tiene permiso para ajustar precios en la cotizacion.</p>
                ) : null}

                <div className="border-t border-border pt-3">
                  <p className="text-sm text-muted-foreground">Total cotización</p>
                  <p className="text-2xl font-bold text-primary">Bs {total.toFixed(2)}</p>
                </div>

                <Button className="w-full" onClick={handleCreateQuotation} disabled={isSaving}>
                  {isSaving ? 'Guardando...' : 'Guardar cotizacion'}
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </MainLayout>
  )
}
