import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Las unidades de inventario siempre son enteras: no existen 99.22 productos.
 * Cualquier decimal que venga de datos viejos o de un calculo se redondea al
 * entero mas cercano antes de mostrarlo o de mandarlo al backend.
 */
export function toUnits(value: unknown): number {
  const parsed = Math.round(Number(value))
  return Number.isFinite(parsed) ? parsed : 0
}

/** Cantidad lista para mostrar en pantalla, siempre sin decimales. */
export function formatUnits(value: unknown): string {
  return String(toUnits(value))
}

/**
 * Limpia lo que se escribe en un campo de cantidad: solo digitos, sin punto ni
 * coma, para que no se pueda tipear "99.22" en un input de unidades.
 */
export function sanitizeUnitsInput(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '').replace(/^0+(?=\d)/, '')
  return digits
}
