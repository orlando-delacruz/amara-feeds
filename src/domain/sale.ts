import type {
  CustomerId,
  PaymentTermsId,
  ProductId,
  RiderId,
  SaleId,
  UserId,
  VehicleId,
} from './ids'
import type { StoreId } from './store'
import type { Money } from '@/lib/money'

export type PaymentType = 'cash' | 'charge'

export interface SaleLine {
  productId: ProductId
  quantity: number
  /**
   * Display/preview price. The authoritative price is derived server-side
   * from the product's most recent priced receiving record at the selling
   * store (confirmed automatic-price rule) and returned with the saved sale.
   */
  unitPriceMinor: Money
}

export interface DeliveryInfo {
  /** assumed: delivery fields are confirmed in kind (fee, rider, vehicle); exact shape is Confirmation Required */
  feeMinor?: Money
  /** assumed: reference to the store's managed rider list */
  riderId?: RiderId
  /** assumed: reference to the store's managed vehicle list */
  vehicleId?: VehicleId
}

export interface Sale {
  id: SaleId
  storeId: StoreId
  /** Business date for the sale (YYYY-MM-DD); may differ from createdAt. */
  saleDate: string
  customerId?: CustomerId
  paymentType: PaymentType
  /** Assumed collection channel (for example Cash, GCash, or a custom Other value). */
  paymentMethod?: string
  lines: SaleLine[]
  delivery?: DeliveryInfo
  /** Assumed discount in minor units, applied once to the whole sale. */
  discountMinor?: Money
  /** assumed: derived total = sum(lines) + delivery fee - discount */
  totalMinor: Money
  /** assumed: staff member who recorded the sale; staff cannot modify another staff's records */
  recordedByUserId: UserId
  /** Encoded legacy credit rows (DEC-049): excluded from sales lists and summaries. */
  isLegacy?: boolean
  createdAt: string
}

export interface NewSaleInput {
  storeId: StoreId
  /** Business date for the sale (YYYY-MM-DD); defaults to today. */
  saleDate?: string
  customerId?: CustomerId
  paymentType: PaymentType
  /** Assumed collection channel; exact methods are Confirmation Required. */
  paymentMethod?: string
  lines: SaleLine[]
  delivery?: DeliveryInfo
  /** Assumed discount in minor units, applied once to the whole sale. */
  discountMinor?: Money
  /** required when paymentType is 'charge'; opaque selection (options are Confirmation Required) */
  termsId?: PaymentTermsId
  /** assumed: signed-in staff member recording the sale */
  recordedByUserId: UserId
}
