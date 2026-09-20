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
import { isSupabaseConfigured, supabase } from './supabaseClient'
import { serviceErrorFromSupabase } from './userService'

interface SaleRow {
  id: string
  store_id: string
  sale_date: string
  total_minor: number
  payment_method: string | null
  payment_type: string
}

function saleDayInRange(sale: Sale, startDate: string, endDate: string): boolean {
  return sale.saleDate >= startDate && sale.saleDate <= endDate
}

async function fetchSalesForSummary(): Promise<SaleRow[]> {
  if (!isSupabaseConfigured || !supabase) {
    return []
  }
  const { data, error } = await supabase
    .from('sales')
    .select('id, store_id, sale_date, total_minor, payment_method, payment_type')
  if (error) {
    throw serviceErrorFromSupabase(error)
  }
  return (data ?? []) as SaleRow[]
}

export async function getDailySalesByStore(date: string): Promise<DailySalesByStore[]> {
  const rows = await fetchSalesForSummary()
  if (isSupabaseConfigured && supabase) {
    const sales = rows.filter((row) => row.sale_date === date)
    return storeIds.map((storeId) => {
      const storeSales = sales.filter((sale) => sale.store_id === storeId)
      return {
        storeId,
        date,
        totalMinor: sumMinor(storeSales.map((sale) => sale.total_minor)),
        saleCount: storeSales.length,
      }
    })
  }
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
  const rows = await fetchSalesForSummary()
  if (isSupabaseConfigured && supabase) {
    const sales = rows.filter((row) => row.sale_date === date)
    return {
      date,
      totalMinor: sumMinor(sales.map((sale) => sale.total_minor)),
      saleCount: sales.length,
    }
  }
  const sales = getDb().sales.filter((sale) => sale.saleDate === date)
  return {
    date,
    totalMinor: sumMinor(sales.map((sale) => sale.totalMinor)),
    saleCount: sales.length,
  }
}

function inRangeRows(rows: SaleRow[], from: string, to: string): SaleRow[] {
  return rows.filter((row) => row.sale_date >= from && row.sale_date <= to)
}

export async function getSalesByStoreInRange(
  from: string,
  to: string,
): Promise<PeriodSalesByStore[]> {
  const rows = await fetchSalesForSummary()
  if (isSupabaseConfigured && supabase) {
    const sales = inRangeRows(rows, from, to)
    return storeIds.map((storeId) => {
      const storeSales = sales.filter((sale) => sale.store_id === storeId)
      return {
        storeId,
        startDate: from,
        endDate: to,
        totalMinor: sumMinor(storeSales.map((sale) => sale.total_minor)),
        saleCount: storeSales.length,
      }
    })
  }
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
  const rows = await fetchSalesForSummary()
  if (isSupabaseConfigured && supabase) {
    const sales = inRangeRows(rows, from, to)
    return {
      startDate: from,
      endDate: to,
      totalMinor: sumMinor(sales.map((sale) => sale.total_minor)),
      saleCount: sales.length,
    }
  }
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
  const rows = await fetchSalesForSummary()
  if (isSupabaseConfigured && supabase) {
    const sales = inRangeRows(rows, startDate, date)
    return storeIds.map((storeId) => {
      const storeSales = sales.filter((sale) => sale.store_id === storeId)
      return {
        storeId,
        startDate,
        endDate: date,
        totalMinor: sumMinor(storeSales.map((sale) => sale.total_minor)),
        saleCount: storeSales.length,
      }
    })
  }
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
  const rows = await fetchSalesForSummary()
  if (isSupabaseConfigured && supabase) {
    const sales = inRangeRows(rows, startDate, date)
    return {
      startDate,
      endDate: date,
      totalMinor: sumMinor(sales.map((sale) => sale.total_minor)),
      saleCount: sales.length,
    }
  }
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
  const rows = await fetchSalesForSummary()
  if (isSupabaseConfigured && supabase) {
    const sales = inRangeRows(rows, startDate, date)
    return storeIds.map((storeId) => {
      const storeSales = sales.filter((sale) => sale.store_id === storeId)
      return {
        storeId,
        startDate,
        endDate: date,
        totalMinor: sumMinor(storeSales.map((sale) => sale.total_minor)),
        saleCount: storeSales.length,
      }
    })
  }
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
  const rows = await fetchSalesForSummary()
  if (isSupabaseConfigured && supabase) {
    const sales = inRangeRows(rows, startDate, date)
    return {
      startDate,
      endDate: date,
      totalMinor: sumMinor(sales.map((sale) => sale.total_minor)),
      saleCount: sales.length,
    }
  }
  const sales = getDb().sales.filter((sale) => saleDayInRange(sale, startDate, date))
  return {
    startDate,
    endDate: date,
    totalMinor: sumMinor(sales.map((sale) => sale.totalMinor)),
    saleCount: sales.length,
  }
}

