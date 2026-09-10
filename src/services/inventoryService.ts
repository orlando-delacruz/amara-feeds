import type { ProductId, StockLevel } from '@/domain'
import type { StoreId } from '@/domain'
import { getDb } from './mocks/db'

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
