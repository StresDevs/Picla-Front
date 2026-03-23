import { supabase } from './client'

interface EmployeeSignInInput {
  email: string
  password: string
}

export async function signInEmployee({ email, password }: EmployeeSignInInput) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOutEmployee() {
  return supabase.auth.signOut()
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

export async function getCurrentAuthUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user
}

export async function onAuthStateChange(
  callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]
) {
  return supabase.auth.onAuthStateChange(callback)
}