export async function getOutstandingCreditTotal(): Promise<OutstandingCreditTotal> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('credit_obligations')
      .select('balance_minor')
      .eq('status', 'outstanding')
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    const rows = data ?? []
    return {
      totalMinor: sumMinor(rows.map((row) => row.balance_minor)),
      count: rows.length,
    }
  }
  const outstanding = getDb().credits.filter((credit) => credit.status === 'outstanding')
  return {
    totalMinor: sumMinor(outstanding.map((credit) => credit.balanceMinor)),
    count: outstanding.length,
  }
}

export async function getPaymentsSummary(
  filter: { date?: string; from?: string; to?: string } = {},
): Promise<PaymentsSummary> {
  if (isSupabaseConfigured && supabase) {
    let query = supabase.from('payments').select('amount_minor, paid_at')
    if (filter.date) {
      query = query
        .gte('paid_at', `${filter.date}T00:00:00`)
        .lte('paid_at', `${filter.date}T23:59:59`)
    }
    if (filter.from) {
      query = query.gte('paid_at', `${filter.from}T00:00:00`)
    }
    if (filter.to) {
      query = query.lte('paid_at', `${filter.to}T23:59:59`)
    }
    const { data, error } = await query
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    const rows = data ?? []
    return {
      totalMinor: sumMinor(rows.map((row) => row.amount_minor)),
      count: rows.length,
    }
  }
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
  const sales =
    isSupabaseConfigured && supabase
      ? inRangeRows(await fetchSalesForSummary(), from, to)
      : getDb()
          .sales.filter((sale) => saleDayInRange(sale, from, to))
          .map((sale) => ({
            id: sale.id,
            store_id: sale.storeId,
            sale_date: sale.saleDate,
            total_minor: sale.totalMinor,
            payment_method: sale.paymentMethod ?? null,
            payment_type: sale.paymentType,
          }))
  const byMethod = new Map<string, { saleCount: number; totalMinor: number }>()
  for (const sale of sales) {
    const method = sale.payment_method?.trim() || 'Unspecified'
    const entry = byMethod.get(method) ?? { saleCount: 0, totalMinor: 0 }
    entry.saleCount += 1
    entry.totalMinor += sale.total_minor
    byMethod.set(method, entry)
  }
  return [...byMethod.entries()]
    .map(([method, row]) => ({ method, saleCount: row.saleCount, totalMinor: row.totalMinor }))
    .sort((a, b) => a.method.localeCompare(b.method, 'en'))
}

export async function getCurrentStock(): Promise<StockSummaryRow[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('stock_levels')
      .select('store_id, product_id, quantity, products(name)')
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    return (data ?? []).map((row) => ({
      storeId: row.store_id as StockSummaryRow['storeId'],
      productId: row.product_id,
      productName: (row.products as { name?: string } | null)?.name ?? 'Unknown',
      quantity: row.quantity,
    }))
  }
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
  if (isSupabaseConfigured && supabase) {
    let query = supabase
      .from('receiving_records')
      .select('store_id, product_id, quantity, cost_price_minor, received_at, products(name)')
    if (filter.date) {
      query = query
        .gte('received_at', `${filter.date}T00:00:00`)
        .lte('received_at', `${filter.date}T23:59:59`)
    }
    if (filter.from) {
      query = query.gte('received_at', `${filter.from}T00:00:00`)
    }
    if (filter.to) {
      query = query.lte('received_at', `${filter.to}T23:59:59`)
    }
    const { data, error } = await query.order('received_at', { ascending: false })
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    return (data ?? []).map((row) => ({
      storeId: row.store_id as ReceivedStockSummaryRow['storeId'],
      productId: row.product_id,
      productName: (row.products as { name?: string } | null)?.name ?? 'Unknown',
      quantity: row.quantity,
      costPriceMinor: row.cost_price_minor,
      receivedAt: row.received_at,
    }))
  }
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
