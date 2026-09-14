import { beforeEach, describe, expect, it } from 'vitest'
import {
  createVehicle,
  deleteVehicle,
  listVehicles,
  setVehicleActive,
  updateVehicle,
} from './vehicleService'
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

  it('renames a vehicle and toggles its active state', async () => {
    const created = await createVehicle({ label: 'E-bike', storeId: 'amara' })
    const renamed = await updateVehicle(created.id, { label: 'E-Trike' })
    expect(renamed.label).toBe('E-Trike')
    const deactivated = await updateVehicle(created.id, { active: false })
    expect(deactivated.active).toBe(false)
  })

  it('rejects a blank vehicle type on update', async () => {
    const created = await createVehicle({ label: 'E-bike', storeId: 'amara' })
    await expect(updateVehicle(created.id, { label: '   ' })).rejects.toMatchObject({
      code: 'validation',
    })
  })

  it('deletes a vehicle that is not referenced by any record', async () => {
    const created = await createVehicle({ label: 'Pedicab', storeId: 'amara' })
    const removed = await deleteVehicle(created.id)
    expect(removed.label).toBe('Pedicab')
    expect(
      (await listVehicles({ storeId: 'amara' })).some((vehicle) => vehicle.id === created.id),
    ).toBe(false)
  })

  it('refuses to delete a vehicle referenced by expenses', async () => {
    await expect(deleteVehicle('vehicle-2')).rejects.toMatchObject({ code: 'conflict' })
    expect((await listVehicles()).some((vehicle) => vehicle.id === 'vehicle-2')).toBe(true)
  })
})
