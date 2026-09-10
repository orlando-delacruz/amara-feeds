import { beforeEach, describe, expect, it } from 'vitest'
import { listPayments, recordPayment } from './paymentService'
import { getCredit } from './creditService'
import { resetDb } from './mocks/db'

describe('paymentService', () => {
  beforeEach(() => resetDb())

  it('applies a partial payment and keeps the credit outstanding', async () => {
    const result = await recordPayment({ creditId: 'cred-1', storeId: 'amara', amountMinor: 5000 })
    expect(result.credit.balanceMinor).toBe(14500)
    expect(result.credit.status).toBe('outstanding')
    expect(result.payment.storeId).toBe('amara')
  })

  it('settles a credit when fully paid', async () => {
    const result = await recordPayment({
      creditId: 'cred-1',
      storeId: 'zeann',
      amountMinor: 19500,
    })
    expect(result.credit.balanceMinor).toBe(0)
    expect(result.credit.status).toBe('settled')
  })

  it('records a cross-store payment against the shared credit', async () => {
    await recordPayment({ creditId: 'cred-1', storeId: 'amara', amountMinor: 19500 })
    const history = await listPayments({ creditId: 'cred-1' })
    const credit = await getCredit('cred-1')
    expect(credit.originStoreId).toBe('zeann')
    expect(history.some((payment) => payment.storeId === 'amara')).toBe(true)
  })

  it('rejects overpayment and non-positive amounts', async () => {
    await expect(
      recordPayment({ creditId: 'cred-1', storeId: 'amara', amountMinor: 999999 }),
    ).rejects.toMatchObject({ code: 'validation' })
    await expect(
      recordPayment({ creditId: 'cred-1', storeId: 'amara', amountMinor: 0 }),
    ).rejects.toMatchObject({ code: 'validation' })
  })

  it('rejects payments on an already settled credit', async () => {
    await expect(
      recordPayment({ creditId: 'cred-3', storeId: 'amara', amountMinor: 100 }),
    ).rejects.toMatchObject({ code: 'conflict' })
  })
})
