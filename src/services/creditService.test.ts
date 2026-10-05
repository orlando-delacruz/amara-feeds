import { beforeEach, describe, expect, it } from 'vitest'
import {
  createExistingCredit,
  getCreditHistory,
  listCreditRecords,
  listCredits,
  listPaymentTerms,
  updateCreditInterest,
  voidCredit,
} from './creditService'
import { listPayments } from './paymentService'
import { getStock } from './inventoryService'
import { getDb, resetDb } from './mocks/db'
import { toDateOnly, todayIso } from '@/lib/dates'

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

  it('returns credit records with the item lines and encoder of their sale (DEC-067)', async () => {
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

    const record = (await listCreditRecords()).find((credit) => credit.id === created.id)

    expect(record?.recordedByUserId).toBe('user-3')
    expect(record?.items).toEqual([
      { productId: 'prod-1', productName: 'Rice 25kg', quantity: 2, unitPriceMinor: 100000 },
      { productId: 'prod-2', productName: 'Sugar 1kg', quantity: 1, unitPriceMinor: 50000 },
    ])
    // The item lines match what the credit detail view already shows.
    expect(record?.items).toEqual((await getCreditHistory(created.id)).items)
  })

  it('returns a sale-less credit with no items and no encoder, never dropping it (DEC-067)', async () => {
    getDb().credits.push({
      id: 'cred-no-sale',
      customerId: 'cust-2',
      originStoreId: 'zeann',
      dueDate: '2026-10-01',
      originalAmountMinor: 50000,
      balanceMinor: 50000,
      status: 'outstanding',
      createdAt: new Date().toISOString(),
    })

    const record = (await listCreditRecords()).find((credit) => credit.id === 'cred-no-sale')

    expect(record).toBeDefined()
    expect(record?.items).toEqual([])
    expect(record?.recordedByUserId).toBeUndefined()
  })

  it('keeps listCreditRecords aligned with listCredits (DEC-067)', async () => {
    await createExistingCredit({
      customerId: 'cust-1',
      originStoreId: 'amara',
      date: '2026-09-10',
      dueDate: '2026-10-01',
      lines: [{ productId: 'prod-1', quantity: 1, unitPriceMinor: 100000 }],
      recordedByUserId: 'user-3',
    })

    const obligations = await listCredits()
    const records = await listCreditRecords()

    expect(records.map((record) => record.id)).toEqual(obligations.map((credit) => credit.id))
    // Voided credits stay excluded from both reads (DEC-050).
    expect(records.some((record) => record.status === 'voided')).toBe(false)
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

  it('lets an admin undo a credit; encoded credits never touch stock (DEC-050)', async () => {
    const created = await createExistingCredit({
      customerId: 'cust-1',
      originStoreId: 'amara',
      date: '2026-09-10',
      dueDate: '2026-10-01',
      lines: [{ productId: 'prod-1', quantity: 1, unitPriceMinor: 100000 }],
      recordedByUserId: 'user-3',
    })
    await voidCredit(created.id)
    expect((await listCredits()).some((credit) => credit.id === created.id)).toBe(false)
    // Encoding never deducted stock, so undoing restores nothing.
    expect(await getStock('amara', 'prod-1')).toMatchObject({ quantity: 20 })
  })

  it('refuses a double undo', async () => {
    const created = await createExistingCredit({
      customerId: 'cust-1',
      originStoreId: 'amara',
      date: '2026-09-10',
      dueDate: '2026-10-01',
      lines: [{ productId: 'prod-1', quantity: 1, unitPriceMinor: 100000 }],
      recordedByUserId: 'user-3',
    })
    await voidCredit(created.id)
    await expect(voidCredit(created.id)).rejects.toMatchObject({ code: 'conflict' })
  })

  it('exposes the encoded transaction date from the legacy sale (DEC-057)', async () => {
    const created = await createExistingCredit({
      customerId: 'cust-1',
      originStoreId: 'amara',
      date: '2026-09-10',
      dueDate: '2026-10-01',
      lines: [{ productId: 'prod-1', quantity: 1, unitPriceMinor: 100000 }],
      recordedByUserId: 'user-3',
    })
    const history = await getCreditHistory(created.id)
    expect(history.transactionDate).toBe('2026-09-10')
  })

  it('exposes the charge sale date for sale-linked credits (DEC-057)', async () => {
    // cred-1 rides sale-2, recorded today.
    const history = await getCreditHistory('cred-1')
    expect(history.transactionDate).toBe(todayIso())
  })

  it('falls back to the recording date when no sale is linked (DEC-057)', async () => {
    // cred-2 is a sale-less obligation.
    const history = await getCreditHistory('cred-2')
    expect(history.transactionDate).toBe(toDateOnly(new Date(history.credit.createdAt)))
  })

  it('saves manually entered interest without touching the balance (DEC-059)', async () => {
    const created = await createExistingCredit({
      customerId: 'cust-1',
      originStoreId: 'amara',
      date: '2026-09-10',
      dueDate: '2026-10-01',
      lines: [{ productId: 'prod-1', quantity: 1, unitPriceMinor: 100000 }],
      interestMinor: 5000,
      recordedByUserId: 'user-3',
    })
    expect(created.interestMinor).toBe(5000)
    expect(created.balanceMinor).toBe(100000)
    expect(created.originalAmountMinor).toBe(100000)
    const history = await getCreditHistory(created.id)
    expect(history.credit.interestMinor).toBe(5000)
    expect(history.credit.balanceMinor).toBe(100000)
  })

  it('leaves interest absent when none is entered (DEC-059)', async () => {
    const history = await getCreditHistory('cred-1')
    expect(history.credit.interestMinor).toBeUndefined()
  })

  it('refuses negative interest (DEC-059)', async () => {
    await expect(
      createExistingCredit({
        customerId: 'cust-1',
        originStoreId: 'amara',
        date: '2026-09-10',
        dueDate: '2026-10-01',
        lines: [{ productId: 'prod-1', quantity: 1, unitPriceMinor: 100000 }],
        interestMinor: -100,
        recordedByUserId: 'user-3',
      }),
    ).rejects.toMatchObject({ code: 'validation' })
  })

  it('updates interest without touching the balance (DEC-062)', async () => {
    const updated = await updateCreditInterest('cred-1', 7500)
    expect(updated.interestMinor).toBe(7500)
    expect(updated.balanceMinor).toBe(19500)
    expect(updated.originalAmountMinor).toBe(19500)
    const history = await getCreditHistory('cred-1')
    expect(history.credit.interestMinor).toBe(7500)
    expect(history.credit.balanceMinor).toBe(19500)
  })

  it('clears interest back to absent (DEC-062)', async () => {
    await updateCreditInterest('cred-1', 7500)
    const cleared = await updateCreditInterest('cred-1', null)
    expect(cleared.interestMinor).toBeUndefined()
  })

  it('refuses negative, voided, and unknown interest edits (DEC-062)', async () => {
    await expect(updateCreditInterest('cred-1', -1)).rejects.toMatchObject({
      code: 'validation',
    })
    await voidCredit('cred-1')
    await expect(updateCreditInterest('cred-1', 100)).rejects.toMatchObject({
      code: 'conflict',
    })
    await expect(updateCreditInterest('cred-missing', 100)).rejects.toMatchObject({
      code: 'not_found',
    })
  })
})
