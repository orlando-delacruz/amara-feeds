import { beforeEach, describe, expect, it } from 'vitest'
import { createCustomer, getCustomer, listCustomers, searchCustomers } from './customerService'
import { resetDb } from './mocks/db'

describe('customerService', () => {
  beforeEach(() => resetDb())

  it('lists seeded shared customers', async () => {
    const customers = await listCustomers()
    expect(customers.length).toBeGreaterThanOrEqual(3)
  })

  it('creates a shared customer and finds it by search', async () => {
    const created = await createCustomer({ name: '  Pedro Penduko  ', contact: '0918' })
    expect(created.name).toBe('Pedro Penduko')
    const results = await searchCustomers('pedro')
    expect(results.map((customer) => customer.id)).toContain(created.id)
  })

  it('rejects a blank name', async () => {
    await expect(createCustomer({ name: '   ' })).rejects.toMatchObject({ code: 'validation' })
  })

  it('throws when a customer does not exist', async () => {
    await expect(getCustomer('cust-missing')).rejects.toMatchObject({ code: 'not_found' })
  })
})
