import type { ProductId, ReceivingId, RiderId, UserId, VehicleId } from './ids'
import type { StoreId } from './store'
import type { Money } from '@/lib/money'

export interface ReceivingRecord {
  id: ReceivingId
  storeId: StoreId
  productId: ProductId
  quantity: number
  supplier: string
  costPriceMinor: Money
  /** required: rider who delivered the stock to the store */
  riderId: RiderId
  /** required: vehicle used for the stock delivery */
  vehicleId: VehicleId
  /** assumed: staff member who recorded the receipt; staff cannot modify another staff's records */
  recordedByUserId: UserId
  receivedAt: string
}

export interface NewReceivingInput {
  storeId: StoreId
  productId: ProductId
  quantity: number
  supplier: string
  costPriceMinor: Money
  /** required: rider who delivered the stock to the store */
  riderId: RiderId
  /** required: vehicle used for the stock delivery */
  vehicleId: VehicleId
  /** assumed: signed-in staff member recording the receipt */
  recordedByUserId: UserId
}
