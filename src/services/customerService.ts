import type { Customer, CustomerId, NewCustomerInput } from '@/domain'
import { getDb } from './mocks/db'
import { nextId } from './mocks/ids'
import { ServiceError } from './errors'

export async function listCustomers(): Promise<Customer[]> {
  return getDb().customers.map((customer) => ({ ...customer }))
}

export async function getCustomer(id: CustomerId): Promise<Customer> {
  const customer = getDb().customers.find((item) => item.id === id)
  if (!customer) {
    throw new ServiceError('not_found', 'Customer not found.')
  }
  return { ...customer }
}

export async function searchCustomers(term: string): Promise<Customer[]> {
  const query = term.trim().toLowerCase()
  if (!query) {
    return listCustomers()
  }
  return getDb()
    .customers.filter((customer) => customer.name.toLowerCase().includes(query))
    .map((customer) => ({ ...customer }))
}

export async function createCustomer(input: NewCustomerInput): Promise<Customer> {
  const name = input.name.trim()
  if (!name) {
    throw new ServiceError('validation', 'Customer name is required.')
  }
  const customer: Customer = {
    id: nextId('cust'),
    name,
    contact: input.contact?.trim() || undefined,
    createdAt: new Date().toISOString(),
  }
  getDb().customers.push(customer)
  return { ...customer }
}
