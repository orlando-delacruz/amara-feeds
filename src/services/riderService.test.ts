import { beforeEach, describe, expect, it } from 'vitest'
import { createRider, deleteRider, listRiders, setRiderActive, updateRider } from './riderService'
import { resetDb } from './mocks/db'

describe('riderService', () => {
  beforeEach(() => resetDb())

  it('lists riders scoped by store', async () => {
    const amara = await listRiders({ storeId: 'amara' })
    expect(amara.length).toBeGreaterThan(0)
    expect(amara.every((rider) => rider.storeId === 'amara')).toBe(true)
    expect(amara.every((rider) => rider.active)).toBe(true)
  })

  it('creates an active rider for a store', async () => {
    const created = await createRider({
      name: 'New Rider',
      storeId: 'zeann',
      createdByUserId: 'user-2',
    })
    expect(created.id).toBeTruthy()
    expect(created.active).toBe(true)
    expect((await listRiders({ storeId: 'zeann' })).map((rider) => rider.id)).toContain(created.id)
  })

  it('rejects a blank rider name', async () => {
    await expect(createRider({ name: '   ', storeId: 'amara' })).rejects.toMatchObject({
      code: 'validation',
    })
  })

  it('deactivates a rider so the sale form hides it', async () => {
    const created = await createRider({ name: 'Leaving Rider', storeId: 'amara' })
    await setRiderActive(created.id, false)
    expect(
      (await listRiders({ storeId: 'amara', active: true })).map((rider) => rider.id),
    ).not.toContain(created.id)
  })

  it('renames a rider and toggles its active state', async () => {
    const created = await createRider({ name: 'Lito Cruz', storeId: 'amara' })
    const renamed = await updateRider(created.id, { name: 'Lito Dela Cruz' })
    expect(renamed.name).toBe('Lito Dela Cruz')
    const deactivated = await updateRider(created.id, { active: false })
    expect(deactivated.active).toBe(false)
  })

  it('rejects a blank rider name on update', async () => {
    const created = await createRider({ name: 'Lito Cruz', storeId: 'amara' })
    await expect(updateRider(created.id, { name: '   ' })).rejects.toMatchObject({
      code: 'validation',
    })
  })

  it('deletes a rider that is not referenced by any record', async () => {
    const created = await createRider({ name: 'Standby Rider', storeId: 'amara' })
    const removed = await deleteRider(created.id)
    expect(removed.name).toBe('Standby Rider')
    expect((await listRiders({ storeId: 'amara' })).some((rider) => rider.id === created.id)).toBe(
      false,
    )
  })

  it('refuses to delete a rider referenced by expenses', async () => {
    await expect(deleteRider('rider-1')).rejects.toMatchObject({ code: 'conflict' })
    expect((await listRiders()).some((rider) => rider.id === 'rider-1')).toBe(true)
  })
})
