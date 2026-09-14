import { beforeEach, describe, expect, it } from 'vitest'
import { createReceiving, listReceiving, listStorePrices } from './receivingService'
import { getStock } from './inventoryService'
import { resetDb } from './mocks/db'

describe('receivingService', () => {
  beforeEach(() => resetDb())

  it('returns the latest selling price per product for a store', async () => {
    const prices = await listStorePrices('amara')
    expect(prices['prod-1']).toBe(115000)
    expect(prices['prod-2']).toBe(6500)
    expect(prices['prod-4']).toBe(9500)
  })

  it('is store-scoped and omits products never received at the store', async () => {
    const amara = await listStorePrices('amara')
    expect(amara['prod-1']).toBe(115000)
    const zeann = await listStorePrices('zeann')
    expect(zeann['prod-1']).toBe(120000)
    expect(zeann['prod-2']).toBe(6500)
  })

  it('uses the most recent receipt when a product was received more than once', async () => {
    await createReceiving({
      storeId: 'amara',
      productId: 'prod-1',
      quantity: 2,
      supplier: 'Central Supply',
      costPriceMinor: 110000,
      sellingPriceMinor: 130000,
      recordedByUserId: 'user-1',
    })
    const prices = await listStorePrices('amara')
    expect(prices['prod-1']).toBe(130000)
  })

  it('omits a product whose receipts carry no selling price', async () => {
    const prices = await listStorePrices('zeann')
    expect(prices['prod-1']).toBe(120000)
    await createReceiving({
      storeId: 'zeann',
      productId: 'prod-3',
      quantity: 2,
      supplier: 'Central Supply',
      costPriceMinor: 10000,
      recordedByUserId: 'user-2',
    })
    const after = await listStorePrices('zeann')
    expect(after['prod-3']).toBeUndefined()
  })

  it('records a receipt and increases the correct store stock only', async () => {
    const before = await getStock('zeann', 'prod-1')
    const record = await createReceiving({
      storeId: 'zeann',
      productId: 'prod-1',
      quantity: 5,
      supplier: 'Central Supply',
      costPriceMinor: 110000,
      recordedByUserId: 'user-2',
    })
    expect(record.id).toBeTruthy()
    expect(record.riderId).toBeUndefined()
    expect(record.vehicleId).toBeUndefined()
    expect((await getStock('zeann', 'prod-1')).quantity).toBe(before.quantity + 5)
    expect((await getStock('amara', 'prod-1')).quantity).toBe(20)
  })

  it('persists an optional selling price on the receipt', async () => {
    const record = await createReceiving({
      storeId: 'amara',
      productId: 'prod-1',
      quantity: 2,
      supplier: 'Central Supply',
      costPriceMinor: 110000,
      sellingPriceMinor: 150000,
      recordedByUserId: 'user-1',
    })
    expect(record.sellingPriceMinor).toBe(150000)
    const [listed] = await listReceiving({ storeId: 'amara' })
    expect(listed).toBeDefined()
  })

  it('rejects a negative selling price', async () => {
    await expect(
      createReceiving({
        storeId: 'amara',
        productId: 'prod-1',
        quantity: 2,
        supplier: 'Central Supply',
        costPriceMinor: 110000,
        sellingPriceMinor: -1,
        recordedByUserId: 'user-1',
      }),
    ).rejects.toMatchObject({ code: 'validation' })
  })

  it('keeps legacy rider/vehicle references when provided', async () => {
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
    expect(record.riderId).toBe('rider-3')
    expect(record.vehicleId).toBe('vehicle-3')
  })

  it('rejects a non-positive quantity', async () => {
    await expect(
      createReceiving({
        storeId: 'amara',
        productId: 'prod-1',
        quantity: 0,
        supplier: 'Central Supply',
        costPriceMinor: 110000,
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
