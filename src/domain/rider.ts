import type { RiderId, UserId } from './ids'
import type { StoreId } from './store'

/**
 * assumed: a delivery rider managed per store and selectable on the sale form.
 * Rider/vehicle management is a user-confirmed addition; exact fields remain
 * Confirmation Required beyond name, store, and active state.
 */
export interface Rider {
  id: RiderId
  name: string
  storeId: StoreId
  active: boolean
  createdByUserId?: UserId
  createdAt: string
}

export interface NewRiderInput {
  name: string
  storeId: StoreId
  createdByUserId?: UserId
}

/** Fields an existing rider may have changed. Omitted fields are left as-is. */
export interface UpdateRiderInput {
  name?: string
  active?: boolean
}
