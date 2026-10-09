/** Resuelve el borrador únicamente al terminar la edición; el total usa el último precio válido. */
export function resolvePOSPriceDraft(draft: string, previous: number, min: number, max: number) {
  const value = Number(draft.trim())
  if (!draft.trim() || !Number.isFinite(value)) {
    return { price: previous, reason: 'invalid' as const }
  }
  const rounded = Number(value.toFixed(2))
  if (rounded < min) return { price: min, reason: 'min' as const }
  if (rounded > max) return { price: max, reason: 'max' as const }
  return { price: rounded, reason: null }
}
