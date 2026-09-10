import { createContext } from 'react'
import type { StoreId } from './stores'

export interface StoreContextValue {
  store: StoreId
  setStore: (store: StoreId) => void
}

export const StoreContext = createContext<StoreContextValue | null>(null)
