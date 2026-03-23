'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, DollarSign, QrCode, CreditCard, ShoppingCart, Search } from 'lucide-react'
import { getProducts, addSale, getCustomers, getAppSettings } from '@/lib/mock/runtime-store'
import { POSSubnav } from '@/components/modules/pos/pos-subnav'
import type { Part } from '@/types/database'

interface CartItem {
  partId: string
  name: string
  code: string
  price: number
  quantity: number
}

interface Customer {
  id: string
  full_name: string
  nit_ci: string
}

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Efectivo', icon: DollarSign },
  { id: 'qr', label: 'QR/Transferencia', icon: QrCode },
  { id: 'credit', label: 'Crédito', icon: CreditCard },
] as const

export default function POSSalesPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [parts, setParts] = useState<Part[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPayment, setSelectedPayment] = useState<'cash' | 'qr' | 'credit'>('cash')
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)
  const [paymentCurrency, setPaymentCurrency] = useState<'BOB' | 'USD'>('BOB')
  const [exchangeRate, setExchangeRate] = useState(6.96)

  useEffect(() => {
    setParts(getProducts())
    setCustomers(getCustomers())
    const settings = getAppSettings()
    setExchangeRate(settings.usd_to_bob_rate)
    setPaymentCurrency(settings.default_currency)
  }, [])

  const filteredParts = useMemo(() => {
    return parts.filter(
      (part) =>
        part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.code.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [parts, searchTerm])

  const addToCart = (part: Part) => {
    const existing = cart.find((item) => item.partId === part.id)
    if (existing) {
      setCart(cart.map((item) => (item.partId === part.id ? { ...item, quantity: item.quantity + 1 } : item)))
      return
    }

    setCart([...cart, { partId: part.id, name: part.name, code: part.code, price: part.price, quantity: 1 }])
  }

  const removeFromCart = (partId: string) => {
    setCart(cart.filter((item) => item.partId !== partId))
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const safeExchangeRate = exchangeRate > 0 ? exchangeRate : 1
  const totalInBob = total
  const totalInUsd = totalInBob / safeExchangeRate
  const amountToCharge = paymentCurrency === 'USD' ? totalInUsd : totalInBob

  const formatCurrency = (value: number, currency: 'BOB' | 'USD') => {
    return currency === 'USD'
      ? `$${value.toFixed(2)}`
      : `Bs ${value.toFixed(2)}`
  }

  const handleCompleteSale = () => {
    if (!cart.length) return

    addSale({
      id: `sale-${Date.now()}`,
      branch_id: 'branch-1',
      user_name: 'Usuario Demo',
      total_amount: totalInBob,
      payment_method: selectedPayment,
      sale_currency: paymentCurrency,
      exchange_rate: safeExchangeRate,
      total_amount_bob: totalInBob,
      total_amount_usd: totalInUsd,
      paid_amount: amountToCharge,
      created_at: new Date().toISOString(),
    })

    setCart([])
    setSelectedCustomer(null)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Punto de Venta" description="Ventas rápidas con registro mock persistente" />
        <POSSubnav />

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <section className="xl:col-span-3 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Catálogo POS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative max-w-xl">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input className="pl-9" placeholder="Buscar por nombre o código" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-5 gap-4">
                  {filteredParts.map((part) => (
                    <article key={part.id} className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/90 hover:border-primary/60 transition-all duration-300 hover:-translate-y-1">
                      <div className="relative aspect-[3/4] overflow-hidden">
                        <img src={part.image_url || '/placeholder.svg'} alt={part.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" onError={(e) => { e.currentTarget.src = '/placeholder.svg' }} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-primary/90 text-primary-foreground">{part.code}</Badge>
                        </div>
                        <div className="absolute bottom-3 left-3 right-3">
                          <p className="text-white text-sm font-semibold line-clamp-2">{part.name}</p>
                          <p className="text-white/80 text-xs">{part.category}</p>
                        </div>
                      </div>
                      <div className="p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">Costo Bs {part.cost.toFixed(2)}</p>
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary">Bs {part.price.toFixed(2)}</p>
                            <p className="text-[11px] text-muted-foreground">${(part.price / safeExchangeRate).toFixed(2)} USD</p>
                          </div>
                        </div>
                        <Button className="w-full" size="sm" onClick={() => addToCart(part)}>
                          <Plus className="w-4 h-4 mr-2" /> Agregar
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          <aside className="xl:col-span-1">
            <Card className="xl:sticky xl:top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-primary" />Carrito</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Carrito vacío</p>
                ) : (
                  <>
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {cart.map((item) => (
                        <div key={item.partId} className="rounded-xl border border-border/70 p-3 bg-muted/20">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.code}</p>
                              <p className="text-xs text-muted-foreground mt-1">Bs {item.price.toFixed(2)} x {item.quantity}</p>
                            </div>
                            <Button variant="ghost" size="icon-sm" onClick={() => removeFromCart(item.partId)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-sm font-bold text-primary mt-2">Bs {(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-border pt-3">
                      <p className="text-sm text-muted-foreground">Total base (BOB)</p>
                      <p className="text-2xl font-bold text-primary">Bs {totalInBob.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground mt-1">Equivalente USD: ${totalInUsd.toFixed(2)} (TC: {safeExchangeRate.toFixed(2)})</p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Moneda de pago</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={paymentCurrency === 'BOB' ? 'default' : 'outline'}
                          onClick={() => setPaymentCurrency('BOB')}
                        >
                          Bolivianos
                        </Button>
                        <Button
                          variant={paymentCurrency === 'USD' ? 'default' : 'outline'}
                          onClick={() => setPaymentCurrency('USD')}
                        >
                          Dólares
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Monto a cobrar: <span className="font-semibold text-foreground">{formatCurrency(amountToCharge, paymentCurrency)}</span>
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Método de pago</p>
                      {PAYMENT_METHODS.map((method) => (
                        <Button key={method.id} variant={selectedPayment === method.id ? 'default' : 'outline'} className="w-full justify-start" onClick={() => setSelectedPayment(method.id)}>
                          <method.icon className="w-4 h-4 mr-2" /> {method.label}
                        </Button>
                      ))}
                    </div>

                    {selectedPayment === 'credit' && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full">{selectedCustomer ? 'Cambiar cliente' : 'Seleccionar cliente'}</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Clientes para crédito</DialogTitle></DialogHeader>
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {customers.map((customer) => (
                              <Button key={customer.id} variant="outline" className="w-full justify-start text-left" onClick={() => setSelectedCustomer(customer.id)}>
                                <div>
                                  <p className="font-semibold">{customer.full_name}</p>
                                  <p className="text-xs text-muted-foreground">{customer.nit_ci}</p>
                                </div>
                              </Button>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}

                    <Button className="w-full" size="lg" onClick={handleCompleteSale} disabled={selectedPayment === 'credit' && !selectedCustomer}>Completar venta</Button>
                  </>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </MainLayout>
  )
}
