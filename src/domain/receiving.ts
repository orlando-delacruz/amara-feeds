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
  /**
   * legacy: rider who delivered the stock. No longer collected (explicit user
   * request overriding REQ-RCV-002/DEC-016); retained as optional so existing
   * records stay valid.
   */
  riderId?: RiderId
  /** legacy: vehicle used for the stock delivery; see riderId note. */
  vehicleId?: VehicleId
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
  /** legacy: optional rider reference; no longer collected on the form. */
  riderId?: RiderId
  /** legacy: optional vehicle reference; no longer collected on the form. */
  vehicleId?: VehicleId
  /** assumed: signed-in staff member recording the receipt */
  recordedByUserId: UserId
}
