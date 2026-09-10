import { beforeEach, describe, expect, it } from 'vitest'
import { getStock, listStock } from './inventoryService'
import { resetDb } from './mocks/db'

describe('inventoryService', () => {
  beforeEach(() => resetDb())

  it('keeps stock separate per store', async () => {
    const amara = await getStock('amara', 'prod-1')
    const zeann = await getStock('zeann', 'prod-1')
    expect(amara.quantity).toBe(20)
    expect(zeann.quantity).toBe(12)
  })

  it('scopes listings by store', async () => {
    const amaraStock = await listStock({ storeId: 'amara' })
    expect(amaraStock.length).toBeGreaterThan(0)
    expect(amaraStock.every((level) => level.storeId === 'amara')).toBe(true)
  })
})
