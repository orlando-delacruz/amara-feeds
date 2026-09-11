import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '@/domain'
import { SessionContext } from './SessionContext'
import { clearStoredSession, readStoredSession, writeStoredSession } from './sessionStorage'

interface SessionProviderProps {
  children: ReactNode
  // Omitted (default) restores the persisted mock session so a page reload
  // keeps the user signed in. Explicit null starts signed out (used by tests).
  initialUser?: User | null
}

export function SessionProvider({ children, initialUser }: SessionProviderProps) {
  // Mock session only: persisted to localStorage so a reload keeps the user
  // signed in. Real authentication is Supabase Auth in a later phase; this is
  // UI gating, never a security boundary.
  const [user, setUser] = useState<User | null>(() =>
    initialUser === undefined ? readStoredSession() : initialUser,
  )
  const value = useMemo(
    () => ({
      user,
      signIn: (next: User) => {
        writeStoredSession(next)
        setUser(next)
      },
      signOut: () => {
        clearStoredSession()
        setUser(null)
      },
    }),
    [user],
  )
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
