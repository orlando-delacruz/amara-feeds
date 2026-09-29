import { beforeEach, describe, expect, it } from 'vitest'
import {
  getCashSalesByMethod,
  getCollectionByMethod,
  getCurrentStock,
  getDailySalesByStore,
  getMonthlySalesByStore,
  getOutstandingCreditTotal,
  getOverallDailySales,
  getOverallMonthlySales,
  getOverallSalesInRange,
  getOverallWeeklySales,
  getPaymentsSummary,
  getReceivedStock,
  getSalesByPaymentMethodInRange,
  getSalesByStoreInRange,
  getWeeklySalesByStore,
} from './dashboardService'
import { recordPayment } from './paymentService'
import { createSale } from './saleService'
import { resetDb } from './mocks/db'
import { todayIso } from '@/lib/dates'

describe('dashboardService', () => {
  beforeEach(() => resetDb())

  it('reports daily sales per store and overall for today', async () => {
    const perStore = await getDailySalesByStore(todayIso())
    const amara = perStore.find((row) => row.storeId === 'amara')
    const zeann = perStore.find((row) => row.storeId === 'zeann')
    expect(amara?.saleCount).toBe(2)
    expect(zeann?.saleCount).toBe(1)

    const overall = await getOverallDailySales(todayIso())
    expect(overall.saleCount).toBe(3)
    expect(overall.totalMinor).toBe((amara?.totalMinor ?? 0) + (zeann?.totalMinor ?? 0))
  })

  it('aggregates sales, payments, and received stock over a date range', async () => {
    const today = todayIso()
    const perStore = await getSalesByStoreInRange(today, today)
    const overall = await getOverallSalesInRange(today, today)
    expect(overall.saleCount).toBe(3)
    expect(perStore.reduce((sum, row) => sum + row.saleCount, 0)).toBe(3)

    const paymentsByRange = await getPaymentsSummary({ from: today, to: today })
    const paymentsByDate = await getPaymentsSummary({ date: today })
    expect(paymentsByRange).toEqual(paymentsByDate)

    const receivedByRange = await getReceivedStock({ from: today, to: today })
    const receivedByDate = await getReceivedStock({ date: today })
    expect(receivedByRange).toEqual(receivedByDate)
  })

  it('groups sales by mode of payment over a range', async () => {
    const today = todayIso()
    const rows = await getSalesByPaymentMethodInRange(today, today)
    const methods = rows.map((row) => row.method)
    expect(methods).toContain('Cash')
    expect(methods).toContain('GCash')
    expect(rows.reduce((sum, row) => sum + row.saleCount, 0)).toBe(3)
    expect(rows.every((row) => row.totalMinor > 0)).toBe(true)
  })

  it('reports weekly sales as the trailing 7 days including yesterday', async () => {
    const date = todayIso()
    const perStore = await getWeeklySalesByStore(date)
    const amara = perStore.find((row) => row.storeId === 'amara')
    const zeann = perStore.find((row) => row.storeId === 'zeann')
    expect(amara?.saleCount).toBe(2)
    expect(zeann?.saleCount).toBe(2)

    const overall = await getOverallWeeklySales(date)
    expect(overall.saleCount).toBe(4)
    expect(overall.totalMinor).toBe((amara?.totalMinor ?? 0) + (zeann?.totalMinor ?? 0))
    expect(overall.endDate).toBe(date)
  })

  it('reports monthly sales from the first of the month', async () => {
    const date = todayIso()
    const perStore = await getMonthlySalesByStore(date)
    expect(perStore.length).toBe(2)
    expect(perStore[0].startDate).toBe(`${date.slice(0, 7)}-01`)

    const overall = await getOverallMonthlySales(date)
    expect(overall.saleCount).toBeGreaterThanOrEqual(3)
    expect(overall.totalMinor).toBe(perStore.reduce((sum, row) => sum + row.totalMinor, 0))
  })

  it('reflects outstanding credit after a payment', async () => {
    const before = await getOutstandingCreditTotal()
    await recordPayment({
      creditId: 'cred-1',
      storeId: 'amara',
      amountMinor: 5000,
      recordedByUserId: 'user-1',
    })
    const after = await getOutstandingCreditTotal()
    expect(after.totalMinor).toBe(before.totalMinor - 5000)
  })

  it('summarizes payments, stock, and received stock', async () => {
    const payments = await getPaymentsSummary()
    expect(payments.count).toBeGreaterThan(0)

    const stock = await getCurrentStock()
    expect(stock.length).toBeGreaterThan(0)
    expect(stock.every((row) => row.productName !== 'Unknown')).toBe(true)

    const received = await getReceivedStock({ date: todayIso() })
    expect(received.length).toBeGreaterThan(0)
    expect(received.every((row) => row.productName !== 'Unknown')).toBe(true)
  })

  it('buckets cash-type sales by receiving method (DEC-059)', async () => {
    // Seed cash sales: sale-1 (230000 Cash, amara, today) + sale-3 (9500 Cash,
    // amara, today) + sale-4 (120000 Maya, zeann, yesterday); sale-2 is charge.
    const today = await getCashSalesByMethod({ date: todayIso() })
    expect(today).toEqual({ cashMinor: 239500, gcashMinor: 0, bankMinor: 0, saleCount: 2 })

    const wide = await getCashSalesByMethod({ from: '2000-01-01', to: '2999-01-01' })
    expect(wide.cashMinor).toBe(359500)
    expect(wide.saleCount).toBe(3)
  })

  it('counts GCash and bank-method sales in their buckets (DEC-059)', async () => {
    await createSale({
      storeId: 'amara',
      saleDate: todayIso(),
      paymentType: 'cash',
      paymentMethod: 'GCash',
      lines: [{ productId: 'prod-4', quantity: 1, unitPriceMinor: 9500 }],
      recordedByUserId: 'user-1',
    })
    const today = await getCashSalesByMethod({ date: todayIso() })
    expect(today.gcashMinor).toBe(9500)
    expect(today.cashMinor).toBe(239500)
    // Only the cash-bucket sales are counted (the GCash-method sale is not).
    expect(today.saleCount).toBe(2)
  })

  it('excludes charge sales from Total Cash Sales (cash/charge regression)', async () => {
    const date = todayIso()
    const before = await getCashSalesByMethod({ date })
    const overallBefore = await getOverallDailySales(date)

    const charge = await createSale({
      storeId: 'amara',
      saleDate: date,
      customerId: 'cust-1',
      paymentType: 'charge',
      termsId: 'terms-15',
      lines: [{ productId: 'prod-1', quantity: 1, unitPriceMinor: 115000 }],
      recordedByUserId: 'user-1',
    })
    // A charge sale is credit, not cash received: no payment bucket moves.
    expect(await getCashSalesByMethod({ date })).toEqual(before)
    // ...while the gross daily sales hero still reflects it.
    const overallAfterCharge = await getOverallDailySales(date)
    expect(overallAfterCharge.totalMinor).toBe(overallBefore.totalMinor + charge.totalMinor)
    expect(overallAfterCharge.saleCount).toBe(overallBefore.saleCount + 1)

    const cash = await createSale({
      storeId: 'amara',
      saleDate: date,
      paymentType: 'cash',
      paymentMethod: 'Cash',
      lines: [{ productId: 'prod-1', quantity: 1, unitPriceMinor: 115000 }],
      recordedByUserId: 'user-1',
    })
    const after = await getCashSalesByMethod({ date })
    expect(after.cashMinor).toBe(before.cashMinor + cash.totalMinor)
    expect(after.saleCount).toBe(before.saleCount + 1)
    expect(after.gcashMinor).toBe(before.gcashMinor)
    expect(after.bankMinor).toBe(before.bankMinor)
  })

  it('splits collections into GCash and bank buckets (DEC-059)', async () => {
    // Seed payments: GCash 20000 (zeann), Cash 10000 (amara), Bank 12000 (amara).
    const wide = await getCollectionByMethod({ from: '2000-01-01', to: '2999-01-01' })
    expect(wide).toEqual({ gcashMinor: 20000, bankMinor: 12000 })

    const amara = await getCollectionByMethod({
      from: '2000-01-01',
      to: '2999-01-01',
      storeId: 'amara',
    })
    expect(amara).toEqual({ gcashMinor: 0, bankMinor: 12000 })

    // Seed payments were recorded 1–2 days ago, so today is empty.
    expect(await getCollectionByMethod({ date: todayIso() })).toEqual({
      gcashMinor: 0,
      bankMinor: 0,
    })
  })
})
