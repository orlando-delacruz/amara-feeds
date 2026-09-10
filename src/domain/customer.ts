import type { CustomerId } from './ids'

export interface Customer {
  id: CustomerId
  name: string
  /** assumed: optional single contact kind; exact customer fields are Confirmation Required */
  contact?: string
  createdAt: string
}

export interface NewCustomerInput {
  name: string
  /** assumed: optional single contact kind; exact customer fields are Confirmation Required */
  contact?: string
}
