import type { UserId } from './ids'
import type { StoreId } from './store'

export type UserRole = 'staff' | 'admin'

export interface User {
  id: UserId
  name: string
  role: UserRole
  /** staff are assigned to one store; admins are business-wide */
  storeId?: StoreId
  /** assumed: sign-in handle for the login form; exact auth fields are Confirmation Required */
  username: string
  /**
   * assumed: mock-only credential for the localStorage login form.
   * Never real passwords; replaced by Supabase Auth in a later phase.
   */
  password?: string
  /** assumed: deactivated accounts cannot sign in */
  active: boolean
}

export interface NewUserInput {
  name: string
  role: UserRole
  storeId?: StoreId
  username: string
  password: string
}

export interface UpdateUserInput {
  name?: string
  storeId?: StoreId
  username?: string
  password?: string
  active?: boolean
}
