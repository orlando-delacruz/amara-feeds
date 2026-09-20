import type { ProductId, StockLevel, UserRole } from '@/domain'
import type { StoreId } from '@/domain'
import { getDb } from './mocks/db'
import { logAuditEvent } from './auditService'
import { isSupabaseConfigured, supabase } from './supabaseClient'
import { serviceErrorFromSupabase } from './userService'
import { ServiceError } from './errors'

export async function listStock(
  filter: { storeId?: StoreId; productId?: ProductId } = {},
): Promise<StockLevel[]> {
  if (isSupabaseConfigured && supabase) {
    let query = supabase.from('stock_levels').select('store_id, product_id, quantity')
    if (filter.storeId) {
      query = query.eq('store_id', filter.storeId)
    }
    if (filter.productId) {
      query = query.eq('product_id', filter.productId)
    }
    const { data, error } = await query
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    return (data ?? []).map((row) => ({
      storeId: row.store_id as StoreId,
      productId: row.product_id,
      quantity: row.quantity,
    }))
  }
  return getDb()
    .stock.filter(
      (level) =>
        (!filter.storeId || level.storeId === filter.storeId) &&
        (!filter.productId || level.productId === filter.productId),
    )
    .map((level) => ({ ...level }))
}

export async function getStock(storeId: StoreId, productId: ProductId): Promise<StockLevel> {
  const level = getDb().stock.find(
    (item) => item.storeId === storeId && item.productId === productId,
  )
  return level ? { ...level } : { storeId, productId, quantity: 0 }
}

export function applyStockDelta(storeId: StoreId, productId: ProductId, delta: number): void {
  const db = getDb()
  let level = db.stock.find((item) => item.storeId === storeId && item.productId === productId)
  if (!level) {
    level = { storeId, productId, quantity: 0 }
    db.stock.push(level)
  }
  level.quantity += delta
}

export interface UpdateStockInput {
  /** New absolute quantity for the row. */
  quantity: number
  actorUserId: string
  actorRole: UserRole
}

export interface UpdateStockResult {
  /** Row state after the update. Missing rows stay missing at quantity 0. */
  level: StockLevel
  previousQuantity: number
}

/**
 * Manual stock correction. Sets the absolute quantity for a product at a
 * store; rows are created when the row never existed or was deleted.
 */
export async function updateStock(
  storeId: StoreId,
  productId: ProductId,
  input: UpdateStockInput,
): Promise<UpdateStockResult> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.rpc('adjust_stock', {
      p_store_id: storeId,
      p_product_id: productId,
      p_quantity: input.quantity,
    })
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    return {
      level: { storeId, productId, quantity: input.quantity },
      previousQuantity: input.quantity,
    }
  }
  const db = getDb()
  if (!Number.isInteger(input.quantity) || input.quantity < 0) {
    throw new ServiceError('validation', 'Quantity must be a whole number of 0 or more.')
  }
  const level = getStockRow(storeId, productId)
  const previousQuantity = level?.quantity ?? 0
  if (!level) {
    if (input.quantity === 0) {
      return { level: { storeId, productId, quantity: 0 }, previousQuantity }
    }
    db.stock.push({ storeId, productId, quantity: input.quantity })
  } else {
    level.quantity = input.quantity
  }

  await logAuditEvent({
    action: 'stock.updated',
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    storeId,
    subject: db.products.find((product) => product.id === productId)?.name ?? 'Item',
    detail: `Adjusted from ${previousQuantity} to ${input.quantity}`,
  })

  return {
    level: { storeId, productId, quantity: input.quantity },
    previousQuantity,
  }
}

/**
 * Removes a stock row. Products with any sale at the store are kept, so sale
 * history stays coherent — set the quantity to 0 instead.
 */
export async function deleteStock(
  storeId: StoreId,
  productId: ProductId,
  _actor: { userId: string; role: UserRole },
): Promise<StockLevel> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.rpc('delete_stock', {
      p_store_id: storeId,
      p_product_id: productId,
    })
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    return { storeId, productId, quantity: 0 }
  }
  const db = getDb()
  const index = db.stock.findIndex((row) => row.storeId === storeId && row.productId === productId)
  if (index === -1) {
    throw new ServiceError('not_found', 'Stock not found.')
  }
  const hasSales = db.sales.some(
    (sale) => sale.storeId === storeId && sale.lines.some((line) => line.productId === productId),
  )
  if (hasSales) {
    throw new ServiceError(
      'conflict',
      'This item already has sales at this store. Set the quantity to 0 instead.',
    )
  }
  const [removed] = db.stock.splice(index, 1)

  await logAuditEvent({
    action: 'stock.deleted',
    actorUserId: _actor.userId,
    actorRole: _actor.role,
    storeId,
    subject: db.products.find((product) => product.id === productId)?.name ?? 'Item',
    detail: `Removed with ${removed.quantity} on hand`,
  })

  return { ...removed }
}

function getStockRow(storeId: StoreId, productId: ProductId): StockLevel | undefined {
  return getDb().stock.find((row) => row.storeId === storeId && row.productId === productId)
}
