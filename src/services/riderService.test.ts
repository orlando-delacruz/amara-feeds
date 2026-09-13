import { beforeEach, describe, expect, it } from 'vitest'
import { createRider, listRiders, setRiderActive } from './riderService'
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
})
