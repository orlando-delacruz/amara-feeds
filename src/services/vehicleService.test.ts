import { beforeEach, describe, expect, it } from 'vitest'
import { createVehicle, listVehicles, setVehicleActive } from './vehicleService'
import { resetDb } from './mocks/db'

describe('vehicleService', () => {
  beforeEach(() => resetDb())

  it('lists vehicles scoped by store', async () => {
    const zeann = await listVehicles({ storeId: 'zeann' })
    expect(zeann.length).toBeGreaterThan(0)
    expect(zeann.every((vehicle) => vehicle.storeId === 'zeann')).toBe(true)
    expect(zeann.every((vehicle) => vehicle.active)).toBe(true)
  })

  it('creates an active vehicle type for a store', async () => {
    const created = await createVehicle({
      label: 'E-bike',
      storeId: 'amara',
      createdByUserId: 'user-1',
    })
    expect(created.id).toBeTruthy()
    expect(created.active).toBe(true)
    expect((await listVehicles({ storeId: 'amara' })).map((vehicle) => vehicle.id)).toContain(
      created.id,
    )
  })

  it('rejects a blank vehicle type', async () => {
    await expect(createVehicle({ label: '   ', storeId: 'amara' })).rejects.toMatchObject({
      code: 'validation',
    })
  })

  it('deactivates a vehicle so the sale form hides it', async () => {
    const created = await createVehicle({ label: 'Old Truck', storeId: 'amara' })
    await setVehicleActive(created.id, false)
    expect(
      (await listVehicles({ storeId: 'amara', active: true })).map((vehicle) => vehicle.id),
    ).not.toContain(created.id)
  })
})
