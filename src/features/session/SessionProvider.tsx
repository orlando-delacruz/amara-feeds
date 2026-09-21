import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '@/domain'
import { isSupabaseConfigured, supabase } from '@/services/supabaseClient'
import { SessionContext } from './SessionContext'
import { clearStoredSession, readStoredSession, writeStoredSession } from './sessionStorage'

interface SessionProviderProps {
  children: ReactNode
  // Omitted (default) restores the persisted session so a page reload keeps the
  // user signed in. Explicit null starts signed out (used by tests).
  initialUser?: User | null
}

interface ProfileRow {
  id: string
  username: string
  name: string
  role: User['role']
  store_id: 'amara' | 'zeann' | null
  active: boolean
}

function profileToUser(profile: ProfileRow): User {
  return {
    id: profile.id,
    name: profile.name,
    role: profile.role,
    storeId: profile.store_id ?? undefined,
    username: profile.username,
    active: profile.active,
  }
}

async function loadUserFromSession(): Promise<User | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null
  }
  try {
    const { data } = await supabase.auth.getSession()
    const sessionUser = data.session?.user
    if (!sessionUser) {
      return null
    }
    // maybeSingle(): a session whose profile row was deleted (e.g. wiped
    // staff account) must resolve to signed-out, not crash with PGRST116.
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, name, role, store_id, active')
      .eq('id', sessionUser.id)
      .maybeSingle()
    if (!profile || !profile.active) {
      // Stale session for a removed account — clear it server-side.
      await supabase.auth.signOut()
      return null
    }
    return profileToUser(profile)
  } catch (cause) {
    console.error('[session] restore failed:', cause)
    return null
  }
}

export function SessionProvider({ children, initialUser }: SessionProviderProps) {
  // Mock session persisted to localStorage keeps a reload signed in when no
  // Supabase backend is configured (tests, preview without env). With Supabase
  // configured, the real Auth session is authoritative and restores on reload.
  const [user, setUser] = useState<User | null>(() =>
    initialUser === undefined ? readStoredSession() : initialUser,
  )

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || initialUser !== undefined) {
      return
    }
    let active = true
    loadUserFromSession().then((restored) => {
      if (active && restored) {
        setUser(restored)
      }
    })
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) {
        return
      }
      if (!session?.user) {
        setUser(null)
      }
    })
    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [initialUser])

  const value = useMemo(
    () => ({
      user,
      signIn: (next: User) => {
        writeStoredSession(next)
        setUser(next)
      },
      signOut: () => {
        if (isSupabaseConfigured && supabase) {
          void supabase.auth.signOut()
        }
        clearStoredSession()
        setUser(null)
      },
    }),
    [user],
  )
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
