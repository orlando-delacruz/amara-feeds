import { beforeEach, describe, expect, it } from 'vitest'
import { createSale, listSales } from './saleService'
import { getStock } from './inventoryService'
import { listCredits } from './creditService'
import { resetDb } from './mocks/db'
import { addDays, todayIso } from '@/lib/dates'

describe('saleService', () => {
  beforeEach(() => resetDb())

  it('records a cash sale and deducts the selling store stock', async () => {
    const before = await getStock('amara', 'prod-1')
    const sale = await createSale({
      storeId: 'amara',
      paymentType: 'cash',
      lines: [{ productId: 'prod-1', quantity: 2, unitPriceMinor: 115000 }],
      recordedByUserId: 'user-1',
    })
    expect(sale.totalMinor).toBe(230000)
    expect((await getStock('amara', 'prod-1')).quantity).toBe(before.quantity - 2)
  })

  it('records a charge sale and creates an outstanding obligation at the origin store', async () => {
    const sale = await createSale({
      storeId: 'zeann',
      customerId: 'cust-1',
      paymentType: 'charge',
      termsId: 'terms-15',
      lines: [{ productId: 'prod-2', quantity: 2, unitPriceMinor: 6500 }],
      recordedByUserId: 'user-2',
    })
    const credits = await listCredits({ customerId: 'cust-1', originStoreId: 'zeann' })
    const obligation = credits.find((credit) => credit.saleId === sale.id)
    expect(obligation).toBeDefined()
    expect(obligation?.balanceMinor).toBe(13000)
    expect(obligation?.status).toBe('outstanding')
    expect(obligation?.dueDate).toBe(addDays(sale.createdAt, 15))
  })

  it('requires a customer and terms for charge sales', async () => {
    await expect(
      createSale({
        storeId: 'amara',
        paymentType: 'charge',
        termsId: 'terms-15',
        lines: [{ productId: 'prod-1', quantity: 1, unitPriceMinor: 100 }],
        recordedByUserId: 'user-1',
      }),
    ).rejects.toMatchObject({ code: 'validation' })
    await expect(
      createSale({
        storeId: 'amara',
        customerId: 'cust-1',
        paymentType: 'charge',
        lines: [{ productId: 'prod-1', quantity: 1, unitPriceMinor: 100 }],
        recordedByUserId: 'user-1',
      }),
    ).rejects.toMatchObject({ code: 'validation' })
  })

  it('does not change stock when a sale is invalid', async () => {
    const before = await getStock('amara', 'prod-1')
    await expect(
      createSale({ storeId: 'amara', paymentType: 'cash', lines: [], recordedByUserId: 'user-1' }),
    ).rejects.toMatchObject({ code: 'validation' })
    expect((await getStock('amara', 'prod-1')).quantity).toBe(before.quantity)
  })

  it('rejects a sale from an unknown recorder', async () => {
    await expect(
      createSale({
        storeId: 'amara',
        paymentType: 'cash',
        lines: [{ productId: 'prod-1', quantity: 1, unitPriceMinor: 100 }],
        recordedByUserId: 'user-999',
      }),
    ).rejects.toMatchObject({ code: 'validation' })
  })

  it('filters sales by store and date', async () => {
    const amaraToday = await listSales({ storeId: 'amara', date: todayIso() })
    expect(amaraToday.length).toBeGreaterThanOrEqual(2)
    expect(amaraToday.every((sale) => sale.storeId === 'amara')).toBe(true)
  })
})
