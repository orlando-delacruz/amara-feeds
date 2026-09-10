import type { UserId } from './ids'
import type { StoreId } from './store'

export type UserRole = 'staff' | 'admin'

export interface User {
  id: UserId
  name: string
  role: UserRole
  /** staff are assigned to one store; admins are business-wide */
  storeId?: StoreId
}
