'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { signInEmployee, getCurrentSession, sendPasswordResetEmail } from '@/lib/supabase/auth'
import { setActiveUserContext, type AppUserRole } from '@/lib/mock/runtime-store'
import { getSupabaseClient } from '@/lib/supabase/client'
import { KeyRound, Mail } from 'lucide-react'

type CurrentUserProfile = {
  role_name?: string | null
  full_name?: string | null
  branch_id?: string | null
  username?: string | null
  must_change_password?: boolean | null
}

export default function LoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetFeedback, setResetFeedback] = useState<string | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      const session = await getCurrentSession()
      if (session) {
        const supabase = getSupabaseClient()
        const { data: profile } = await supabase
          .rpc('get_current_user_profile')
          .single()

        const typedProfile = profile as CurrentUserProfile | null

        if (typedProfile?.must_change_password) {
          router.replace('/change-password')
          return
        }

        router.replace('/dashboard')
      }
    }

    void checkSession()
  }, [router])

  const inferDeviceMetadata = () => {
    const userAgent = navigator.userAgent || ''
    const browser = userAgent.includes('Edg')
      ? 'Edge'
      : userAgent.includes('Chrome')
      ? 'Chrome'
      : userAgent.includes('Firefox')
      ? 'Firefox'
      : userAgent.includes('Safari')
      ? 'Safari'
      : 'Desconocido'

    const os = userAgent.includes('Windows')
      ? 'Windows'
      : userAgent.includes('Android')
      ? 'Android'
      : userAgent.includes('iPhone') || userAgent.includes('iPad')
      ? 'iOS'
      : userAgent.includes('Mac')
      ? 'macOS'
      : userAgent.includes('Linux')
      ? 'Linux'
      : 'Desconocido'

    return {
      browser,
      os,
      device_name: `${browser} en ${os}`,
    }
  }

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setResetFeedback(null)
    setIsLoading(true)

    const normalizeRole = (value: string | null | undefined): AppUserRole => {
      if (value === 'admin' || value === 'manager' || value === 'employee' || value === 'read_only') {
        return value
      }
      return 'employee'
    }

    try {
      const resolvedEmail = await resolveAuthEmail(identifier)

      if (!resolvedEmail) {
        setError('Credenciales inválidas o usuario no permitido')
        setIsLoading(false)
        return
      }

      const { data: signInData, error: signInError } = await signInEmployee({
        email: resolvedEmail,
        password,
      })

      if (signInError) {
        setError('Credenciales inválidas o usuario no permitido')
        setIsLoading(false)
        return
      }

      const authUser = signInData.user
      const supabase = getSupabaseClient()

      const { data: profile } = await supabase
        .rpc('get_current_user_profile')
        .single()

      const typedProfile = profile as CurrentUserProfile | null

      if (typedProfile?.must_change_password) {
        setIsLoading(false)
        router.replace('/change-password')
        return
      }

      const resolvedRole = normalizeRole(typedProfile?.role_name)
      const resolvedUserName =
        typedProfile?.full_name ||
        (authUser?.user_metadata as { full_name?: string } | undefined)?.full_name ||
        'Usuario'
      const resolvedBranchId = typedProfile?.branch_id || 'branch-1'

      setActiveUserContext({
        role: resolvedRole,
        user_name: resolvedUserName,
        branch_id: resolvedBranchId,
      })

      const metadata = inferDeviceMetadata()
      const accessToken = signInData.session?.access_token

      if (accessToken) {
        try {
          const response = await fetch('/api/devices/sessions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              user_email: resolvedEmail,
              user_name: resolvedUserName,
              role: resolvedRole,
              branch_id: typedProfile?.branch_id || null,
              browser: metadata.browser,
              os: metadata.os,
              device_name: metadata.device_name,
            }),
          })

          if (response.ok) {
            const session = await response.json()
            window.sessionStorage.setItem('device_session_id', session.id)
          }
        } catch {
          // El registro de la sesión de dispositivo no debe bloquear el inicio de sesión
        }
      }

      router.replace('/dashboard')
    } catch {
      setError('No se pudo iniciar sesión. Intenta nuevamente.')
      setIsLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    setError(null)
    setResetFeedback(null)

    const normalizedIdentifier = identifier.trim()
    if (!normalizedIdentifier) {
      setResetFeedback('Ingresa tu usuario o correo para recuperar la contraseña.')
      return
    }

    setIsResetting(true)
    const resolvedEmail = await resolveAuthEmail(normalizedIdentifier)

    if (!resolvedEmail) {
      setResetFeedback('Si el usuario existe, enviaremos un correo de recuperacion.')
      setIsResetting(false)
      return
    }

    const redirectTo = `${window.location.origin}/change-password`
    const { error: resetError } = await sendPasswordResetEmail(resolvedEmail, redirectTo)

    if (resetError) {
      setResetFeedback('No se pudo enviar el correo de recuperacion.')
      setIsResetting(false)
      return
    }

    setResetFeedback('Te enviamos un correo con el enlace para restablecer tu contraseña.')
    setIsResetting(false)
  }

  const resolveAuthEmail = async (value: string) => {
    const normalized = value.trim()
    if (!normalized) return null

    const response = await fetch('/api/auth/resolve-username', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: normalized }),
    })

    if (!response.ok) {
      return null
    }

    const payload = await response.json().catch(() => ({}))
    if (!payload?.email || typeof payload.email !== 'string') {
      return null
    }

    return payload.email
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(1200px_circle_at_12%_-10%,hsl(var(--primary)/0.33),transparent_60%),radial-gradient(1000px_circle_at_110%_120%,hsl(0_0%_70%/0.12),transparent_60%),linear-gradient(180deg,hsl(222_47%_7%),hsl(224_57%_5%))] px-4 py-8">
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(hsl(var(--primary)/0.12)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary)/0.12)_1px,transparent_1px)] [background-size:34px_34px]" />

      <section className="relative z-10 w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950/75 shadow-[0_32px_90px_-30px_hsl(var(--primary)/0.5)] backdrop-blur-xl">
        <div className="grid md:grid-cols-2">
          <div className="relative p-7 sm:p-10 md:p-12">
            <div className="absolute -right-16 top-0 hidden h-full w-28 rotate-[20deg] bg-gradient-to-b from-primary/35 via-primary/20 to-white/10 blur-sm md:block" />

            <div className="mb-6 flex items-center justify-center md:hidden">
              <img src="/piclapictures/logo1.jpeg" alt="PICLA" className="h-20 w-20 rounded-2xl object-cover ring-1 ring-white/10" />
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">Iniciar sesión</h2>
              <p className="mt-1 text-sm text-white/70">Accede con tu usuario.</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-white/90">Usuario o correo</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
                  <Input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="juan.perez o usuario@dominio.com"
                    autoComplete="username"
                    required
                    className="h-11 border-white/20 bg-white/5 pl-10 text-white placeholder:text-white/45"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/90">Contraseña</Label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                    autoComplete="current-password"
                    required
                    className="h-11 border-white/20 bg-white/5 pl-10 text-white placeholder:text-white/45"
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto px-0 text-xs text-white/70 hover:text-white"
                    onClick={handlePasswordReset}
                    disabled={isResetting}
                  >
                    {isResetting ? 'Enviando correo...' : '¿Olvidaste tu contraseña?'}
                  </Button>
                </div>
              </div>

              {error ? (
                <div className="rounded-xl border border-red-400/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              {resetFeedback ? (
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
                  {resetFeedback}
                </div>
              ) : null}

              <Button
                type="submit"
                className="h-11 w-full font-semibold text-white shadow-[0_14px_30px_-14px_hsl(var(--primary)/0.9)] hover:brightness-110"
                disabled={isLoading}
              >
                {isLoading ? 'Iniciando Sesión...' : 'Iniciar sesión'}
              </Button>
            </form>
          </div>

          <div className="relative hidden md:flex min-h-[560px] flex-col items-center justify-center overflow-hidden bg-black p-10 text-white">
            <div className="absolute left-[-160px] top-[-120px] h-80 w-80 rounded-full bg-primary/30 blur-3xl" />
            <div className="absolute bottom-[-140px] right-[-120px] h-80 w-80 rounded-full bg-slate-700/30 blur-3xl" />

            <div className="relative flex flex-col items-center text-center">
              <img src="/piclapictures/logo1.jpeg" alt="PICLA" className="mb-8 w-64 rounded-2xl object-contain shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]" />

              <div className="w-full max-w-sm space-y-4 text-left">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-1 rounded-full bg-primary" />
                  <div>
                    <p className="text-base font-medium text-white">Sistemas Hidráulicos</p>
                    <p className="text-sm text-white/60">Importación de cilindros y repuestos</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-1 rounded-full bg-primary" />
                  <div>
                    <p className="text-base font-medium text-white">Sistemas de Suspensión</p>
                    <p className="text-sm text-white/60">Repuestos para camiones y maquinaria pesada</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-1 rounded-full bg-primary" />
                  <div>
                    <p className="text-base font-medium text-white">Control integral</p>
                    <p className="text-sm text-white/60">Inventario, ventas y traspasos entre sucursales</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
