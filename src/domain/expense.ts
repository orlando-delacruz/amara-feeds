import type { ExpenseId, RiderId, UserId, VehicleId } from './ids'
import type { StoreId } from './store'
import type { Money } from '@/lib/money'

/** assumed: common expense types; exact values are Confirmation Required */
export type ExpenseType = 'fuel' | 'repair'

export interface Expense {
  id: ExpenseId
  storeId: StoreId
  /** assumed: at least one of riderId or vehicleId is required */
  riderId?: RiderId
  vehicleId?: VehicleId
  type: ExpenseType
  amountMinor: Money
  note?: string
  recordedByUserId: UserId
  createdAt: string
}

export interface NewExpenseInput {
  storeId: StoreId
  riderId?: RiderId
  vehicleId?: VehicleId
  type: ExpenseType
  amountMinor: Money
  note?: string
  recordedByUserId: UserId
}
