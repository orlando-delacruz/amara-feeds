import { beforeEach, describe, expect, it } from 'vitest'
import { getCreditHistory, listCredits, listPaymentTerms } from './creditService'
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
})
