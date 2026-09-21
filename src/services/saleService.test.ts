import { beforeEach, describe, expect, it } from 'vitest'
import { createSale, deleteSale, listSales } from './saleService'
import { getStock } from './inventoryService'
import { createExistingCredit, listCredits, previewDueDate } from './creditService'
import { recordPayment } from './paymentService'
import { resetDb } from './mocks/db'
import { todayIso } from '@/lib/dates'

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
    expect(obligation?.dueDate).toBe(await previewDueDate('terms-15', sale.saleDate))
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

  it('applies a discount and rejects one larger than the sale amount', async () => {
    const sale = await createSale({
      storeId: 'amara',
      saleDate: todayIso(),
      paymentType: 'cash',
      paymentMethod: 'GCash',
      discountMinor: 5000,
      lines: [{ productId: 'prod-1', quantity: 1, unitPriceMinor: 115000 }],
      recordedByUserId: 'user-1',
    })
    expect(sale.totalMinor).toBe(110000)
    expect(sale.discountMinor).toBe(5000)
    expect(sale.paymentMethod).toBe('GCash')

    await expect(
      createSale({
        storeId: 'amara',
        saleDate: todayIso(),
        paymentType: 'cash',
        discountMinor: 120000,
        lines: [{ productId: 'prod-1', quantity: 1, unitPriceMinor: 115000 }],
        recordedByUserId: 'user-1',
      }),
    ).rejects.toMatchObject({ code: 'validation' })
  })

  it('rejects a blank payment method or an invalid sale date', async () => {
    const base = {
      storeId: 'amara' as const,
      paymentType: 'cash' as const,
      lines: [{ productId: 'prod-1', quantity: 1, unitPriceMinor: 100 }],
      recordedByUserId: 'user-1',
    }
    await expect(createSale({ ...base, paymentMethod: '   ' })).rejects.toMatchObject({
      code: 'validation',
    })
    await expect(createSale({ ...base, saleDate: 'not-a-date' })).rejects.toMatchObject({
      code: 'validation',
    })
  })

  describe('deleteSale (DEC-049)', () => {
    it('deletes a cash sale and restores the stock it deducted', async () => {
      const sale = await createSale({
        storeId: 'amara',
        paymentType: 'cash',
        lines: [{ productId: 'prod-1', quantity: 3, unitPriceMinor: 115000 }],
        recordedByUserId: 'user-1',
      })
      expect(await getStock('amara', 'prod-1')).toMatchObject({ quantity: 17 })

      await deleteSale(sale.id)

      expect(await getStock('amara', 'prod-1')).toMatchObject({ quantity: 20 })
      expect((await listSales({ storeId: 'amara' })).some((item) => item.id === sale.id)).toBe(
        false,
      )
    })

    it('refuses to delete a sale whose credit has payments', async () => {
      const sale = await createSale({
        storeId: 'amara',
        paymentType: 'charge',
        customerId: 'cust-1',
        termsId: 'terms-15',
        lines: [{ productId: 'prod-1', quantity: 1, unitPriceMinor: 115000 }],
        recordedByUserId: 'user-1',
      })
      const obligation = (await listCredits({ customerId: 'cust-1' })).find(
        (credit) => credit.saleId === sale.id,
      )
      await recordPayment({
        creditId: obligation!.id,
        storeId: 'amara',
        amountMinor: 100,
        method: 'Cash',
        recordedByUserId: 'user-1',
      })
      await expect(deleteSale(sale.id)).rejects.toMatchObject({ code: 'validation' })
      expect(await getStock('amara', 'prod-1')).toMatchObject({ quantity: 19 })
    })
  })

  it('hides encoded legacy credits from the sales list (DEC-049)', async () => {
    await createExistingCredit({
      customerId: 'cust-1',
      originStoreId: 'amara',
      date: '2026-09-10',
      dueDate: '2026-10-01',
      lines: [{ productId: 'prod-1', quantity: 1, unitPriceMinor: 90000 }],
      recordedByUserId: 'user-3',
    })
    const sales = await listSales({ storeId: 'amara' })
    expect(sales.every((sale) => !sale.isLegacy)).toBe(true)
    expect(
      (await listCredits({ customerId: 'cust-1' })).some(
        (credit) => credit.saleId !== undefined && credit.termsId === undefined,
      ),
    ).toBe(true)
  })

  it('prices new sales from the stock-row price when set (DEC-049)', async () => {
    // Seed rows have no stock price — the latest receipt answers.
    const sale = await createSale({
      storeId: 'amara',
      paymentType: 'cash',
      lines: [{ productId: 'prod-1', quantity: 1, unitPriceMinor: 0 }],
      recordedByUserId: 'user-1',
    })
    expect(sale.totalMinor).toBe(115000)
  })
})
