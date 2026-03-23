import 'server-only'

import { createClient } from '@supabase/supabase-js'

function getRequiredEnv(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`Missing Supabase environment variable: ${name}`)
  }
  return value
}

const supabaseUrl = getRequiredEnv(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL')
const supabaseAnonKey = getRequiredEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY')
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export function createSupabaseServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export function createSupabaseAdminClient() {
  const serviceRoleKey = getRequiredEnv(supabaseServiceRoleKey, 'SUPABASE_SERVICE_ROLE_KEY')

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
