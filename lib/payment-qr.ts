import { getSupabaseClient } from '@/lib/supabase/client'

export interface PaymentQrInfo { url: string | null }
export async function loadPaymentQr(): Promise<PaymentQrInfo> {
  const response = await fetch('/api/settings/payment-qr', { cache: 'no-store' })
  if (!response.ok) throw new Error('No se pudo cargar el QR de pago')
  return response.json()
}
export async function savePaymentQr(file: File | null): Promise<PaymentQrInfo> {
  const { data, error } = await getSupabaseClient().auth.getSession()
  if (error || !data.session) throw new Error('Vuelve a iniciar sesión')
  const body = new FormData()
  if (file) body.set('file', file)
  const response = await fetch('/api/settings/payment-qr', {
    method: file ? 'POST' : 'DELETE',
    headers: { Authorization: 'Bearer ' + data.session.access_token },
    body: file ? body : undefined,
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || 'No se pudo guardar el QR')
  return result
}
