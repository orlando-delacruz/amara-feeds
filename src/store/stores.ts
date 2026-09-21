export * from '@/domain/store'

import { storeNames, type StoreId } from '@/domain/store'

/**
 * Store context id. Admins may pick "all" (both stores combined, the default)
 * or a single store; staff are always locked to their assigned store.
 */
export type StoreContextId = StoreId | 'all'

export const ALL_STORES: StoreContextId = 'all'

export function isAllStores(context: StoreContextId): boolean {
  return context === 'all'
}

/** Narrows a store context to a concrete store, defaulting "all" to Amara. */
export function concreteStoreId(context: StoreContextId): StoreId {
  return context === 'all' ? 'amara' : (context as StoreId)
}

/** Human label for a store context: "All stores", "Amara", or "Zeann". */
export function storeLabel(context: StoreContextId): string {
  return isAllStores(context) ? 'All stores' : storeNames[context as StoreId]
}
