import { beforeEach, describe, expect, it } from 'vitest'
import { resetDb } from '@/services/mocks/db'
import { buildReceivingReportRows } from './receivingReportRows'

describe('buildReceivingReportRows', () => {
  beforeEach(() => resetDb())

  it('exports the store receiving history with resolved names (DEC-060)', async () => {
    const rows = await buildReceivingReportRows('amara')
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every((row) => row.storeId === 'amara')).toBe(true)

    const central = rows.find((row) => row.supplier === 'Central Supply')
    expect(central).toMatchObject({
      productName: 'Rice 25kg',
      quantity: 20,
      costPriceMinor: 110000,
      sellingPriceMinor: 115000,
      recordedByName: 'Alice',
    })
    expect(central?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('orders newest receipts first like the on-page list (DEC-060)', async () => {
    const rows = await buildReceivingReportRows('amara')
    const dates = rows.map((row) => row.date)
    expect(dates.length).toBeGreaterThan(0)
    for (let index = 1; index < dates.length; index++) {
      expect(dates[index] <= dates[index - 1]).toBe(true)
    }
  })

  it('scopes rows to the requested store (DEC-060)', async () => {
    const rows = await buildReceivingReportRows('zeann')
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every((row) => row.storeId === 'zeann')).toBe(true)
    // Cooking Oil 1L was only received at Amara (recv-7).
    expect(rows.some((row) => row.productName === 'Cooking Oil 1L')).toBe(false)
  })
})
