import { useContext } from 'react'
import { SessionContext } from './SessionContext'
import type { SessionContextValue } from './SessionContext'

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}
