import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useSession } from '@/features/session/useSession'
import { StoreContext } from './StoreContext'
import { type StoreContextId } from './stores'

interface StoreProviderProps {
  children: ReactNode
  initialStore?: StoreContextId
}

export function StoreProvider({ children, initialStore }: StoreProviderProps) {
  const { user } = useSession()
  // Admins default to "all stores" (combined view); staff are locked below.
  const [selectedStore, setSelectedStore] = useState<StoreContextId>(initialStore ?? 'all')

  // Staff operate within their assigned store; admins are business-wide and may
  // switch the store context for store-specific views.
  const store = user?.role === 'staff' && user.storeId ? user.storeId : selectedStore
  const canSwitchStore = user?.role === 'admin'

  const value = useMemo(
    () => ({ store, setStore: setSelectedStore, canSwitchStore }),
    [store, canSwitchStore],
  )
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
