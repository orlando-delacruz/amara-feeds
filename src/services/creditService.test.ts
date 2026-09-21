import { beforeEach, describe, expect, it } from 'vitest'
import {
  createExistingCredit,
  getCreditHistory,
  listCredits,
  listPaymentTerms,
} from './creditService'
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

  it('encodes an existing credit balance with no sale and no terms (client change)', async () => {
    const created = await createExistingCredit({
      customerId: 'cust-1',
      originStoreId: 'amara',
      amountMinor: 250000,
      dueDate: '2026-10-01',
    })
    expect(created.termsId).toBeUndefined()
    expect(created.saleId).toBeUndefined()
    expect(created.balanceMinor).toBe(250000)
    expect(created.status).toBe('outstanding')
    const credits = await listCredits({ customerId: 'cust-1' })
    expect(credits.some((credit) => credit.id === created.id && credit.termsId === undefined)).toBe(
      true,
    )
  })

  it('rejects non-positive existing credit amounts', async () => {
    await expect(
      createExistingCredit({
        customerId: 'cust-1',
        originStoreId: 'amara',
        amountMinor: 0,
        dueDate: '2026-10-01',
      }),
    ).rejects.toMatchObject({ code: 'validation' })
  })
})
