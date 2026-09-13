import { beforeEach, describe, expect, it } from 'vitest'
import {
  getCurrentStock,
  getDailySalesByStore,
  getOutstandingCreditTotal,
  getOverallDailySales,
  getPaymentsSummary,
  getReceivedStock,
} from './dashboardService'
import { recordPayment } from './paymentService'
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
})
