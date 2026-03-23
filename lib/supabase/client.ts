import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function getRequiredEnv(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`Missing Supabase environment variable: ${name}`)
  }
  return value
}

let browserClient: SupabaseClient | null = null

export function getSupabaseClient() {
  if (!browserClient) {
    const supabaseUrl = getRequiredEnv(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL')
    const supabaseAnonKey = getRequiredEnv(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )

    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  }

  return browserClient
}

// Backward-compatible lazy proxy used by existing services.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient()
    return client[prop as keyof SupabaseClient]
  },
})
