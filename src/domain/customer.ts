import type { CustomerId, UserId } from './ids'

export interface Customer {
  id: CustomerId
  name: string
  /** assumed: optional single contact kind; exact customer fields are Confirmation Required */
  contact?: string
  /** assumed: optional customer address; exact customer fields are Confirmation Required */
  address?: string
  /** assumed: staff member who added the customer record */
  createdByUserId?: UserId
  createdAt: string
}

export interface NewCustomerInput {
  name: string
  /** assumed: optional single contact kind; exact customer fields are Confirmation Required */
  contact?: string
  /** assumed: optional customer address; exact customer fields are Confirmation Required */
  address?: string
  /** assumed: signed-in staff member adding the customer */
  createdByUserId?: UserId
}
