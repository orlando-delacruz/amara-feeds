import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '@/domain'
import { SessionContext } from './SessionContext'

interface SessionProviderProps {
  children: ReactNode
  initialUser?: User | null
}

export function SessionProvider({ children, initialUser = null }: SessionProviderProps) {
  // Mock session only: in-memory, resets on reload. Real authentication is
  // Supabase Auth in a later phase; this is UI gating, never a security boundary.
  const [user, setUser] = useState<User | null>(initialUser)
  const value = useMemo(
    () => ({ user, signIn: (next: User) => setUser(next), signOut: () => setUser(null) }),
    [user],
  )
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
