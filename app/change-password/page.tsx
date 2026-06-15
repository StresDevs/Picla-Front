'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { getCurrentSession } from '@/lib/supabase/auth'
import { getSupabaseClient } from '@/lib/supabase/client'

export default function ChangePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await getCurrentSession()
        setHasSession(Boolean(session))
      } catch {
        setHasSession(false)
      }
    }

    void checkSession()
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFeedback(null)

    if (password.trim().length < 8) {
      setFeedback('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (password.trim() !== confirmPassword.trim()) {
      setFeedback('Las contraseñas no coinciden.')
      return
    }

    setIsSaving(true)
    const supabase = getSupabaseClient()

    const { error } = await supabase.auth.updateUser({
      password: password.trim(),
    })

    if (error) {
      setFeedback('No se pudo actualizar la contraseña.')
      setIsSaving(false)
      return
    }

    const { error: flagError } = await supabase.rpc('complete_first_login')
    if (flagError) {
      setFeedback('La contraseña fue actualizada, pero no se pudo actualizar el estado.')
      setIsSaving(false)
      return
    }

    setIsSaving(false)
    router.replace('/dashboard')
  }

  if (hasSession === false) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(1200px_circle_at_12%_-10%,hsl(var(--primary)/0.33),transparent_60%),radial-gradient(1000px_circle_at_110%_120%,hsl(0_0%_70%/0.12),transparent_60%),linear-gradient(180deg,hsl(222_47%_7%),hsl(224_57%_5%))] px-4 py-8">
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(hsl(var(--primary)/0.12)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary)/0.12)_1px,transparent_1px)] [background-size:34px_34px]" />
        <div className="relative z-10 w-full max-w-md space-y-4 rounded-3xl border border-white/10 bg-slate-950/75 p-7 text-center text-white shadow-[0_32px_90px_-30px_hsl(var(--primary)/0.5)] backdrop-blur-xl">
          <img src="/piclapictures/logo1.jpeg" alt="PICLA" className="mx-auto h-20 w-20 rounded-2xl object-cover ring-1 ring-white/10" />
          <h1 className="text-xl font-semibold">Actualizar contraseña</h1>
          <p className="text-sm text-white/70">
            Abre el enlace de recuperación desde tu correo o inicia sesión nuevamente.
          </p>
          <Button
            className="w-full font-semibold text-white shadow-[0_14px_30px_-14px_hsl(var(--primary)/0.9)] hover:brightness-110"
            onClick={() => router.replace('/login')}
          >
            Volver a iniciar sesión
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(1200px_circle_at_12%_-10%,hsl(var(--primary)/0.33),transparent_60%),radial-gradient(1000px_circle_at_110%_120%,hsl(0_0%_70%/0.12),transparent_60%),linear-gradient(180deg,hsl(222_47%_7%),hsl(224_57%_5%))] px-4 py-8">
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(hsl(var(--primary)/0.12)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary)/0.12)_1px,transparent_1px)] [background-size:34px_34px]" />

      <section className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-slate-950/75 p-7 shadow-[0_32px_90px_-30px_hsl(var(--primary)/0.5)] backdrop-blur-xl">
        <div className="mb-6 flex flex-col items-center text-center text-white">
          <img src="/piclapictures/logo1.jpeg" alt="PICLA" className="mb-4 h-20 w-20 rounded-2xl object-cover ring-1 ring-white/10" />
          <h2 className="text-2xl font-bold">Nueva contraseña</h2>
          <p className="mt-1 text-sm text-white/70">
            Define una contraseña nueva para continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white/90">Contraseña nueva</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              autoComplete="new-password"
              required
              className="h-11 border-white/20 bg-white/5 text-white placeholder:text-white/45"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm" className="text-white/90">Confirmar contraseña</Label>
            <Input
              id="confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="********"
              autoComplete="new-password"
              required
              className="h-11 border-white/20 bg-white/5 text-white placeholder:text-white/45"
            />
          </div>

          {feedback ? (
            <div className="rounded-xl border border-red-400/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {feedback}
            </div>
          ) : null}

          <Button
            type="submit"
            className="h-11 w-full font-semibold text-white shadow-[0_14px_30px_-14px_hsl(var(--primary)/0.9)] hover:brightness-110"
            disabled={isSaving}
          >
            {isSaving ? 'Actualizando...' : 'Actualizar contraseña'}
          </Button>
        </form>
      </section>
    </div>
  )
}
