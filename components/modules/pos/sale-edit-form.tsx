'use client'

import { useEffect, useState } from 'react'
import { posService, type POSSaleRecord, type POSCatalogItem } from '@/lib/supabase/pos'
import { saleTotalBob, validateMixedPayments, type POSPayment } from '@/lib/pos-payments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Banknote, Plus, QrCode } from 'lucide-react'

export function SaleEditForm({ sale, onSaved, onBusyChange }: { sale: POSSaleRecord; onSaved: () => void; onBusyChange?: (busy: boolean) => void }) {
  const [catalog, setCatalog] = useState<POSCatalogItem[]>([])
  const [items, setItems] = useState(() => sale.items.map(i => ({ id: i.id as string | null, key: i.id, part_id: i.part_id, quantity: Number(i.quantity), unit_price: Number(i.unit_price), source_type: i.source_type, source_kit_id: i.source_kit_id })))
  const [reason, setReason] = useState('')
  const [method, setMethod] = useState('cash')
  const [mixedPayment, setMixedPayment] = useState<{ method: 'cash' | 'qr'; amount: string }>({ method: 'cash', amount: '' })
  const [confirmed, setConfirmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [editId] = useState(() => crypto.randomUUID())
  useEffect(() => { let active = true; posService.getCatalog(sale.branch_id).then(data => { if (active) setCatalog(data) }).catch(() => { if (active) setError('No se pudo cargar el catálogo') }); return () => { active = false } }, [sale.branch_id])
  const total = saleTotalBob(items)
  const delta = Math.round((total - Number(sale.total_amount)) * 100) / 100
  const amount = Math.abs(delta)
  const remaining = Number.isFinite(Number(mixedPayment.amount))
    ? Math.max(0, Math.round((amount - Number(mixedPayment.amount)) * 100) / 100).toFixed(2)
    : ''
  const cashAmount = mixedPayment.method === 'cash' ? mixedPayment.amount : remaining
  const qrAmount = mixedPayment.method === 'qr' ? mixedPayment.amount : remaining
  const payments: POSPayment[] = delta === 0 ? [] : method === 'mixed' ? [{ method: 'cash', amount: Number(cashAmount) }, { method: 'qr', amount: Number(qrAmount) }] : [{ method: method as 'cash' | 'qr', amount }]
  const mixedError = method === 'mixed' && delta !== 0 ? validateMixedPayments(payments, amount) : null
  const enteredTotal = payments.reduce((sum, payment) => sum + (Number.isFinite(payment.amount) ? Math.round(payment.amount * 100) : 0), 0) / 100
  const balance = Math.round((amount - enteredTotal) * 100) / 100
  const valid = items.length > 0 && items.every(i => i.part_id && Number.isFinite(i.quantity) && i.quantity > 0 && Number.isFinite(i.unit_price) && i.unit_price >= 0) && payments.every(p => Number.isFinite(p.amount) && p.amount > 0) && !mixedError
  const save = async () => {
    if (busy || !valid || !reason.trim() || (delta !== 0 && !confirmed)) return
    setBusy(true); onBusyChange?.(true); setError('')
    try {
      await posService.editSale({ sale_id: sale.sale_id, edit_id: editId, expected_items: sale.items.map(i => ({ id: i.id, part_id: i.part_id, quantity: Number(i.quantity), unit_price: Number(i.unit_price) })), items: items.map(({ key, ...i }) => i), reason, payments, confirmed: delta === 0 || confirmed })
      onSaved()
    } catch (e) { setError(e instanceof Error ? e.message : (e as { message?: string })?.message || 'No se pudo modificar la venta') }
    finally { setBusy(false); onBusyChange?.(false) }
  }
  return <fieldset disabled={busy} className="space-y-3">
    <p className="text-sm text-muted-foreground">Reemplaza el producto en su selector, ajusta cantidad/precio o agrega y elimina líneas. Los precios respetan los permisos configurados del POS.</p>
    {items.map((item,index) => <div key={item.key} className="space-y-2 rounded border p-3">
      <select aria-label={`Producto ${index + 1}`} className="w-full rounded border bg-background p-2" value={item.part_id} onChange={e => { const p=catalog.find(p => p.part_id===e.target.value)!; setConfirmed(false); setItems(prev => prev.map(i => i.key===item.key ? { ...i, part_id:p.part_id, unit_price:Number(i.source_type==='kit_component' ? p.kit_price : p.price) } : i)) }}>
        {!catalog.some(p => p.part_id===item.part_id) && <option value={item.part_id}>{sale.items.find(i => i.id===item.id)?.part_name || 'Seleccionar producto'}</option>}
        {catalog.map(p => <option key={p.part_id} value={p.part_id}>{p.code} · {p.name}</option>)}
      </select>
      <div className="flex flex-wrap gap-2">
        <label className="flex-1">Cantidad<Input type="number" min="0.001" step="0.001" value={item.quantity} onChange={e => { setConfirmed(false); setItems(prev => prev.map(i => i.key===item.key ? { ...i,quantity:Number(e.target.value) } : i)) }} /></label>
        <label className="flex-1">Precio unitario (Bs)<Input type="number" min="0" step="0.01" value={item.unit_price} onChange={e => { setConfirmed(false); setItems(prev => prev.map(i => i.key===item.key ? { ...i,unit_price:Number(e.target.value) } : i)) }} /></label>
        <Button variant="outline" onClick={() => { setConfirmed(false); setItems(prev => prev.filter(i => i.key!==item.key)) }}>Eliminar</Button>
      </div>
    </div>)}
    <Button type="button" size="lg" className="h-11 w-full font-semibold sm:w-auto" disabled={!catalog.length} onClick={() => { const p=catalog[0]; setConfirmed(false); setItems(prev => [...prev,{ id:null,key:crypto.randomUUID(),part_id:p.part_id,quantity:1,unit_price:Number(p.price),source_type:'product',source_kit_id:null }]) }}><Plus className="h-4 w-4" />Agregar producto</Button>
    <p>Anterior: <strong>Bs {Number(sale.total_amount).toFixed(2)}</strong> · Nuevo: <strong>Bs {total.toFixed(2)}</strong></p>
    <p className="font-semibold">{delta>0 ? 'Cobrar' : delta<0 ? 'Devolver' : 'Sin diferencia'}: Bs {amount.toFixed(2)}</p>
    {delta!==0 && <div className="space-y-4 rounded-xl border border-border/70 bg-muted/10 p-4">
      <label className="block space-y-2 text-sm font-medium">
        <span>Método de {delta>0 ? 'cobro' : 'devolución'}</span>
        <select aria-label={delta > 0 ? 'Método de cobro' : 'Método de devolución'} className="h-11 w-full rounded-md border bg-background px-3" value={method} onChange={e => { setMethod(e.target.value); setConfirmed(false) }}><option value="cash">Efectivo</option><option value="qr">QR</option><option value="mixed">Efectivo y QR</option></select>
      </label>
      {method==='mixed' && <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Distribuye los Bs {amount.toFixed(2)} entre ambos métodos. Al editar un importe, el otro se completa con el saldo.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="min-w-0 space-y-3 rounded-lg border border-primary/25 bg-background/70 p-3">
            <span className="flex items-center gap-2 font-semibold"><Banknote className="h-4 w-4 text-primary" />Efectivo</span>
            <span className="block text-xs text-muted-foreground">Importe en efectivo (Bs)</span>
            <Input aria-label="Importe en efectivo" className="h-11 text-base font-semibold" type="number" inputMode="decimal" step="0.01" min="0.01" placeholder="0.00" value={cashAmount} onChange={e => { setMixedPayment({ method: 'cash', amount: e.target.value }); setConfirmed(false) }} />
          </label>
          <label className="min-w-0 space-y-3 rounded-lg border border-primary/25 bg-background/70 p-3">
            <span className="flex items-center gap-2 font-semibold"><QrCode className="h-4 w-4 text-primary" />QR / Transferencia</span>
            <span className="block text-xs text-muted-foreground">Importe por QR (Bs)</span>
            <Input aria-label="Importe por QR" className="h-11 text-base font-semibold" type="number" inputMode="decimal" step="0.01" min="0.01" placeholder="0.00" value={qrAmount} onChange={e => { setMixedPayment({ method: 'qr', amount: e.target.value }); setConfirmed(false) }} />
          </label>
        </div>
        <p role="status" aria-live="polite" className={`rounded-lg border px-3 py-2 text-sm font-semibold ${mixedError ? 'border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300' : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300'}`}>
          Total {delta > 0 ? 'a cobrar' : 'a devolver'}: Bs {enteredTotal.toFixed(2)} · {balance < 0 ? 'Excede' : 'Falta'}: Bs {Math.abs(balance).toFixed(2)}
        </p>
        {mixedError && <p className="text-xs text-muted-foreground">{mixedError}</p>}
      </div>}
      <label className="flex items-center gap-2"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />{delta>0 ? 'Confirmo que recibí el pago de la diferencia' : 'Confirmo que devolví el dinero de la diferencia'}</label>
    </div>}
    <label className="block">Motivo del cambio<Input value={reason} onChange={e => setReason(e.target.value)} /></label>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <Button disabled={busy || !valid || !reason.trim() || (delta!==0 && !confirmed)} onClick={() => void save()}>{busy ? 'Guardando...' : 'Guardar modificación'}</Button>
  </fieldset>
}
