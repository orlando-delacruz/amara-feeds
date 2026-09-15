import { beforeEach, describe, expect, it } from 'vitest'
import { resetDb } from '@/services/mocks/db'
import { createSale } from '@/services/saleService'
import { createCustomer } from '@/services/customerService'
import { buildSalesReportRows } from './reportRows'
import { todayIso } from '@/lib/dates'

describe('buildSalesReportRows', () => {
  beforeEach(() => resetDb())

  it('expands each sale into one row per line with per-sale fields on the first line', async () => {
    const customer = await createCustomer({ name: 'Dina Cruz' })
    const sale = await createSale({
      storeId: 'amara',
      saleDate: todayIso(),
      customerId: customer.id,
      paymentType: 'cash',
      paymentMethod: 'GCash',
      lines: [
        { productId: 'prod-1', quantity: 2, unitPriceMinor: 115000 },
        { productId: 'prod-2', quantity: 1, unitPriceMinor: 6500 },
      ],
      delivery: { feeMinor: 5000, riderId: 'rider-1', vehicleId: 'vehicle-1' },
      discountMinor: 1000,
      recordedByUserId: 'user-1',
    })

    const rows = (await buildSalesReportRows(todayIso(), todayIso())).filter(
      (row) => row.customerName === 'Dina Cruz',
    )

    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      storeId: 'amara',
      customerName: 'Dina Cruz',
      productName: 'Rice 25kg',
      quantity: 2,
      unitPriceMinor: 115000,
      lineTotalMinor: 230000,
      paymentType: 'Cash',
      paymentMethod: 'GCash',
      deliveryFeeMinor: 5000,
      discountMinor: 1000,
      netTotalMinor: sale.totalMinor,
      riderName: 'Jojo Ramos',
      vehiclePlate: 'Motorcycle',
    })
    expect(rows[1]).toMatchObject({
      productName: 'Sugar 1kg',
      lineTotalMinor: 6500,
      deliveryFeeMinor: 0,
      discountMinor: 0,
      netTotalMinor: 0,
    })
  })

  it('labels sales without a customer as walk-in', async () => {
    await createSale({
      storeId: 'zeann',
      saleDate: todayIso(),
      paymentType: 'cash',
      lines: [{ productId: 'prod-4', quantity: 1, unitPriceMinor: 9500 }],
      recordedByUserId: 'user-2',
    })

    const rows = (await buildSalesReportRows(todayIso(), todayIso(), 'zeann')).filter(
      (row) => row.productName === 'Instant Coffee',
    )

    expect(rows).toHaveLength(1)
    expect(rows[0].customerName).toBe('Walk-in')
  })

  it('filters rows to the given date range', async () => {
    await createSale({
      storeId: 'amara',
      saleDate: '2026-09-01',
      paymentType: 'cash',
      lines: [{ productId: 'prod-1', quantity: 1, unitPriceMinor: 115000 }],
      recordedByUserId: 'user-1',
    })

    const inRange = await buildSalesReportRows('2026-09-01', '2026-09-02', 'amara')
    expect(inRange.some((row) => row.date === '2026-09-01')).toBe(true)

    const outOfRange = await buildSalesReportRows('2026-09-03', '2026-09-04', 'amara')
    expect(outOfRange).toHaveLength(0)
  })
})
