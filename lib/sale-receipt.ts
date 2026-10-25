import type { POSSaleRecord, POSQueuedSale } from '@/lib/supabase/pos'
import type { PrintInvoiceParams } from '@/lib/mock/invoice'
import { paymentLabels, receiptPayments } from './pos-payments'

export const salePaymentLabels = paymentLabels

export function getSalePaymentMethod(sale: { metadata?: Record<string, unknown>; payment_method: string }) {
  return ['credit', 'mixed', 'adjusted'].includes(String(sale.metadata?.payment_type)) ? String(sale.metadata?.payment_type) : sale.payment_method
}

export function receiptFromQueuedSale(queue: POSQueuedSale, invoiceNumber: string, branchName: string): PrintInvoiceParams {
  return {
    invoiceNumber,
    customerName: queue.customer_name || 'Mostrador',
    branchName,
    cashierName: queue.created_by ? `Usuario ${queue.created_by}` : 'No registrado',
    paymentMethod: salePaymentLabels[getSalePaymentMethod(queue)],
    payments: receiptPayments(queue.metadata),
    currency: 'BOB',
    total: Number(queue.total_amount_bob),
    lines: queue.lines.map((line) => ({ name: line.part_name, quantity: Number(line.quantity), unitPrice: Number(line.unit_price) })),
  }
}

export function receiptFromSale(sale: POSSaleRecord, invoiceNumber: string, branchName: string): PrintInvoiceParams {
  const metadata = sale.metadata || {}
  const isCredit = getSalePaymentMethod(sale) === 'credit'
  const initialPayment = Number(metadata.credit_initial_payment ?? 0)
  return {
    invoiceNumber,
    createdAt: sale.created_at,
    customerName: sale.customer_name || 'Mostrador',
    customerDocument: typeof metadata.customer_nit_ci === 'string' ? metadata.customer_nit_ci : undefined,
    customerPhone: typeof metadata.customer_phone === 'string' ? metadata.customer_phone : undefined,
    branchName,
    cashierName: sale.sold_by_name || (sale.sold_by ? `Usuario ${sale.sold_by}` : 'No registrado'),
    paymentMethod: salePaymentLabels[getSalePaymentMethod(sale)] || sale.payment_method,
    payments: receiptPayments(sale.metadata),
    currency: 'BOB',
    total: Number(sale.total_amount),
    lines: sale.items.map((item) => ({ code: item.part_code, name: item.part_name, quantity: Number(item.quantity), unitPrice: Number(item.unit_price) })),
    isCredit,
    credit: isCredit ? {
      initialPayment,
      initialPaymentMethod: salePaymentLabels[String(metadata.credit_initial_payment_method || '')],
      balance: Number(sale.total_amount) - initialPayment,
      dueDays: Number(metadata.credit_due_days) || undefined,
      dueDate: typeof metadata.credit_due_date === 'string' ? metadata.credit_due_date : undefined,
      reminderDate: typeof metadata.credit_reminder_date === 'string' ? metadata.credit_reminder_date : undefined,
      sellerName: typeof metadata.credit_seller_name === 'string' ? metadata.credit_seller_name : undefined,
    } : undefined,
    notes: typeof metadata.credit_notes === 'string' ? metadata.credit_notes : undefined,
    pendingDeliveryItems: sale.items.filter((item) => Number(item.delivered_quantity) < Number(item.quantity)).map((item) => `${item.part_name} (${Number(item.quantity) - Number(item.delivered_quantity)} pendientes)`),
  }
}
