import { beforeEach, describe, expect, it } from 'vitest'
import { approveProduct, createProduct, listProducts } from './productService'
import { createSale } from './saleService'
import { getStock } from './inventoryService'
import { createReceiving } from './receivingService'
import { getCredit, getCreditHistory, listCredits } from './creditService'
import { recordPayment } from './paymentService'
import { resetDb } from './mocks/db'

describe('confirmed workflows (Gate 2)', () => {
  beforeEach(() => resetDb())

  it('sale -> automatic stock deduction at the selling store', async () => {
    const before = await getStock('amara', 'prod-2')
    await createSale({
      storeId: 'amara',
      paymentType: 'cash',
      lines: [{ productId: 'prod-2', quantity: 4, unitPriceMinor: 6500 }],
    })
    expect((await getStock('amara', 'prod-2')).quantity).toBe(before.quantity - 4)
    expect((await getStock('zeann', 'prod-2')).quantity).toBe(40)
  })

  it('charge -> shared credit with origin store and due date', async () => {
    const sale = await createSale({
      storeId: 'amara',
      customerId: 'cust-3',
      paymentType: 'charge',
      termsId: 'terms-30',
      lines: [{ productId: 'prod-4', quantity: 2, unitPriceMinor: 9500 }],
    })
    const credits = await listCredits({ customerId: 'cust-3' })
    const obligation = credits.find((credit) => credit.saleId === sale.id)
    expect(obligation?.originStoreId).toBe('amara')
    expect(obligation?.balanceMinor).toBe(19000)
    expect(obligation?.status).toBe('outstanding')
  })

  it('partial payments -> settled with one shared history', async () => {
    await recordPayment({ creditId: 'cred-1', storeId: 'amara', amountMinor: 10000 })
    expect((await getCredit('cred-1')).status).toBe('outstanding')

    await recordPayment({ creditId: 'cred-1', storeId: 'zeann', amountMinor: 9500 })
    const history = await getCreditHistory('cred-1')
    expect(history.credit.status).toBe('settled')
    expect(history.payments).toHaveLength(2)
    expect(history.payments.map((payment) => payment.storeId)).toEqual(
      expect.arrayContaining(['amara', 'zeann']),
    )
  })

  it('cross-store payment keeps origin and payment store traceable', async () => {
    const result = await recordPayment({
      creditId: 'cred-1',
      storeId: 'amara',
      amountMinor: 5000,
    })
    expect(result.credit.originStoreId).toBe('zeann')
    expect(result.payment.storeId).toBe('amara')
  })

  it('receiving -> increases the correct store stock only', async () => {
    const amaraBefore = await getStock('amara', 'prod-4')
    const zeannBefore = await getStock('zeann', 'prod-4')
    await createReceiving({
      storeId: 'zeann',
      productId: 'prod-4',
      quantity: 7,
      supplier: 'Central Supply',
      costPriceMinor: 9000,
    })
    expect((await getStock('zeann', 'prod-4')).quantity).toBe(zeannBefore.quantity + 7)
    expect((await getStock('amara', 'prod-4')).quantity).toBe(amaraBefore.quantity)
  })

  it('product submit -> pending until admin approval', async () => {
    const product = await createProduct({ name: 'Biscuits' })
    const activeBefore = await listProducts({ status: 'active' })
    expect(activeBefore.map((item) => item.id)).not.toContain(product.id)

    await approveProduct(product.id)
    const activeAfter = await listProducts({ status: 'active' })
    expect(activeAfter.map((item) => item.id)).toContain(product.id)
  })
})
