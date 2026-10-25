export type POSPaymentMethod = 'cash' | 'qr'
export interface POSPayment { method: POSPaymentMethod; amount: number }

export const paymentLabels: Record<string, string> = {
  cash: 'Efectivo', card: 'Tarjeta', qr: 'QR/Transferencia', credit: 'Crédito', mixed: 'Pago mixto', adjusted: 'Venta modificada',
}

export function saleTotalBob(items: Array<{ quantity: number; unit_price: number }>) {
  return items.reduce((cents, item) => cents + Math.round(item.quantity * item.unit_price * 100), 0) / 100
}

export function validateMixedPayments(payments: POSPayment[], total: number): string | null {
  if (payments.length !== 2 || payments.some((p) => !['cash', 'qr'].includes(p.method))) return 'Selecciona dos métodos de pago válidos.'
  if (payments[0].method === payments[1].method) return 'Selecciona métodos de pago diferentes.'
  if (payments.some((p) => !Number.isFinite(p.amount) || p.amount <= 0 || Math.abs(p.amount * 100 - Math.round(p.amount * 100)) > 0.000001)) return 'Cada pago debe ser mayor a cero y tener como máximo dos decimales.'
  if (!Number.isFinite(total) || payments.reduce((sum, p) => sum + Math.round(p.amount * 100), 0) !== Math.round(total * 100)) return 'Los dos pagos deben sumar exactamente el total de la venta.'
  return null
}

export function readSalePayments(metadata?: Record<string, unknown>): POSPayment[] {
  if (!['mixed', 'adjusted'].includes(String(metadata?.payment_type)) || !Array.isArray(metadata?.payments)) return []
  return metadata!.payments.filter((p): p is POSPayment => !!p && ['cash', 'card', 'qr'].includes(p.method) && Number.isFinite(p.amount) && (metadata?.payment_type === 'adjusted' ? p.amount !== 0 : p.amount > 0))
}

export function receiptPayments(metadata?: Record<string, unknown>) {
  return readSalePayments(metadata).map((p) => ({ method: paymentLabels[p.method], amount: p.amount }))
}
