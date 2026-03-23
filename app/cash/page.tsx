'use client'

import { useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  Wallet,
  Clock3,
  Plus,
  CircleDollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react'

type MovementKind = 'sale' | 'income' | 'expense' | 'return'

type RegisterStatus = 'open' | 'closed'

interface RegisterState {
  id: string
  name: string
  status: RegisterStatus
  openedAt: string
  openingAmount: number
  branchName: string
}

interface Movement {
  id: string
  kind: MovementKind
  amount: number
  concept: string
  createdAt: string
  ticket?: string
  paymentMethod?: string
  products?: string[]
}

const currentUser = {
  id: 'usr-001',
  fullName: 'Luis Fernando Rojas',
  role: 'Cajero',
  branchName: 'Sucursal Centro',
}

const initialMovements: Movement[] = [
  {
    id: 'mov-001',
    kind: 'sale',
    amount: 382.5,
    concept: 'Venta procesada - Efectivo',
    createdAt: new Date().toISOString(),
    ticket: 'T-07677343',
    paymentMethod: 'Efectivo',
    products: ['Balatas Bosch 1x120 Bs.', 'Aceite Mobil 1 1x50 Bs.', 'Filtro de Aire K&N 1x112.50 Bs.'],
  },
]

const currency = (value: number) => `Bs ${value.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function CashPage() {
  const [register, setRegister] = useState<RegisterState>({
    id: 'reg-1',
    name: 'caja 1',
    status: 'open',
    openedAt: new Date().toISOString(),
    openingAmount: 1000,
    branchName: currentUser.branchName,
  })

  const [movements, setMovements] = useState<Movement[]>(initialMovements)
  const [movementModalOpen, setMovementModalOpen] = useState(false)

  const [movementDirection, setMovementDirection] = useState<'income' | 'expense'>('income')
  const [movementAmount, setMovementAmount] = useState('')
  const [movementConcept, setMovementConcept] = useState('')

  const totals = useMemo(() => {
    const sales = movements.filter((item) => item.kind === 'sale').reduce((sum, item) => sum + item.amount, 0)
    const incomes = movements.filter((item) => item.kind === 'income').reduce((sum, item) => sum + item.amount, 0)
    const expenses = movements.filter((item) => item.kind === 'expense' || item.kind === 'return').reduce((sum, item) => sum + item.amount, 0)

    const cashInBox = register.openingAmount + sales + incomes - expenses

    return {
      sales,
      incomes,
      expenses,
      cashInBox,
      totalMovements: movements.length,
    }
  }, [movements, register.openingAmount])

  const registerMovement = () => {
    const parsedAmount = Number(movementAmount)
    if (!parsedAmount || !movementConcept.trim()) return

    const newMovement: Movement = {
      id: `mov-${Date.now()}`,
      kind: movementDirection,
      amount: Math.abs(parsedAmount),
      concept: movementConcept,
      createdAt: new Date().toISOString(),
    }

    setMovements((prev) => [newMovement, ...prev])
    setMovementAmount('')
    setMovementConcept('')
    setMovementDirection('income')
    setMovementModalOpen(false)
  }

  const closeRegister = () => {
    setRegister((prev) => ({ ...prev, status: 'closed' }))
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Caja Registradora"
          description="Gestiona la apertura, cierre y movimientos de caja"
          action={
            <div className="flex items-center gap-2">
              <Dialog open={movementModalOpen} onOpenChange={setMovementModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Movimiento
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Registrar Movimiento</DialogTitle>
                    <DialogDescription>Agrega un ingreso o egreso manual a la caja</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={movementDirection === 'income' ? 'default' : 'outline'}
                        className={movementDirection === 'income' ? '' : 'border-zinc-700 bg-zinc-900 text-zinc-200'}
                        onClick={() => setMovementDirection('income')}
                      >
                        <ArrowUpCircle className="w-4 h-4 mr-2" />
                        Ingreso
                      </Button>
                      <Button
                        variant={movementDirection === 'expense' ? 'destructive' : 'outline'}
                        className={movementDirection === 'expense' ? '' : 'border-zinc-700 bg-zinc-900 text-zinc-200'}
                        onClick={() => setMovementDirection('expense')}
                      >
                        <ArrowDownCircle className="w-4 h-4 mr-2" />
                        Egreso
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Monto</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={movementAmount}
                        onChange={(event) => setMovementAmount(event.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Concepto</label>
                      <Input
                        placeholder="Describe el movimiento..."
                        value={movementConcept}
                        onChange={(event) => setMovementConcept(event.target.value)}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="destructive" onClick={() => setMovementModalOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={registerMovement}>Registrar</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="destructive" onClick={closeRegister} disabled={register.status === 'closed'}>
                Cerrar Caja
              </Button>
            </div>
          }
        />

        <Card className="border-emerald-500/55 bg-zinc-950/70">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-zinc-100">
                <Wallet className="w-5 h-5" />
                Estado de Caja
              </div>
              <Badge className={register.status === 'open' ? 'bg-emerald-600 text-white' : 'bg-zinc-600 text-white'}>
                {register.status === 'open' ? 'Abierta' : 'Cerrada'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-emerald-900/25 px-3 py-2 text-emerald-300">
                ${' '}
                <span className="font-semibold">Caja: {register.name}</span>
              </div>
              <div className="rounded-lg bg-zinc-900/50 px-3 py-2 text-zinc-300">
                <span className="font-semibold">Usuario:</span> {currentUser.fullName} ({currentUser.role}) - {register.branchName}
              </div>
            </div>

            <div className="text-zinc-400 text-sm flex items-center gap-2">
              <Clock3 className="w-4 h-4" />
              Abierta desde: {new Date(register.openedAt).toLocaleTimeString('es-BO')}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="rounded-xl bg-zinc-800/70 p-4 text-center">
                <p className="text-zinc-400 text-sm">Monto Inicial</p>
                <p className="text-zinc-100 text-3xl font-semibold mt-1">{currency(register.openingAmount)}</p>
              </div>
              <div className="rounded-xl bg-emerald-900/35 p-4 text-center">
                <p className="text-emerald-300 text-sm">Ingresos</p>
                <p className="text-emerald-400 text-3xl font-semibold mt-1">{currency(totals.sales + totals.incomes)}</p>
              </div>
              <div className="rounded-xl bg-rose-900/35 p-4 text-center">
                <p className="text-rose-300 text-sm">Egresos</p>
                <p className="text-rose-400 text-3xl font-semibold mt-1">{currency(totals.expenses)}</p>
              </div>
              <div className="rounded-xl bg-zinc-700/60 p-4 text-center">
                <p className="text-zinc-300 text-sm">Efectivo en Caja</p>
                <p className="text-zinc-100 text-3xl font-semibold mt-1">{currency(totals.cashInBox)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="bg-zinc-950/70">
            <CardContent className="pt-6">
              <p className="text-sm text-zinc-400">Ventas del Día</p>
              <p className="text-4xl font-semibold text-zinc-100 mt-6">{currency(totals.sales)}</p>
              <p className="text-xs text-zinc-400 mt-2">1 transacción</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-950/70">
            <CardContent className="pt-6">
              <p className="text-sm text-zinc-400">Ticket Promedio</p>
              <p className="text-4xl font-semibold text-zinc-100 mt-6">{currency(totals.sales || 0)}</p>
              <p className="text-xs text-zinc-400 mt-2">Por transacción</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-950/70">
            <CardContent className="pt-6">
              <p className="text-sm text-zinc-400">Total Movimientos</p>
              <p className="text-4xl font-semibold text-zinc-100 mt-6">{totals.totalMovements}</p>
              <p className="text-xs mt-2">
                <span className="text-emerald-400">+{movements.filter((m) => m.kind === 'sale' || m.kind === 'income').length}</span>
                <span className="text-zinc-500"> / </span>
                <span className="text-rose-400">-{movements.filter((m) => m.kind === 'expense' || m.kind === 'return').length}</span>
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-zinc-950/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-zinc-100">
              <Receipt className="w-5 h-5" />
              Movimientos del Día
            </CardTitle>
            <p className="text-sm text-zinc-400">{movements.length} movimientos registrados</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {movements.map((movement) => {
              const positive = movement.kind === 'sale' || movement.kind === 'income'
              return (
                <div key={movement.id} className="rounded-xl border border-zinc-800 bg-zinc-900/65 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-zinc-100">
                        {movement.kind === 'sale' ? `Venta ${movement.ticket ?? ''}` : movement.kind === 'income' ? 'Ingreso manual' : movement.kind === 'expense' ? 'Egreso manual' : 'Devolución'}
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">{new Date(movement.createdAt).toLocaleTimeString('es-BO')}</p>
                      <p className="text-sm text-zinc-300 mt-2">{movement.concept}</p>

                      {movement.products && movement.products.length > 0 && (
                        <div className="mt-3 rounded-lg bg-zinc-800/60 p-3">
                          <p className="text-xs text-zinc-400 mb-1">Productos vendidos</p>
                          {movement.products.map((item) => (
                            <p key={item} className="text-xs text-zinc-200">
                              - {item}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className={`text-xl font-semibold ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {positive ? '+' : '-'} {currency(Math.abs(movement.amount))}
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
