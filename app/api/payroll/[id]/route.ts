import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { payrollService } from '@/lib/supabase/payroll'

type UpdatePaymentBody = {
  amount?: number
  due_date?: string
  notes?: string | null
}

function getBearerToken(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null

  const [type, token] = authHeader.split(' ')
  if (type?.toLowerCase() !== 'bearer' || !token) return null

  return token
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = getBearerToken(request)
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const supabaseServer = createSupabaseServerClient()
    const { data: userData, error: userError } = await supabaseServer.auth.getUser(token)

    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })
    }

    const body = (await request.json()) as UpdatePaymentBody

    if (body.amount !== undefined && body.amount <= 0) {
      return NextResponse.json({ error: 'El monto debe ser mayor a 0' }, { status: 400 })
    }

    const updates: UpdatePaymentBody = {}
    if (body.amount !== undefined) updates.amount = body.amount
    if (body.due_date !== undefined) updates.due_date = body.due_date
    if (body.notes !== undefined) updates.notes = body.notes

    const { id } = await params
    const payment = await payrollService.updatePayment(id, updates)

    return NextResponse.json(payment, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = getBearerToken(request)
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const supabaseServer = createSupabaseServerClient()
    const { data: userData, error: userError } = await supabaseServer.auth.getUser(token)

    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })
    }

    const { id } = await params
    await payrollService.deletePayment(id)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
