import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { StoreContext } from './StoreContext'
import type { StoreId } from './stores'

interface StoreProviderProps {
  children: ReactNode
  initialStore?: StoreId
}

export function StoreProvider({ children, initialStore = 'amara' }: StoreProviderProps) {
  // PHASE-0 PLACEHOLDER: in-memory store context until Phase 2 wires real
  // store assignment/session. Replaced, not extended.
  const [store, setStore] = useState<StoreId>(initialStore)
  const value = useMemo(() => ({ store, setStore }), [store])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
