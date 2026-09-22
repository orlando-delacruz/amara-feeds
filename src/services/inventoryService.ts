import type { ProductId, StockLevel, UserRole } from '@/domain'
import type { StoreId } from '@/domain'
import type { Money } from '@/lib/money'
import { getDb } from './mocks/db'
import { logAuditEvent } from './auditService'
import { isSupabaseConfigured, supabase } from './supabaseClient'
import { serviceErrorFromSupabase } from './userService'
import { ServiceError } from './errors'

export async function listStock(
  filter: { storeId?: StoreId; productId?: ProductId } = {},
): Promise<StockLevel[]> {
  if (isSupabaseConfigured && supabase) {
    let query = supabase
      .from('stock_levels')
      .select('store_id, product_id, quantity, admin_approved, price_minor')
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
      adminApproved: row.admin_approved ?? false,
      priceMinor: row.price_minor ?? undefined,
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
  /** New current selling price; omitted leaves the existing price untouched. */
  priceMinor?: Money
  actorUserId: string
  actorRole: UserRole
}

export interface UpdateStockResult {
  /** Row state after the update. Missing rows stay missing at quantity 0. */
  level: StockLevel
  previousQuantity: number
}

/**
 * Manual stock correction. Sets the absolute quantity (and optionally the
 * store's current selling price) for a product at a store; rows are created
 * when the row never existed or was deleted.
 */
export async function updateStock(
  storeId: StoreId,
  productId: ProductId,
  input: UpdateStockInput,
): Promise<UpdateStockResult> {
  if (isSupabaseConfigured && supabase) {
    // Read the current row first: adjust_stock does not return the previous
    // quantity, and the caller uses it for its from→to feedback.
    const { data: previous, error: previousError } = await supabase
      .from('stock_levels')
      .select('quantity')
      .eq('store_id', storeId)
      .eq('product_id', productId)
      .maybeSingle()
    if (previousError) {
      throw serviceErrorFromSupabase(previousError)
    }
    const { error } = await supabase.rpc('adjust_stock', {
      p_store_id: storeId,
      p_product_id: productId,
      p_quantity: input.quantity,
      p_price_minor: input.priceMinor ?? null,
    })
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    return {
      level: {
        storeId,
        productId,
        quantity: input.quantity,
        ...(input.priceMinor !== undefined ? { priceMinor: input.priceMinor } : {}),
      },
      previousQuantity: previous?.quantity ?? 0,
    }
  }
  const db = getDb()
  if (!Number.isInteger(input.quantity) || input.quantity < 0) {
    throw new ServiceError('validation', 'Quantity must be a whole number of 0 or more.')
  }
  if (input.priceMinor !== undefined && input.priceMinor < 0) {
    throw new ServiceError('validation', 'Price cannot be negative.')
  }
  const level = getStockRow(storeId, productId)
  const previousQuantity = level?.quantity ?? 0
  // Inventory correction is admin-only (DEC-050, superseding DEC-032).
  if (input.actorRole !== 'admin') {
    throw new ServiceError('validation', 'Only admins can correct inventory.')
  }
  if (!level) {
    if (input.quantity === 0) {
      return {
        level: {
          storeId,
          productId,
          quantity: 0,
          ...(input.priceMinor !== undefined ? { priceMinor: input.priceMinor } : {}),
        },
        previousQuantity,
      }
    }
    db.stock.push({
      storeId,
      productId,
      quantity: input.quantity,
      ...(input.priceMinor !== undefined ? { priceMinor: input.priceMinor } : {}),
    })
  } else {
    level.quantity = input.quantity
    if (input.priceMinor !== undefined) {
      level.priceMinor = input.priceMinor
    }
  }

  await logAuditEvent({
    action: 'stock.updated',
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    storeId,
    subject: db.products.find((product) => product.id === productId)?.name ?? 'Item',
    detail:
      `Adjusted from ${previousQuantity} to ${input.quantity}` +
      (input.priceMinor !== undefined
        ? ` · price set to ${(input.priceMinor / 100).toFixed(2)}`
        : ''),
  })

  return {
    level: {
      storeId,
      productId,
      quantity: input.quantity,
      ...(input.priceMinor !== undefined ? { priceMinor: input.priceMinor } : {}),
    },
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
  // Inventory correction is admin-only (DEC-050, superseding DEC-032).
  if (_actor.role !== 'admin') {
    throw new ServiceError('validation', 'Only admins can correct inventory.')
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

/**
 * Admin-only approval of a stock row: approved rows remain admin-managed;
 * staff edits are refused outright (DEC-050 makes ALL correction admin-only).
 * Receiving into an approved row stays allowed.
 */
export async function approveStock(
  storeId: StoreId,
  productId: ProductId,
  actor: { userId: string; role: UserRole },
): Promise<StockLevel> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.rpc('approve_stock', {
      p_store_id: storeId,
      p_product_id: productId,
    })
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    const { data } = await supabase
      .from('stock_levels')
      .select('quantity, price_minor')
      .eq('store_id', storeId)
      .eq('product_id', productId)
      .maybeSingle()
    return {
      storeId,
      productId,
      quantity: data?.quantity ?? 0,
      priceMinor: data?.price_minor ?? undefined,
      adminApproved: true,
    }
  }
  const row = getStockRow(storeId, productId)
  if (!row) {
    throw new ServiceError('not_found', 'Stock not found.')
  }
  if (actor.role !== 'admin') {
    throw new ServiceError('validation', 'Only admins can approve inventory.')
  }
  row.adminApproved = true
  await logAuditEvent({
    action: 'stock.approved',
    actorUserId: actor.userId,
    actorRole: actor.role,
    storeId,
    subject: getDb().products.find((product) => product.id === productId)?.name ?? 'Item',
    detail: 'Inventory approved — staff edits locked',
  })
  return { ...row }
}
