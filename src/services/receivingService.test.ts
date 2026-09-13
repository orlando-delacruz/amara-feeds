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
      riderId: 'rider-3',
      vehicleId: 'vehicle-3',
      recordedByUserId: 'user-2',
    })
    expect(record.id).toBeTruthy()
    expect(record.riderId).toBe('rider-3')
    expect(record.vehicleId).toBe('vehicle-3')
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
        riderId: 'rider-1',
        vehicleId: 'vehicle-1',
        recordedByUserId: 'user-1',
      }),
    ).rejects.toMatchObject({ code: 'validation' })
  })

  it('rejects a missing rider', async () => {
    await expect(
      createReceiving({
        storeId: 'amara',
        productId: 'prod-1',
        quantity: 5,
        supplier: 'Central Supply',
        costPriceMinor: 110000,
        riderId: '',
        vehicleId: 'vehicle-1',
        recordedByUserId: 'user-1',
      }),
    ).rejects.toMatchObject({ code: 'validation' })
  })

  it('rejects a missing vehicle', async () => {
    await expect(
      createReceiving({
        storeId: 'amara',
        productId: 'prod-1',
        quantity: 5,
        supplier: 'Central Supply',
        costPriceMinor: 110000,
        riderId: 'rider-1',
        vehicleId: '',
        recordedByUserId: 'user-1',
      }),
    ).rejects.toMatchObject({ code: 'validation' })
  })

  it('rejects a rider not belonging to the store', async () => {
    await expect(
      createReceiving({
        storeId: 'amara',
        productId: 'prod-1',
        quantity: 5,
        supplier: 'Central Supply',
        costPriceMinor: 110000,
        riderId: 'rider-3',
        vehicleId: 'vehicle-1',
        recordedByUserId: 'user-1',
      }),
    ).rejects.toMatchObject({ code: 'validation' })
  })

  it('rejects an inactive rider', async () => {
    const { setRiderActive } = await import('./riderService')
    await setRiderActive('rider-1', false)
    await expect(
      createReceiving({
        storeId: 'amara',
        productId: 'prod-1',
        quantity: 5,
        supplier: 'Central Supply',
        costPriceMinor: 110000,
        riderId: 'rider-1',
        vehicleId: 'vehicle-1',
        recordedByUserId: 'user-1',
      }),
    ).rejects.toMatchObject({ code: 'validation' })
  })

  it('lists receipts scoped by store', async () => {
    const amara = await listReceiving({ storeId: 'amara' })
    expect(amara.length).toBeGreaterThan(0)
    expect(amara.every((record) => record.storeId === 'amara')).toBe(true)
  })
})
