import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { devicesService } from '@/lib/supabase/devices'

type RegisterBody = {
  user_id?: string | null
  user_email: string
  user_name: string
  role: string
  branch_id?: string | null
  device_name?: string | null
  browser?: string | null
  os?: string | null
}

function getBearerToken(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null

  const [type, token] = authHeader.split(' ')
  if (type?.toLowerCase() !== 'bearer' || !token) return null

  return token
}

function getClientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() || null

  return request.headers.get('x-real-ip')
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

    const body = (await request.json()) as RegisterBody

    if (!body.user_email || !body.user_name || !body.role) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 })
    }

    const session = await devicesService.registerSession({
      user_id: userData.user.id,
      user_email: body.user_email,
      user_name: body.user_name,
      role: body.role,
      branch_id: body.branch_id || null,
      device_name: body.device_name || null,
      browser: body.browser || null,
      os: body.os || null,
      ip_address: getClientIp(request),
    })

    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
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
    const sessions = await devicesService.listSessions({
      role: url.searchParams.get('role') || undefined,
      status: url.searchParams.get('status') || undefined,
      branch_id: url.searchParams.get('branch_id') || undefined,
      user_email: url.searchParams.get('user_email') || undefined,
    })

    return NextResponse.json(sessions, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
