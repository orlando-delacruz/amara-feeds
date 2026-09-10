import { beforeEach, describe, expect, it } from 'vitest'
import { createReceiving, listReceiving } from './receivingService'
import { getStock } from './inventoryService'
import { resetDb } from './mocks/db'

describe('receivingService', () => {
  beforeEach(() => resetDb())

  it('records a receipt and increases the correct store stock only', async () => {
    const before = await getStock('zeann', 'prod-1')
    const record = await createReceiving({
      storeId: 'zeann',
      productId: 'prod-1',
      quantity: 5,
      supplier: 'Central Supply',
      costPriceMinor: 110000,
    })
    expect(record.id).toBeTruthy()
    expect((await getStock('zeann', 'prod-1')).quantity).toBe(before.quantity + 5)
    expect((await getStock('amara', 'prod-1')).quantity).toBe(20)
  })

  it('rejects a non-positive quantity', async () => {
    await expect(
      createReceiving({
        storeId: 'amara',
        productId: 'prod-1',
        quantity: 0,
        supplier: 'Central Supply',
        costPriceMinor: 110000,
      }),
    ).rejects.toMatchObject({ code: 'validation' })
  })

  it('lists receipts scoped by store', async () => {
    const amara = await listReceiving({ storeId: 'amara' })
    expect(amara.length).toBeGreaterThan(0)
    expect(amara.every((record) => record.storeId === 'amara')).toBe(true)
  })
})
