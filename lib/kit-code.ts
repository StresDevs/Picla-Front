export function buildNextKitCode(category: string, kits: ReadonlyArray<{ code: string }>) {
  const prefix = (category.trim() || 'General').toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'KIT'
  const codePrefix = `${prefix}-`
  const maxValue = kits.reduce((max, kit) => {
    if (!kit.code.startsWith(codePrefix)) return max
    const suffix = kit.code.slice(codePrefix.length)
    return /^\d+$/.test(suffix) ? Math.max(max, Number(suffix)) : max
  }, 0)
  return `${codePrefix}${String(maxValue + 1).padStart(3, '0')}`
}

export function getKitErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'message' in error &&
      typeof error.message === 'string' && error.message.trim()) {
    return error.message
  }
  return fallback
}
