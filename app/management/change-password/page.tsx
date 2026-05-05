'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/common/page-header'
import { getSupabaseClient } from '@/lib/supabase/client'
import { KeyRound, Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react'

export default function ChangePasswordPage() {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    // Validations
    if (!currentPassword.trim()) {
      setError('Ingresa tu contraseña actual.')
      return
    }

    if (newPassword.trim().length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setError('Las contraseñas nuevas no coinciden.')
      return
    }

    if (currentPassword.trim() === newPassword.trim()) {
      setError('La nueva contraseña debe ser diferente a la actual.')
      return
    }

    setIsSaving(true)
    const supabase = getSupabaseClient()

    try {
      // Step 1: Get the current user's email to re-authenticate
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError || !userData.user?.email) {
        setError('No se pudo obtener la sesión actual. Vuelve a iniciar sesión.')
        setIsSaving(false)
        return
      }

      // Step 2: Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.user.email,
        password: currentPassword.trim(),
      })

      if (signInError) {
        setError('La contraseña actual es incorrecta.')
        setIsSaving(false)
        return
      }

      // Step 3: Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword.trim(),
      })

      if (updateError) {
        setError(`No se pudo actualizar la contraseña: ${updateError.message}`)
        setIsSaving(false)
        return
      }

      setSuccess('Contraseña actualizada exitosamente.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch {
      setError('Ocurrió un error inesperado. Intenta nuevamente.')
    } finally {
      setIsSaving(false)
    }
  }

  // Password strength indicator
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { level: 0, label: '', color: '' }

    let score = 0
    if (pwd.length >= 8) score++
    if (pwd.length >= 12) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++

    if (score <= 1) return { level: 1, label: 'Débil', color: 'bg-red-500' }
    if (score <= 2) return { level: 2, label: 'Regular', color: 'bg-amber-500' }
    if (score <= 3) return { level: 3, label: 'Buena', color: 'bg-yellow-500' }
    if (score <= 4) return { level: 4, label: 'Fuerte', color: 'bg-emerald-500' }
    return { level: 5, label: 'Muy fuerte', color: 'bg-emerald-400' }
  }

  const strength = getPasswordStrength(newPassword)

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Cambiar Contraseña"
          description="Actualiza tu contraseña de acceso al sistema"
        />

        <div className="max-w-xl mx-auto">
          <Card className="border-border/60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
                  <KeyRound className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Nueva contraseña</CardTitle>
                  <CardDescription>
                    Ingresa tu contraseña actual para verificar tu identidad y define una nueva.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/5 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  {success}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Current Password */}
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="flex items-center gap-2 text-sm font-medium">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    Contraseña actual
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Ingresa tu contraseña actual"
                      autoComplete="current-password"
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-border/50" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-card px-3 text-xs text-muted-foreground">Nueva contraseña</span>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="flex items-center gap-2 text-sm font-medium">
                    <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                    Contraseña nueva
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      autoComplete="new-password"
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password Strength */}
                  {newPassword ? (
                    <div className="space-y-1.5">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                              level <= strength.level ? strength.color : 'bg-muted/50'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Seguridad: <span className="font-medium">{strength.label}</span>
                      </p>
                    </div>
                  ) : null}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-sm font-medium">
                    <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                    Confirmar nueva contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite la nueva contraseña"
                      autoComplete="new-password"
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword ? (
                    <p className="text-xs text-red-500">Las contraseñas no coinciden</p>
                  ) : null}
                  {confirmPassword && newPassword === confirmPassword && confirmPassword.length >= 8 ? (
                    <p className="text-xs text-emerald-500 flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      Las contraseñas coinciden
                    </p>
                  ) : null}
                </div>

                {/* Hints */}
                <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground/80">Requisitos de contraseña:</p>
                  <ul className="list-disc list-inside space-y-0.5 pl-1">
                    <li className={newPassword.length >= 8 ? 'text-emerald-500' : ''}>Mínimo 8 caracteres</li>
                    <li className={/[A-Z]/.test(newPassword) ? 'text-emerald-500' : ''}>Al menos una letra mayúscula</li>
                    <li className={/[0-9]/.test(newPassword) ? 'text-emerald-500' : ''}>Al menos un número</li>
                    <li className={/[^A-Za-z0-9]/.test(newPassword) ? 'text-emerald-500' : ''}>Al menos un carácter especial</li>
                  </ul>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isSaving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 8}
                  >
                    {isSaving ? 'Actualizando...' : 'Cambiar contraseña'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
