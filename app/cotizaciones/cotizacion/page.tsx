'use client'

import { useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { QuotationsSubnav } from '@/components/modules/quotations/quotations-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Trash2, ReceiptText } from 'lucide-react'
import { createQuotation, getCustomers, getMaxActiveQuotationsPerUser, getProducts } from '@/lib/mock/runtime-store'
import { mockBranches } from '@/lib/mock/data'

interface QuoteCartItem {
  id: string
  part_id: string
  code: string
  name: string
  unit_price: number
  quantity: number
}

export default function QuotationPage() {
  const [products] = useState(() => getProducts())
  const [customers] = useState(() => getCustomers())
  const [searchTerm, setSearchTerm] = useState('')
  const [cart, setCart] = useState<QuoteCartItem[]>([])
  const [customerId, setCustomerId] = useState('')
  const [branchId, setBranchId] = useState(mockBranches[0]?.id || 'branch-1')
  const [quotedBy, setQuotedBy] = useState('Usuario Demo')
  const [expiresAt, setExpiresAt] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    return date.toISOString().slice(0, 10)
  })
  const [feedback, setFeedback] = useState<string | null>(null)

  const filteredProducts = useMemo(() => {
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.code.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [products, searchTerm])

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
          unit_price: part.price,
          quantity: 1,
        },
      ]
    })
  }

  const updateQty = (itemId: string, value: string) => {
    const qty = Math.max(1, Math.floor(Number(value || 1)))
    setCart((prev) => prev.map((item) => (item.id === itemId ? { ...item, quantity: qty } : item)))
  }

  const removeItem = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId))
  }

  const handleCreateQuotation = () => {
    setFeedback(null)

    if (!customerId) {
      setFeedback('Selecciona un cliente para continuar.')
      return
    }

    if (!quotedBy.trim()) {
      setFeedback('Ingresa el nombre del usuario que cotiza.')
      return
    }

    const result = createQuotation({
      customer_id: customerId,
      branch_id: branchId,
      quoted_by: quotedBy.trim(),
      expires_at: expiresAt,
      items: cart.map((item) => ({
        part_id: item.part_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
    })

    if (!result.ok) {
      setFeedback(result.error)
      return
    }

    setFeedback(`Cotización ${result.quotation.id} registrada correctamente.`)
    setCart([])
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Cotización" description="Crea cotizaciones con productos de inventario en modo mock" />
        <QuotationsSubnav />

        <Card>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-6">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.full_name}
                    </SelectItem>
                  ))}
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
                  {mockBranches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cotizado por</Label>
              <Input value={quotedBy} onChange={(event) => setQuotedBy(event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Vigencia hasta</Label>
              <Input type="date" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
            </div>

            <div className="md:col-span-3 rounded-xl border border-primary/25 bg-primary/5 px-3 py-2 text-xs text-primary">
              Regla mock: un usuario puede tener hasta {getMaxActiveQuotationsPerUser()} cotizaciones activas al mismo tiempo.
            </div>
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
                  {filteredProducts.map((product) => (
                    <article key={product.id} className="rounded-2xl border border-border/70 bg-card/90 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <Badge className="bg-primary/15 text-primary">{product.code}</Badge>
                        <p className="text-sm font-bold text-primary">Bs {product.price.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.category}</p>
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
                          <div className="h-9 rounded-md border border-border/70 bg-muted/10 px-3 py-2 text-sm">
                            Bs {item.unit_price.toFixed(2)}
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-primary">
                          Bs {(item.quantity * item.unit_price).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-border pt-3">
                  <p className="text-sm text-muted-foreground">Total cotización</p>
                  <p className="text-2xl font-bold text-primary">Bs {total.toFixed(2)}</p>
                </div>

                {feedback ? <p className="text-xs text-primary">{feedback}</p> : null}

                <Button className="w-full" onClick={handleCreateQuotation}>
                  Guardar cotización
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </MainLayout>
  )
}
