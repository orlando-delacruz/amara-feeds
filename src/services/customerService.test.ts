import { beforeEach, describe, expect, it } from 'vitest'
import {
  createCustomer,
  deleteCustomer,
  getCustomer,
  listCustomers,
  searchCustomers,
  updateCustomer,
} from './customerService'
import { getDb, resetDb } from './mocks/db'

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

  it('edits customer details (DEC-049)', async () => {
    const created = await createCustomer({ name: 'Old Name', contact: '0917' })
    const saved = await updateCustomer(created.id, {
      name: 'Corrected Name',
      contact: '0918',
      address: 'New Address',
    })
    expect(saved.name).toBe('Corrected Name')
    const fetched = await getCustomer(created.id)
    expect(fetched.name).toBe('Corrected Name')
    expect(fetched.contact).toBe('0918')
  })

  it('refuses blank names and unknown ids on edit (DEC-049)', async () => {
    const created = await createCustomer({ name: 'Keep Me' })
    await expect(updateCustomer(created.id, { name: '   ' })).rejects.toMatchObject({
      code: 'validation',
    })
    await expect(updateCustomer('cust-never', { name: 'X' })).rejects.toMatchObject({
      code: 'not_found',
    })
  })

  it('deletes an unreferenced customer (DEC-053)', async () => {
    const created = await createCustomer({ name: 'Temporary Customer' })
    await deleteCustomer(created.id)
    expect((await listCustomers()).some((customer) => customer.id === created.id)).toBe(false)
  })

  it('refuses deletion while an outstanding credit exists (DEC-053)', async () => {
    // Seed cust-1 carries sales and an outstanding credit (cred-2).
    await expect(deleteCustomer('cust-1')).rejects.toMatchObject({ code: 'conflict' })
    expect((await listCustomers()).some((customer) => customer.id === 'cust-1')).toBe(true)
  })

  it('deletes a settled customer with their sales, credits, and payments (DEC-053)', async () => {
    // Seed cust-3 has no sales but carries settled credit cred-3 + pay-3.
    await deleteCustomer('cust-3')
    const db = getDb()
    expect(db.customers.some((customer) => customer.id === 'cust-3')).toBe(false)
    expect(db.credits.some((credit) => credit.customerId === 'cust-3')).toBe(false)
    expect(db.payments.some((payment) => payment.creditId === 'cred-3')).toBe(false)
    // Everyone else's records are untouched.
    expect(db.customers.length).toBe(2)
    expect(db.sales.length).toBe(4)
    expect(db.credits.length).toBe(2)
    expect(db.payments.length).toBe(2)
  })
})
