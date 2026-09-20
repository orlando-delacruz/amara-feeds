import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Supabase client seam (DEC-035). Reads the publishable anon key from the
// environment; never a secret. When the URL/key are absent the app falls back
// to the mock data layer so development and the test suite run without a
// backend (the mock stays for unit tests; business paths use supabase).
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Never route through the real backend under Vitest: tests run against the
// mock data layer regardless of a local .env. `import.meta.env.MODE` is
// 'test' in vitest, 'development' in `vite dev`, 'production' in builds.
export const isSupabaseConfigured: boolean =
  Boolean(url && anonKey) && import.meta.env.MODE !== 'test'

function makeClient(): SupabaseClient | null {
  if (!url || !anonKey) {
    return null
  }
  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}

export const supabase: SupabaseClient | null = makeClient()

/** Email handle convention for username login: username@zafone.local (Assumed, DEC-034). */
export function usernameEmail(username: string): string {
  return `${username.trim().toLowerCase()}@zafone.local`
}
