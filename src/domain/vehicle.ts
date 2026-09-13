import type { UserId, VehicleId } from './ids'
import type { StoreId } from './store'

/**
 * assumed: a vehicle type (e.g. Motorcycle, Tricycle, Van) managed per store
 * and selectable on the sale form. Rider/vehicle management is a
 * user-confirmed addition; exact fields remain Confirmation Required beyond
 * label, store, and active state.
 */
export interface Vehicle {
  id: VehicleId
  label: string
  storeId: StoreId
  active: boolean
  createdByUserId?: UserId
  createdAt: string
}

export interface NewVehicleInput {
  label: string
  storeId: StoreId
  createdByUserId?: UserId
}
