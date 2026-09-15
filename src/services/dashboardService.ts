import type {
  DailySalesByStore,
  OverallDailySales,
  OverallPeriodSales,
  OutstandingCreditTotal,
  PaymentMethodSalesRow,
  PaymentsSummary,
  PeriodSalesByStore,
  ReceivedStockSummaryRow,
  Sale,
  StockSummaryRow,
} from '@/domain'
import { storeIds } from '@/domain/store'
import { isSameDate, startOfMonthOnly, startOfWeekWindowOnly, toDateOnly } from '@/lib/dates'
import { sumMinor } from '@/lib/money'
import { getDb } from './mocks/db'

function saleDayInRange(sale: Sale, startDate: string, endDate: string): boolean {
  return sale.saleDate >= startDate && sale.saleDate <= endDate
}

export async function getDailySalesByStore(date: string): Promise<DailySalesByStore[]> {
  const sales = getDb().sales.filter((sale) => sale.saleDate === date)
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
  const sales = getDb().sales.filter((sale) => sale.saleDate === date)
  return {
    date,
    totalMinor: sumMinor(sales.map((sale) => sale.totalMinor)),
    saleCount: sales.length,
  }
}

export async function getSalesByStoreInRange(
  from: string,
  to: string,
): Promise<PeriodSalesByStore[]> {
  const sales = getDb().sales.filter((sale) => saleDayInRange(sale, from, to))
  return storeIds.map((storeId) => {
    const storeSales = sales.filter((sale) => sale.storeId === storeId)
    return {
      storeId,
      startDate: from,
      endDate: to,
      totalMinor: sumMinor(storeSales.map((sale) => sale.totalMinor)),
      saleCount: storeSales.length,
    }
  })
}

export async function getOverallSalesInRange(
  from: string,
  to: string,
): Promise<OverallPeriodSales> {
  const sales = getDb().sales.filter((sale) => saleDayInRange(sale, from, to))
  return {
    startDate: from,
    endDate: to,
    totalMinor: sumMinor(sales.map((sale) => sale.totalMinor)),
    saleCount: sales.length,
  }
}

export async function getWeeklySalesByStore(date: string): Promise<PeriodSalesByStore[]> {
  const startDate = startOfWeekWindowOnly(date)
  const sales = getDb().sales.filter((sale) => saleDayInRange(sale, startDate, date))
  return storeIds.map((storeId) => {
    const storeSales = sales.filter((sale) => sale.storeId === storeId)
    return {
      storeId,
      startDate,
      endDate: date,
      totalMinor: sumMinor(storeSales.map((sale) => sale.totalMinor)),
      saleCount: storeSales.length,
    }
  })
}

export async function getOverallWeeklySales(date: string): Promise<OverallPeriodSales> {
  const startDate = startOfWeekWindowOnly(date)
  const sales = getDb().sales.filter((sale) => saleDayInRange(sale, startDate, date))
  return {
    startDate,
    endDate: date,
    totalMinor: sumMinor(sales.map((sale) => sale.totalMinor)),
    saleCount: sales.length,
  }
}

export async function getMonthlySalesByStore(date: string): Promise<PeriodSalesByStore[]> {
  const startDate = startOfMonthOnly(date)
  const sales = getDb().sales.filter((sale) => saleDayInRange(sale, startDate, date))
  return storeIds.map((storeId) => {
    const storeSales = sales.filter((sale) => sale.storeId === storeId)
    return {
      storeId,
      startDate,
      endDate: date,
      totalMinor: sumMinor(storeSales.map((sale) => sale.totalMinor)),
      saleCount: storeSales.length,
    }
  })
}

export async function getOverallMonthlySales(date: string): Promise<OverallPeriodSales> {
  const startDate = startOfMonthOnly(date)
  const sales = getDb().sales.filter((sale) => saleDayInRange(sale, startDate, date))
  return {
    startDate,
    endDate: date,
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

export async function getPaymentsSummary(
  filter: { date?: string; from?: string; to?: string } = {},
): Promise<PaymentsSummary> {
  const payments = getDb().payments.filter(
    (payment) =>
      (!filter.date || isSameDate(payment.paidAt, filter.date)) &&
      (!filter.from || toDateOnly(new Date(payment.paidAt)) >= filter.from) &&
      (!filter.to || toDateOnly(new Date(payment.paidAt)) <= filter.to),
  )
  return {
    totalMinor: sumMinor(payments.map((payment) => payment.amountMinor)),
    count: payments.length,
  }
}

export async function getSalesByPaymentMethodInRange(
  from: string,
  to: string,
): Promise<PaymentMethodSalesRow[]> {
  const sales = getDb().sales.filter((sale) => saleDayInRange(sale, from, to))
  const byMethod = new Map<string, { saleCount: number; totalMinor: number }>()
  for (const sale of sales) {
    const method = sale.paymentMethod?.trim() || 'Unspecified'
    const entry = byMethod.get(method) ?? { saleCount: 0, totalMinor: 0 }
    entry.saleCount += 1
    entry.totalMinor += sale.totalMinor
    byMethod.set(method, entry)
  }
  return [...byMethod.entries()]
    .map(([method, row]) => ({ method, saleCount: row.saleCount, totalMinor: row.totalMinor }))
    .sort((a, b) => a.method.localeCompare(b.method, 'en'))
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
  filter: { date?: string; from?: string; to?: string } = {},
): Promise<ReceivedStockSummaryRow[]> {
  const db = getDb()
  return db.receiving
    .filter(
      (record) =>
        (!filter.date || isSameDate(record.receivedAt, filter.date)) &&
        (!filter.from || toDateOnly(new Date(record.receivedAt)) >= filter.from) &&
        (!filter.to || toDateOnly(new Date(record.receivedAt)) <= filter.to),
    )
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
