import { NextResponse } from 'next/server'
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server'
import { deletePaymentQr, detectQrMime, MAX_QR_BYTES, QR_MIME_TYPES, readPaymentQr, writePaymentQr } from '@/lib/server/payment-qr-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const noCache = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
async function authorizeAdmin(request: Request) {
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1]
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { data, error } = await createSupabaseServerClient().auth.getUser(token)
  if (error || !data.user) return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })
  const admin = createSupabaseAdminClient()
  const { data: user, error: userError } = await admin.from('users').select('role_id, is_active').eq('id', data.user.id).single()
  if (userError || !user || !user.is_active) return NextResponse.json({ error: 'Usuario no autorizado' }, { status: 403 })
  const { data: role, error: roleError } = await admin.from('roles').select('name').eq('id', user.role_id).single()
  if (roleError || role?.name !== 'admin') return NextResponse.json({ error: 'Solo un administrador puede cambiar el QR' }, { status: 403 })
  return null
}
export async function GET(request: Request) {
  try {
    const qr = await readPaymentQr()
    if (new URL(request.url).searchParams.get('image') === '1') {
      if (!qr) return new NextResponse(null, { status: 404, headers: noCache })
      return new NextResponse(new Uint8Array(qr.bytes), { headers: { ...noCache, 'Content-Type': qr.mime } })
    }
    return NextResponse.json({ url: qr?.url ?? null }, { headers: noCache })
  } catch (error) {
    console.error('No se pudo leer el QR de pago', error)
    return NextResponse.json({ error: 'No se pudo leer el QR de pago' }, { status: 500, headers: noCache })
  }
}
export async function POST(request: Request) {
  try {
    const denied = await authorizeAdmin(request)
    if (denied) return denied
    // Limitar el cuerpo real antes de interpretar el formulario multipart.
    const limit = MAX_QR_BYTES + 64 * 1024
    if (Number(request.headers.get('content-length')) > limit) return NextResponse.json({ error: 'La imagen debe pesar hasta 2 MB' }, { status: 413 })
    const reader = request.body?.getReader()
    if (!reader) return NextResponse.json({ error: 'Selecciona una imagen' }, { status: 400 })
    const chunks: Uint8Array[] = []
    let size = 0
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      size += value.length
      if (size > limit) {
        await reader.cancel()
        return NextResponse.json({ error: 'La imagen debe pesar hasta 2 MB' }, { status: 413 })
      }
      chunks.push(value)
    }
    let form: FormData
    try {
      form = await new Response(Buffer.concat(chunks), { headers: { 'Content-Type': request.headers.get('content-type') || '' } }).formData()
    } catch {
      return NextResponse.json({ error: 'Formulario de imagen inválido' }, { status: 400 })
    }
    const file = form.get('file')
    if (!(file instanceof File) || !file.size || file.size > MAX_QR_BYTES || !QR_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Selecciona una imagen PNG, JPG o WebP de hasta 2 MB' }, { status: 400 })
    }
    const bytes = Buffer.from(await file.arrayBuffer())
    if (detectQrMime(bytes) !== file.type) return NextResponse.json({ error: 'El archivo no es una imagen válida' }, { status: 400 })
    await writePaymentQr(bytes, file.type)
    const qr = await readPaymentQr()
    return NextResponse.json({ url: qr?.url ?? null }, { headers: noCache })
  } catch (error) {
    console.error('No se pudo guardar el QR de pago', error)
    return NextResponse.json({ error: 'No se pudo guardar el QR de pago' }, { status: 500 })
  }
}
export async function DELETE(request: Request) {
  try {
    const denied = await authorizeAdmin(request)
    if (denied) return denied
    await deletePaymentQr()
    return NextResponse.json({ url: null }, { headers: noCache })
  } catch (error) {
    console.error('No se pudo quitar el QR de pago', error)
    return NextResponse.json({ error: 'No se pudo quitar el QR de pago' }, { status: 500 })
  }
}
