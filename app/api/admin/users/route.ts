import { randomBytes } from 'crypto'
import { NextResponse } from 'next/server'
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server'

type CreateUserBody = {
  email: string
  full_name: string
  phone?: string
  branch_id: string
  role?: 'admin' | 'manager' | 'employee' | 'read_only'
  send_reset_email?: boolean
}

const USERNAME_BASE_MAX = 24
const USERNAME_MAX_ATTEMPTS = 40

function normalizeUsernameBase(fullName: string) {
  const cleaned = fullName
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .replace(/\.+/g, '.')

  const base = cleaned || 'usuario'
  return base.slice(0, USERNAME_BASE_MAX)
}

async function resolveUniqueUsername(supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>, base: string) {
  let candidate = base

  for (let attempt = 0; attempt < USERNAME_MAX_ATTEMPTS; attempt += 1) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .ilike('username', candidate)
      .limit(1)

    if (error) {
      throw new Error(`No se pudo validar el usuario: ${error.message}`)
    }

    if (!data || data.length === 0) {
      return candidate
    }

    const suffix = String(attempt + 2)
    const trimmedBase = base.slice(0, Math.max(1, USERNAME_BASE_MAX - suffix.length))
    candidate = `${trimmedBase}${suffix}`
  }

  throw new Error('No se pudo generar un usuario unico. Intenta con otro nombre.')
}

function generateTempPassword() {
  return randomBytes(12).toString('base64url')
}

function getBearerToken(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null

  const [type, token] = authHeader.split(' ')
  if (type?.toLowerCase() !== 'bearer' || !token) return null

  return token
}

export async function POST(request: Request) {
  try {
    const token = getBearerToken(request)
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const supabaseServer = createSupabaseServerClient()
    const { data: requesterData, error: requesterError } = await supabaseServer.auth.getUser(token)

    if (requesterError || !requesterData.user) {
      return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })
    }

    const body = (await request.json()) as CreateUserBody
    const email = body.email?.trim().toLowerCase()
    const fullName = body.full_name?.trim()
    const phone = body.phone?.trim() || null
    const branchId = body.branch_id
    const roleName = body.role?.trim() || 'employee'
    const shouldSendResetEmail = body.send_reset_email !== false

    if (!email || !fullName || !branchId) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 })
    }

    const supabaseAdmin = createSupabaseAdminClient()

    const { data: me, error: meError } = await supabaseAdmin
      .from('users')
      .select('id, role_id')
      .eq('id', requesterData.user.id)
      .single()

    const { data: myRole, error: myRoleError } = await supabaseAdmin
      .from('roles')
      .select('name')
      .eq('id', me?.role_id || '')
      .single()

    if (meError || myRoleError || myRole?.name !== 'admin') {
      return NextResponse.json({ error: 'Solo admin puede crear usuarios' }, { status: 403 })
    }

    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', roleName)
      .single()

    if (roleError || !roleData) {
      return NextResponse.json({ error: 'Rol no encontrado' }, { status: 400 })
    }

    const { data: branchData, error: branchError } = await supabaseAdmin
      .from('branches')
      .select('id')
      .eq('id', branchId)
      .single()

    if (branchError || !branchData) {
      return NextResponse.json({ error: 'Sucursal no encontrada' }, { status: 400 })
    }

    const usernameBase = normalizeUsernameBase(fullName)
    const username = await resolveUniqueUsername(supabaseAdmin, usernameBase)
    const tempPassword = generateTempPassword()

    const { data: authUserData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        username,
        must_change_password: true,
      },
    })

    if (authCreateError || !authUserData.user) {
      return NextResponse.json(
        { error: authCreateError?.message || 'No se pudo crear el usuario auth' },
        { status: 400 }
      )
    }

    const userId = authUserData.user.id

    const { error: profileError } = await supabaseAdmin.from('users').insert([
      {
        id: userId,
        full_name: fullName,
        phone,
        email,
        username,
        role_id: roleData.id,
        branch_id: branchId,
        must_change_password: true,
      },
    ])

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: `No se pudo crear el perfil de usuario: ${profileError.message}` },
        { status: 400 }
      )
    }

    const { error: userRoleError } = await supabaseAdmin.from('user_roles').insert([
      {
        user_id: userId,
        role_id: roleData.id,
        assigned_by: requesterData.user.id,
      },
    ])

    if (userRoleError) {
      await supabaseAdmin.from('users').delete().eq('id', userId)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: `No se pudo crear relación user_roles: ${userRoleError.message}` },
        { status: 400 }
      )
    }

    let emailSent = false
    if (shouldSendResetEmail) {
      const origin = request.headers.get('origin')
      const redirectTo = origin ? `${origin}/change-password` : undefined

      const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo,
      })

      if (!resetError) {
        emailSent = true
      }
    }

    return NextResponse.json(
      {
        id: userId,
        email,
        full_name: fullName,
        username,
        temp_password: tempPassword,
        email_sent: emailSent,
        role: roleName,
        branch_id: branchId,
      },
      { status: 201 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
