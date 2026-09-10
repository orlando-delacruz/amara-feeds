import type {
  DailySalesByStore,
  OverallDailySales,
  OutstandingCreditTotal,
  PaymentsSummary,
  ReceivedStockSummaryRow,
  StockSummaryRow,
} from '@/domain'
import { storeIds } from '@/domain/store'
import { isSameDate } from '@/lib/dates'
import { sumMinor } from '@/lib/money'
import { getDb } from './mocks/db'

export async function getDailySalesByStore(date: string): Promise<DailySalesByStore[]> {
  const sales = getDb().sales.filter((sale) => isSameDate(sale.createdAt, date))
  return storeIds.map((storeId) => {
    const storeSales = sales.filter((sale) => sale.storeId === storeId)
    return {
      storeId,
      date,
      totalMinor: sumMinor(storeSales.map((sale) => sale.totalMinor)),
      saleCount: storeSales.length,
    }
  })
}

export async function getOverallDailySales(date: string): Promise<OverallDailySales> {
  const sales = getDb().sales.filter((sale) => isSameDate(sale.createdAt, date))
  return {
    date,
    totalMinor: sumMinor(sales.map((sale) => sale.totalMinor)),
    saleCount: sales.length,
  }
}

export async function getOutstandingCreditTotal(): Promise<OutstandingCreditTotal> {
  const outstanding = getDb().credits.filter((credit) => credit.status === 'outstanding')
  return {
    totalMinor: sumMinor(outstanding.map((credit) => credit.balanceMinor)),
    count: outstanding.length,
  }
}

export async function getPaymentsSummary(filter: { date?: string } = {}): Promise<PaymentsSummary> {
  const payments = getDb().payments.filter(
    (payment) => !filter.date || isSameDate(payment.paidAt, filter.date),
  )
  return {
    totalMinor: sumMinor(payments.map((payment) => payment.amountMinor)),
    count: payments.length,
  }
}

export async function getCurrentStock(): Promise<StockSummaryRow[]> {
  const db = getDb()
  return db.stock.map((level) => ({
    storeId: level.storeId,
    productId: level.productId,
    productName: db.products.find((product) => product.id === level.productId)?.name ?? 'Unknown',
    quantity: level.quantity,
  }))
}

export async function getReceivedStock(
  filter: { date?: string } = {},
): Promise<ReceivedStockSummaryRow[]> {
  const db = getDb()
  return db.receiving
    .filter((record) => !filter.date || isSameDate(record.receivedAt, filter.date))
    .map((record) => ({
      storeId: record.storeId,
      productId: record.productId,
      productName:
        db.products.find((product) => product.id === record.productId)?.name ?? 'Unknown',
      quantity: record.quantity,
      costPriceMinor: record.costPriceMinor,
      receivedAt: record.receivedAt,
    }))
}
