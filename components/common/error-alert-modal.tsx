'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, X } from 'lucide-react'

export interface ErrorAlertDetails {
  title?: string
  message: string
  code?: string
  details?: string
  hint?: string
}

interface ErrorAlertModalProps {
  open: boolean
  onClose: () => void
  error: ErrorAlertDetails | null
}

export function ErrorAlertModal({ open, onClose, error }: ErrorAlertModalProps) {
  if (!error) return null

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="sm:max-w-lg border-red-500/50 bg-background p-0 overflow-hidden">
        {/* Header rojo */}
        <div className="bg-red-600/90 px-6 py-5 flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-white shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <DialogHeader>
              <DialogTitle className="text-white text-xl font-bold text-left">
                {error.title || 'Error al procesar la operación'}
              </DialogTitle>
              <DialogDescription className="text-red-100 text-sm text-left mt-1">
                Se produjo un error que impidió completar la acción solicitada.
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Mensaje principal */}
          <div className="rounded-xl border border-red-400/30 bg-red-500/8 px-4 py-3">
            <p className="text-sm font-semibold text-foreground mb-1">Descripción del error</p>
            <p className="text-sm text-foreground/90 leading-relaxed">{error.message}</p>
          </div>

          {/* Detalles técnicos */}
          {(error.code || error.details || error.hint) && (
            <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Detalles técnicos</p>
              {error.code && (
                <div className="flex items-start gap-2 text-xs">
                  <span className="text-muted-foreground shrink-0 w-14">Código</span>
                  <code className="text-foreground font-mono bg-muted px-1.5 py-0.5 rounded">{error.code}</code>
                </div>
              )}
              {error.details && (
                <div className="flex items-start gap-2 text-xs">
                  <span className="text-muted-foreground shrink-0 w-14">Detalle</span>
                  <span className="text-foreground">{error.details}</span>
                </div>
              )}
              {error.hint && (
                <div className="flex items-start gap-2 text-xs">
                  <span className="text-muted-foreground shrink-0 w-14">Sugerencia</span>
                  <span className="text-foreground">{error.hint}</span>
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Si el problema persiste, contacta al administrador del sistema con los detalles técnicos indicados arriba.
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-border/60 px-6 py-4 flex justify-end">
          <Button onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white px-6">
            <X className="h-4 w-4 mr-2" />
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Extrae un objeto ErrorAlertDetails desde un error desconocido.
 */
export function parseErrorDetails(error: unknown, fallbackMessage: string): ErrorAlertDetails {
  if (error && typeof error === 'object') {
    const candidate = error as {
      message?: unknown
      details?: unknown
      hint?: unknown
      code?: unknown
    }

    const message = typeof candidate.message === 'string' ? candidate.message.trim() : ''
    const details = typeof candidate.details === 'string' ? candidate.details.trim() : ''
    const hint = typeof candidate.hint === 'string' ? candidate.hint.trim() : ''
    const code = typeof candidate.code === 'string' ? candidate.code.trim() : ''

    return {
      message: message || fallbackMessage,
      code: code || undefined,
      details: details || undefined,
      hint: hint || undefined,
    }
  }

  if (typeof error === 'string' && error.trim()) {
    return { message: error.trim() }
  }

  return { message: fallbackMessage }
}
