import type { ProductId } from './ids'
import type { StoreId } from './store'
import type { Money } from '@/lib/money'

export interface DailySalesByStore {
  storeId: StoreId
  date: string
  totalMinor: Money
  saleCount: number
}

export interface OverallDailySales {
  date: string
  totalMinor: Money
  saleCount: number
}

export interface OutstandingCreditTotal {
  totalMinor: Money
  count: number
}

export interface PeriodSalesByStore {
  storeId: StoreId
  startDate: string
  endDate: string
  totalMinor: Money
  saleCount: number
}

export interface OverallPeriodSales {
  startDate: string
  endDate: string
  totalMinor: Money
  saleCount: number
}

export interface PaymentsSummary {
  totalMinor: Money
  count: number
}

/** Collections split for the dashboard payment buckets (DEC-059). */
export interface CollectionByMethod {
  gcashMinor: Money
  bankMinor: Money
}

/** Cash-type sales split by receiving method (DEC-059 amendment). */
export interface CashSalesByMethod {
  /** Cash sales not via GCash/Bank (Cash, Maya, Check, Other, blank). */
  cashMinor: Money
  /** Cash sales received via GCash. */
  gcashMinor: Money
  /** Cash sales received via bank transfer. */
  bankMinor: Money
  /** Number of sales summed into cashMinor (charge sales and GCash/bank-method sales excluded). */
  saleCount: number
}

export interface PaymentMethodSalesRow {
  /** Sale payment method (Cash, GCash, Maya, Bank Transfer, Check, or a custom value). */
  method: string
  saleCount: number
  totalMinor: Money
}

export interface StockSummaryRow {
  storeId: StoreId
  productId: ProductId
  productName: string
  quantity: number
  /** admin-approved rows are edit/delete-locked for staff (client change) */
  adminApproved?: boolean
}

export interface ReceivedStockSummaryRow {
  storeId: StoreId
  productId: ProductId
  productName: string
  quantity: number
  costPriceMinor: Money
  receivedAt: string
}
