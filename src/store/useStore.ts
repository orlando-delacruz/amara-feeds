import { useContext } from 'react'
import { StoreContext } from './StoreContext'
import type { StoreContextValue } from './StoreContext'

export function useStore(): StoreContextValue {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}
