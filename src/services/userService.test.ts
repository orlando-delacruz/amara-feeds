import { beforeEach, describe, expect, it } from 'vitest'
import { createUser, listUsers, serviceErrorFromSupabase, signIn, updateUser } from './userService'
import { resetDb } from './mocks/db'

describe('serviceErrorFromSupabase', () => {
  it('keeps our business copy and classifies by message', () => {
    const conflict = serviceErrorFromSupabase({
      code: 'P0001',
      message: 'That username is already taken.',
    })
    expect(conflict.code).toBe('conflict')

    const notFound = serviceErrorFromSupabase({ code: 'P0001', message: 'User not found.' })
    expect(notFound.code).toBe('not_found')

    const validation = serviceErrorFromSupabase({
      code: 'P0001',
      message: 'Received quantity must be greater than zero.',
    })
    expect(validation.code).toBe('validation')
  })

  it('never surfaces raw database internals', () => {
    const mapped = serviceErrorFromSupabase({
      code: '42883',
      message: 'function gen_salt(unknown) does not exist',
    })
    expect(mapped.message).toBe('Something went wrong. Please try again.')

    const scalar = serviceErrorFromSupabase({
      code: '22023',
      message: 'cannot get array length of a scalar',
    })
    expect(scalar.message).toBe('Something went wrong. Please try again.')
  })
})

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

  it('signs in with a matching username and password', async () => {
    const user = await signIn({ username: 'alice', password: 'alice123' })
    expect(user.id).toBe('user-1')
    expect(user.storeId).toBe('amara')
  })

  it('matches usernames case-insensitively', async () => {
    const user = await signIn({ username: 'Alice', password: 'alice123' })
    expect(user.id).toBe('user-1')
  })

  it('rejects a wrong password without saying which part failed', async () => {
    await expect(signIn({ username: 'alice', password: 'nope' })).rejects.toMatchObject({
      code: 'validation',
      message: 'Incorrect username or password.',
    })
  })

  it('rejects an unknown username', async () => {
    await expect(signIn({ username: 'ghost', password: 'whatever' })).rejects.toMatchObject({
      code: 'validation',
    })
  })

  it('rejects a disabled account', async () => {
    const created = await createUser({
      name: 'Temp Staff',
      role: 'staff',
      storeId: 'zeann',
      username: 'tempstaff',
      password: 'temp1234',
    })
    await updateUser(created.id, { active: false })
    await expect(signIn({ username: 'tempstaff', password: 'temp1234' })).rejects.toMatchObject({
      code: 'validation',
      message: 'This account is disabled. Contact the admin.',
    })
  })

  it('creates a staff account with a store assignment', async () => {
    const created = await createUser({
      name: 'Cora Staff',
      role: 'staff',
      storeId: 'zeann',
      username: 'cora',
      password: 'cora1234',
    })
    expect(created.id).toBeTruthy()
    expect(created.storeId).toBe('zeann')
    expect(created.active).toBe(true)

    const signedIn = await signIn({ username: 'cora', password: 'cora1234' })
    expect(signedIn.id).toBe(created.id)
  })

  it('requires a store assignment for staff', async () => {
    await expect(
      createUser({ name: 'No Store', role: 'staff', username: 'nostore', password: 'nostore1' }),
    ).rejects.toMatchObject({ code: 'validation' })
  })

  it('rejects a taken username', async () => {
    await expect(
      createUser({
        name: 'Copy Cat',
        role: 'staff',
        storeId: 'amara',
        username: 'alice',
        password: 'copy1234',
      }),
    ).rejects.toMatchObject({ code: 'conflict' })
  })

  it('updates a staff store assignment and disables the account', async () => {
    const created = await createUser({
      name: 'Movable Staff',
      role: 'staff',
      storeId: 'amara',
      username: 'movable',
      password: 'move1234',
    })
    const moved = await updateUser(created.id, { storeId: 'zeann' })
    expect(moved.storeId).toBe('zeann')

    const disabled = await updateUser(created.id, { active: false })
    expect(disabled.active).toBe(false)
    expect((await listUsers({ active: true })).some((user) => user.id === created.id)).toBe(false)
  })
})
