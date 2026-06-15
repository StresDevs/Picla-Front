import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { iamService } from '@/lib/supabase/iam'

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

    const users = await iamService.getUsers()
    const simplified = users.map((user) => ({
      id: user.id,
      full_name: user.full_name,
      branch_id: user.branch_id,
      branch_name: user.branch?.name || null,
      role_name: user.role?.name || null,
    }))

    return NextResponse.json(simplified, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
