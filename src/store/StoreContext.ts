import { createContext } from 'react'
import type { StoreContextId } from './stores'

export interface StoreContextValue {
  store: StoreContextId
  setStore: (store: StoreContextId) => void
  canSwitchStore: boolean
}

export const StoreContext = createContext<StoreContextValue | null>(null)
