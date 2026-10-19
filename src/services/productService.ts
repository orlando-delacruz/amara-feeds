import type { NewProductInput, Product, ProductId, ProductStatus, UserRole } from '@/domain'
import { getDb } from './mocks/db'
import { nextId } from './mocks/ids'
import { isSupabaseConfigured, supabase } from './supabaseClient'
import { logAuditEvent } from './auditService'
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
    return { id, name: '', status: 'rejected', createdAt: new Date().toISOString() }
  }
  const product = getDb().products.find((item) => item.id === id)
  if (!product) {
    throw new ServiceError('not_found', 'Product not found.')
  }
  if (product.status !== 'pending') {
    throw new ServiceError('conflict', 'Only pending products can be rejected.')
  }
  // Soft reject (DEC-051): the record stays (receiving/stock history intact)
  // and disappears from the pending list and catalog via status filters.
  product.status = 'rejected'
  return { ...product }
}

/**
 * Admin-only rename of an item. products.name is the single name behind both
 * the inventory row and the sale catalog, so this is a global correction —
 * reached from the inventory page, which is itself admin-only (DEC-050).
 * Active-name uniqueness mirrors submit_product (DEC-047 M6).
 */
export async function renameProduct(
  id: ProductId,
  name: string,
  actor: { userId: string; role: UserRole },
): Promise<string> {
  const trimmed = name.trim()
  if (!trimmed) {
    throw new ServiceError('validation', 'Item name is required.')
  }
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.rpc('update_product', {
      p_product_id: id,
      p_name: trimmed,
    })
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    return trimmed
  }
  const db = getDb()
  const product = db.products.find((item) => item.id === id)
  if (!product) {
    throw new ServiceError('not_found', 'Product not found.')
  }
  if (actor.role !== 'admin') {
    throw new ServiceError('validation', 'Only admins can rename an item.')
  }
  const previous = product.name
  if (previous.toLowerCase() === trimmed.toLowerCase()) {
    return previous
  }
  const clash = db.products.some(
    (item) =>
      item.id !== id &&
      item.status === 'active' &&
      item.name.toLowerCase() === trimmed.toLowerCase(),
  )
  if (clash) {
    throw new ServiceError('conflict', 'That name is already taken by an active item.')
  }
  product.name = trimmed
  await logAuditEvent({
    action: 'product.renamed',
    actorUserId: actor.userId,
    actorRole: actor.role,
    subject: trimmed,
    detail: `Renamed from ${previous}`,
  })
  return trimmed
}
