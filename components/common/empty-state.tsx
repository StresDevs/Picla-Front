'use client'

import { type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title?: string
  description?: string
}

export function EmptyState({
  icon: Icon,
  title = 'Sin resultados',
  description = 'No hay datos para mostrar con los filtros actuales.',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      {Icon && (
        <div className="rounded-full bg-muted/40 p-4 mb-1">
          <Icon className="w-8 h-8 text-muted-foreground/60" />
        </div>
      )}
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground max-w-xs">{description}</p>
    </div>
  )
}
