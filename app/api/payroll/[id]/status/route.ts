import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { payrollService } from '@/lib/supabase/payroll'

type SetStatusBody = {
  status?: 'active' | 'inactive'
}

function getBearerToken(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null

  const [type, token] = authHeader.split(' ')
  if (type?.toLowerCase() !== 'bearer' || !token) return null

  return token
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const body = (await request.json()) as SetStatusBody

    if (body.status !== 'active' && body.status !== 'inactive') {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
    }

    const { id } = await params
    const payment = await payrollService.setScheduleStatus(id, body.status)

    return NextResponse.json(payment, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
