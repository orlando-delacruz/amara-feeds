import type { CustomerId, PaymentTermsId, ProductId, SaleId } from './ids'
import type { StoreId } from './store'
import type { Money } from '@/lib/money'

export type PaymentType = 'cash' | 'charge'

export interface SaleLine {
  productId: ProductId
  quantity: number
  /** assumed: price captured at sale time; exact product pricing is Confirmation Required */
  unitPriceMinor: Money
}

export interface DeliveryInfo {
  /** assumed: delivery fields are confirmed in kind (fee, rider, vehicle); exact shape is Confirmation Required */
  feeMinor?: Money
  rider?: string
  vehicle?: string
}

export interface Sale {
  id: SaleId
  storeId: StoreId
  customerId?: CustomerId
  paymentType: PaymentType
  lines: SaleLine[]
  delivery?: DeliveryInfo
  /** assumed: derived total = sum(lines) + delivery fee */
  totalMinor: Money
  createdAt: string
}

export interface NewSaleInput {
  storeId: StoreId
  customerId?: CustomerId
  paymentType: PaymentType
  lines: SaleLine[]
  delivery?: DeliveryInfo
  /** required when paymentType is 'charge'; opaque selection (options are Confirmation Required) */
  termsId?: PaymentTermsId
}
