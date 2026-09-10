import { createContext } from 'react'
import type { User } from '@/domain'

export interface SessionContextValue {
  user: User | null
  signIn: (user: User) => void
  signOut: () => void
}

export const SessionContext = createContext<SessionContextValue | null>(null)
