import { supabase } from './client'

/**
 * Configuracion global de la empresa. Vive en public.app_settings, no en el
 * navegador: el tipo de cambio y los datos de la empresa tienen que ser los
 * mismos en todas las maquinas.
 */
export interface AppSettings {
  company_name: string
  company_email: string
  company_phone: string
  default_currency: 'BOB' | 'USD'
  usd_to_bob_rate: number
  max_open_credits_per_customer: number
  credit_reminder_weekly_day: number
  credit_due_daily_threshold_days: number
}

/** Solo se usa mientras la primera lectura esta en vuelo o si la RPC falla. */
export const FALLBACK_APP_SETTINGS: AppSettings = {
  company_name: 'Mi Tienda de Repuestos',
  company_email: '',
  company_phone: '',
  default_currency: 'BOB',
  usd_to_bob_rate: 6.96,
  max_open_credits_per_customer: 2,
  credit_reminder_weekly_day: 1,
  credit_due_daily_threshold_days: 5,
}

let cached: AppSettings | null = null
let inflight: Promise<AppSettings> | null = null

function normalize(row: Record<string, unknown> | null): AppSettings {
  if (!row) return FALLBACK_APP_SETTINGS

  const currency = String(row.default_currency ?? 'BOB')

  return {
    company_name: String(row.company_name ?? FALLBACK_APP_SETTINGS.company_name),
    company_email: String(row.company_email ?? ''),
    company_phone: String(row.company_phone ?? ''),
    default_currency: currency === 'USD' ? 'USD' : 'BOB',
    usd_to_bob_rate:
      Number(row.usd_to_bob_rate) > 0
        ? Number(row.usd_to_bob_rate)
        : FALLBACK_APP_SETTINGS.usd_to_bob_rate,
    max_open_credits_per_customer:
      Number(row.max_open_credits_per_customer) ||
      FALLBACK_APP_SETTINGS.max_open_credits_per_customer,
    credit_reminder_weekly_day: Number(row.credit_reminder_weekly_day ?? 1),
    credit_due_daily_threshold_days: Number(row.credit_due_daily_threshold_days ?? 5),
  }
}

/**
 * Lee la configuracion desde la base de datos. El resultado se cachea en memoria
 * durante la sesion; `force` lo vuelve a pedir (tras guardar en /settings).
 */
export async function loadAppSettings(force = false): Promise<AppSettings> {
  if (!force && cached) return cached
  if (!force && inflight) return inflight

  inflight = (async () => {
    const { data, error } = await supabase.rpc('get_app_settings')
    if (error) throw error

    const row = Array.isArray(data) ? data[0] : data
    cached = normalize((row as Record<string, unknown> | null) ?? null)
    return cached
  })()

  try {
    return await inflight
  } finally {
    inflight = null
  }
}

/**
 * Valor ya cargado, para render sincrono. Devuelve el fallback si todavia no se
 * leyo; combinar con `loadAppSettings` en un efecto para refrescar.
 */
export function getCachedAppSettings(): AppSettings {
  return cached ?? FALLBACK_APP_SETTINGS
}

export function clearAppSettingsCache() {
  cached = null
  inflight = null
}
