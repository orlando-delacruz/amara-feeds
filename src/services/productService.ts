import type { NewProductInput, Product, ProductId, ProductStatus } from '@/domain'
import { getDb } from './mocks/db'
import { nextId } from './mocks/ids'
import { isSupabaseConfigured, supabase } from './supabaseClient'
import { serviceErrorFromSupabase } from './userService'
import { ServiceError } from './errors'

export async function listProducts(filter: { status?: ProductStatus } = {}): Promise<Product[]> {
  if (isSupabaseConfigured && supabase) {
    let query = supabase.from('products').select('id, name, status, created_by_user_id, created_at')
    if (filter.status) {
      query = query.eq('status', filter.status)
    }
    const { data, error } = await query.order('name', { ascending: true })
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      status: row.status as ProductStatus,
      createdByUserId: row.created_by_user_id ?? undefined,
      createdAt: row.created_at,
    }))
  }
  const products = getDb().products
  const scoped = filter.status
    ? products.filter((product) => product.status === filter.status)
    : products
  return scoped.map((product) => ({ ...product }))
}

export async function getProduct(id: ProductId): Promise<Product> {
  const product = getDb().products.find((item) => item.id === id)
  if (!product) {
    throw new ServiceError('not_found', 'Product not found.')
  }
  return { ...product }
}

export async function createProduct(input: NewProductInput): Promise<Product> {
  const name = input.name.trim()
  if (!name) {
    throw new ServiceError('validation', 'Product name is required.')
  }
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc('submit_product', { p_name: name })
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    return {
      id: data?.product_id as string,
      name,
      status: 'pending',
      createdByUserId: input.createdByUserId,
      createdAt: new Date().toISOString(),
    }
  }
  const product: Product = {
    id: nextId('prod'),
    name,
    status: 'pending',
    createdByUserId: input.createdByUserId,
    createdAt: new Date().toISOString(),
  }
  getDb().products.push(product)
  return { ...product }
}

export async function approveProduct(id: ProductId): Promise<Product> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.rpc('approve_product', { p_product_id: id })
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    return { id, name: '', status: 'active', createdAt: new Date().toISOString() }
  }
  const product = getDb().products.find((item) => item.id === id)
  if (!product) {
    throw new ServiceError('not_found', 'Product not found.')
  }
  if (product.status !== 'pending') {
    throw new ServiceError('conflict', 'Only pending products can be approved.')
  }
  product.status = 'active'
  return { ...product }
}

export async function rejectProduct(id: ProductId): Promise<Product> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.rpc('reject_product', { p_product_id: id })
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    return { id, name: '', status: 'pending', createdAt: new Date().toISOString() }
  }
  const db = getDb()
  const index = db.products.findIndex((item) => item.id === id)
  if (index === -1) {
    throw new ServiceError('not_found', 'Product not found.')
  }
  const product = db.products[index]
  if (product.status !== 'pending') {
    throw new ServiceError('conflict', 'Only pending products can be rejected.')
  }
  const [removed] = db.products.splice(index, 1)
  return { ...removed }
}
