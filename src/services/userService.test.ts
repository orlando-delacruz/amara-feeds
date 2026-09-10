import { beforeEach, describe, expect, it } from 'vitest'
import { listUsers } from './userService'
import { resetDb } from './mocks/db'

describe('userService', () => {
  beforeEach(() => resetDb())

  it('assigns staff to a single store', async () => {
    const amaraStaff = await listUsers({ storeId: 'amara' })
    expect(amaraStaff.length).toBeGreaterThan(0)
    expect(amaraStaff.every((user) => user.storeId === 'amara')).toBe(true)
  })

  it('represents admin as business-wide', async () => {
    const admins = await listUsers({ role: 'admin' })
    expect(admins.length).toBeGreaterThan(0)
    expect(admins[0].storeId).toBeUndefined()
  })
})
