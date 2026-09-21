import { beforeEach, describe, expect, it } from 'vitest'
import {
  createExistingCredit,
  getCreditHistory,
  listCredits,
  listPaymentTerms,
} from './creditService'
import { listPayments } from './paymentService'
import { resetDb } from './mocks/db'

describe('creditService', () => {
  beforeEach(() => resetDb())

  it('exposes one shared credit history across stores', async () => {
    const history = await getCreditHistory('cred-2')
    expect(history.credit.originStoreId).toBe('amara')
    const paymentStores = history.payments.map((payment) => payment.storeId)
    expect(paymentStores).toContain('zeann')
    expect(paymentStores).toContain('amara')
  })

  it('lists credits across both origin stores', async () => {
    const credits = await listCredits()
    const origins = new Set(credits.map((credit) => credit.originStoreId))
    expect(origins.has('amara')).toBe(true)
    expect(origins.has('zeann')).toBe(true)
  })

  it('lists payment terms as opaque selections', async () => {
    const terms = await listPaymentTerms()
    expect(terms.length).toBeGreaterThan(0)
    expect(terms[0]).toHaveProperty('label')
  })

  it('encodes an existing credit with item details and no terms (DEC-049)', async () => {
    const created = await createExistingCredit({
      customerId: 'cust-1',
      originStoreId: 'amara',
      date: '2026-09-10',
      dueDate: '2026-10-01',
      lines: [
        { productId: 'prod-1', quantity: 2, unitPriceMinor: 100000 },
        { productId: 'prod-2', quantity: 1, unitPriceMinor: 50000 },
      ],
      recordedByUserId: 'user-3',
    })
    expect(created.termsId).toBeUndefined()
    expect(created.saleId).toBeDefined()
    expect(created.balanceMinor).toBe(250000)
    expect(created.originalAmountMinor).toBe(250000)
    expect(created.status).toBe('outstanding')
    expect(
      (await listCredits()).some(
        (credit) => credit.id === created.id && credit.termsId === undefined,
      ),
    ).toBe(true)
  })

  it('records the optional initial partial payment and exposes items (DEC-049)', async () => {
    const created = await createExistingCredit({
      customerId: 'cust-1',
      originStoreId: 'amara',
      date: '2026-09-10',
      dueDate: '2026-10-01',
      lines: [{ productId: 'prod-1', quantity: 1, unitPriceMinor: 100000 }],
      initialPaymentMinor: 40000,
      initialPaymentMethod: 'Cash',
      recordedByUserId: 'user-3',
    })
    expect(created.balanceMinor).toBe(60000)
    const history = await getCreditHistory(created.id)
    expect(history.items).toHaveLength(1)
    expect(history.items[0]?.productName).toBe('Rice 25kg')
    expect(
      (await listPayments({ creditId: created.id })).some(
        (payment) => payment.amountMinor === 40000,
      ),
    ).toBe(true)
  })

  it('rejects zero amounts and oversized initial payments (DEC-049)', async () => {
    await expect(
      createExistingCredit({
        customerId: 'cust-1',
        originStoreId: 'amara',
        date: '2026-09-10',
        dueDate: '2026-10-01',
        lines: [{ productId: 'prod-1', quantity: 2, unitPriceMinor: 50000 }],
        initialPaymentMinor: 300000,
        recordedByUserId: 'user-3',
      }),
    ).rejects.toMatchObject({ code: 'validation' })
  })

  it('rejects zero-quantity lines', async () => {
    await expect(
      createExistingCredit({
        customerId: 'cust-1',
        originStoreId: 'amara',
        date: '2026-09-10',
        dueDate: '2026-10-01',
        lines: [{ productId: 'prod-1', quantity: 0, unitPriceMinor: 100000 }],
        recordedByUserId: 'user-3',
      }),
    ).rejects.toMatchObject({ code: 'validation' })
  })
})
