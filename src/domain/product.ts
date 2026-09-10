import type { ProductId, UserId } from './ids'

export type ProductStatus = 'pending' | 'active'

export interface Product {
  id: ProductId
  name: string
  status: ProductStatus
  /** assumed: submitter reference; exact product fields are Confirmation Required */
  createdByUserId?: UserId
  createdAt: string
}

export interface NewProductInput {
  name: string
  /** assumed: submitter reference; exact product fields are Confirmation Required */
  createdByUserId?: UserId
}
