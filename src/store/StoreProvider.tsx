import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useSession } from '@/features/session/useSession'
import { StoreContext } from './StoreContext'
import type { StoreId } from './stores'

interface StoreProviderProps {
  children: ReactNode
  initialStore?: StoreId
}

export function StoreProvider({ children, initialStore = 'amara' }: StoreProviderProps) {
  const { user } = useSession()
  const [selectedStore, setSelectedStore] = useState<StoreId>(initialStore)

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
