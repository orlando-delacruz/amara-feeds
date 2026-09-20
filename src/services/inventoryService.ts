import type { ProductId, StockLevel, UserRole } from '@/domain'
import type { StoreId } from '@/domain'
import { getDb } from './mocks/db'
import { logAuditEvent } from './auditService'
import { ServiceError } from './errors'

export async function listStock(
  filter: { storeId?: StoreId; productId?: ProductId } = {},
): Promise<StockLevel[]> {
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

  const productName = db.products.find((product) => product.id === productId)?.name ?? 'Item'
  await logAuditEvent({
    action: 'stock.updated',
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    storeId,
    subject: productName,
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
  actor: { userId: string; role: UserRole },
): Promise<StockLevel> {
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

  const productName = db.products.find((product) => product.id === productId)?.name ?? 'Item'
  await logAuditEvent({
    action: 'stock.deleted',
    actorUserId: actor.userId,
    actorRole: actor.role,
    storeId,
    subject: productName,
    detail: `Removed with ${removed.quantity} on hand`,
  })

  return { ...removed }
}

function getStockRow(storeId: StoreId, productId: ProductId): StockLevel | undefined {
  return getDb().stock.find((row) => row.storeId === storeId && row.productId === productId)
}
