import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/server'

type ResolveBody = {
  identifier?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ResolveBody
    const rawIdentifier = body.identifier?.trim()

    if (!rawIdentifier) {
      return NextResponse.json({ error: 'Identificador requerido' }, { status: 400 })
    }

    const supabaseAdmin = createSupabaseAdminClient()
    const isEmail = rawIdentifier.includes('@')
    const normalized = rawIdentifier.toLowerCase()

    const lookupBy = async (field: 'email' | 'username') => {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('email, is_active')
        .limit(1)
        .maybeSingle()
        .ilike(field, normalized)

      if (error) {
        throw new Error(error.message)
      }

      return data
    }

    let data = null as { email: string | null; is_active: boolean | null } | null

    if (isEmail) {
      data = await lookupBy('email')
      if (!data) {
        data = await lookupBy('username')
      }
    } else {
      data = await lookupBy('username')
      if (!data) {
        data = await lookupBy('email')
      }
    }

    if (!data?.email || data.is_active === false) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ email: data.email }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
