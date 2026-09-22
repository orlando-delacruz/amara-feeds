import type { Customer, CustomerId, NewCustomerInput } from '@/domain'
import { getDb } from './mocks/db'
import { nextId } from './mocks/ids'
import { isSupabaseConfigured, supabase } from './supabaseClient'
import { serviceErrorFromSupabase } from './userService'
import { ServiceError } from './errors'

export async function listCustomers(): Promise<Customer[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, contact, address, created_at')
      .order('name', { ascending: true })
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      contact: row.contact ?? undefined,
      address: row.address ?? undefined,
      createdAt: row.created_at,
    }))
  }
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
  if (isSupabaseConfigured && supabase) {
    if (!query) {
      return listCustomers()
    }
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, contact, address, created_at')
      .ilike('name', `%${query}%`)
      .order('name', { ascending: true })
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      contact: row.contact ?? undefined,
      address: row.address ?? undefined,
      createdAt: row.created_at,
    }))
  }
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
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc('create_customer', {
      p_name: name,
      p_contact: input.contact?.trim() || null,
      p_address: input.address?.trim() || null,
    })
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    return {
      id: data?.customer_id as string,
      name,
      contact: input.contact?.trim() || undefined,
      address: input.address?.trim() || undefined,
      createdAt: new Date().toISOString(),
    }
  }
  const customer: Customer = {
    id: nextId('cust'),
    name,
    contact: input.contact?.trim() || undefined,
    address: input.address?.trim() || undefined,
    createdByUserId: input.createdByUserId,
    createdAt: new Date().toISOString(),
  }
  getDb().customers.push(customer)
  return { ...customer }
}

export interface UpdateCustomerInput {
  name: string
  contact?: string
  address?: string
}

export async function updateCustomer(
  id: CustomerId,
  input: UpdateCustomerInput,
): Promise<Customer> {
  const name = input.name.trim()
  if (!name) {
    throw new ServiceError('validation', 'Customer name is required.')
  }
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.rpc('update_customer', {
      p_customer_id: id,
      p_name: name,
      p_contact: input.contact?.trim() || null,
      p_address: input.address?.trim() || null,
    })
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    return {
      id,
      name,
      contact: input.contact?.trim() || undefined,
      address: input.address?.trim() || undefined,
      createdAt: new Date().toISOString(),
    }
  }
  const customer = getDb().customers.find((item) => item.id === id)
  if (!customer) {
    throw new ServiceError('not_found', 'Customer not found.')
  }
  customer.name = name
  customer.contact = input.contact?.trim() || undefined
  customer.address = input.address?.trim() || undefined
  return { ...customer }
}

export async function deleteCustomer(id: CustomerId): Promise<CustomerId> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.rpc('delete_customer', { p_customer_id: id })
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    return id
  }
  const db = getDb()
  const index = db.customers.findIndex((item) => item.id === id)
  if (index === -1) {
    throw new ServiceError('not_found', 'Customer not found.')
  }
  // Mirror the database hard delete (DEC-053): outstanding (payable) credit
  // blocks deletion; settled/voided credits, their payments, and the
  // customer's sales are removed with the customer.
  const hasOutstanding = db.credits.some(
    (credit) => credit.customerId === id && credit.status === 'outstanding',
  )
  if (hasOutstanding) {
    throw new ServiceError(
      'conflict',
      'This customer has an outstanding credit balance and cannot be deleted.',
    )
  }
  const creditIds = new Set(
    db.credits.filter((credit) => credit.customerId === id).map((credit) => credit.id),
  )
  db.payments = db.payments.filter((payment) => !creditIds.has(payment.creditId))
  db.credits = db.credits.filter((credit) => credit.customerId !== id)
  db.sales = db.sales.filter((sale) => sale.customerId !== id)
  db.customers.splice(index, 1)
  return id
}
