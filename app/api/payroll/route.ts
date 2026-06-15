import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { payrollService } from '@/lib/supabase/payroll'

type CreatePaymentBody = {
  user_id?: string
  branch_id?: string | null
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

export async function GET(request: Request) {
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

    const url = new URL(request.url)
    const status = url.searchParams.get('status')

    const payments = await payrollService.listPayments({
      status: status === 'active' || status === 'inactive' ? status : undefined,
    })

    return NextResponse.json(payments, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
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

    const body = (await request.json()) as CreatePaymentBody

    if (!body.user_id || !body.amount || body.amount <= 0 || !body.due_date) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 })
    }

    const payment = await payrollService.createPayment({
      user_id: body.user_id,
      branch_id: body.branch_id || null,
      amount: body.amount,
      due_date: body.due_date,
      notes: body.notes || null,
      created_by: userData.user.email || null,
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
