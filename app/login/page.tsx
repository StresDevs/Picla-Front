'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { signInEmployee, getCurrentSession } from '@/lib/supabase/auth'
import { addDeviceSession, getUsers } from '@/lib/mock/runtime-store'
import { CarFront, KeyRound, Mail, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      const session = await getCurrentSession()
      if (session) {
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
    setIsLoading(true)

    try {
      const { error: signInError } = await signInEmployee({ email, password })

      if (signInError) {
        setError('Credenciales inválidas o usuario no permitido')
        setIsLoading(false)
        return
      }

      const users = getUsers()
      const matchedUser = users.find((item) => item.email.toLowerCase() === email.toLowerCase())

      const metadata = inferDeviceMetadata()
      addDeviceSession({
        user_email: email,
        user_name: matchedUser?.full_name || email,
        role: matchedUser?.role || 'employee',
        branch_id: matchedUser?.branch_id || 'branch-1',
        browser: metadata.browser,
        os: metadata.os,
        device_name: metadata.device_name,
        ip_address: 'Pendiente backend',
        status: 'active',
      })

      router.replace('/dashboard')
    } catch {
      setError('No se pudo iniciar sesión. Intenta nuevamente.')
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(1200px_circle_at_12%_-10%,hsl(var(--primary)/0.33),transparent_60%),radial-gradient(1000px_circle_at_110%_120%,hsl(162_92%_45%/0.18),transparent_60%),linear-gradient(180deg,hsl(222_47%_7%),hsl(224_57%_5%))] px-4 py-8">
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(hsl(var(--primary)/0.12)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary)/0.12)_1px,transparent_1px)] [background-size:34px_34px]" />

      <section className="relative z-10 w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950/75 shadow-[0_32px_90px_-30px_hsl(var(--primary)/0.5)] backdrop-blur-xl">
        <div className="grid md:grid-cols-2">
          <div className="relative p-7 sm:p-10 md:p-12">
            <div className="absolute -right-16 top-0 hidden h-full w-28 rotate-[20deg] bg-gradient-to-b from-primary/35 via-primary/20 to-emerald-400/25 blur-sm md:block" />

            <div className="mb-8 flex items-center gap-3 text-white">
            </div>
            <div className="mb-8 flex items-center gap-3 text-white">
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">Iniciar sesión</h2>
              <p className="mt-1 text-sm text-white/70">Accede con tu usuario.</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/90">Correo</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="empleado@picla.com"
                    autoComplete="email"
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
              </div>

              {error ? (
                <div className="rounded-xl border border-red-400/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {error}
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

          <div className="relative hidden md:flex min-h-[560px] items-center justify-center overflow-hidden bg-gradient-to-br from-primary/95 via-blue-600 to-emerald-400/80 p-10 text-white">
            <div className="absolute left-[-160px] top-[-120px] h-80 w-80 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute bottom-[-140px] right-[-120px] h-80 w-80 rounded-full bg-slate-950/30 blur-3xl" />

            <div className="relative max-w-sm text-center">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/40">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h3 className="text-4xl font-extrabold leading-tight tracking-tight">BIENVENIDO A PICLA</h3>
                <p className="mt-4 text-lg text-white/90">Credenciales temporales:</p>
                <p className="mt-1 text-sm text-white/70">Correo: admin@picla.com | Contraseña: Admin123</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
