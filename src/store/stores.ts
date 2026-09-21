export * from '@/domain/store'

import { storeNames, type StoreId } from '@/domain/store'

/**
 * Store context id. Admins pick a single store (the client removed the
 * combined "All stores" selection, DEC-048); staff are always locked to
 * their assigned store. "all" stays in the type for legacy callers but is
 * unreachable from the UI.
 */
export type StoreContextId = StoreId | 'all'

export const ALL_STORES: StoreContextId = 'all'

/** The store an admin starts in when nothing else was selected (DEC-048). */
export const DEFAULT_ADMIN_STORE: StoreId = 'zeann'

export function isAllStores(context: StoreContextId): boolean {
  return context === 'all'
}

/** Narrows a store context to a concrete store, defaulting "all" to the default admin store. */
export function concreteStoreId(context: StoreContextId): StoreId {
  return context === 'all' ? DEFAULT_ADMIN_STORE : (context as StoreId)
}

/** Human label for a store context: "All stores", "Amara", or "Zeann". */
export function storeLabel(context: StoreContextId): string {
  return isAllStores(context) ? 'All stores' : storeNames[context as StoreId]
}
