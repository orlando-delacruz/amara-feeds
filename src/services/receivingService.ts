import type { NewReceivingInput, ProductId, ReceivingRecord } from '@/domain'
import type { StoreId } from '@/domain'
import { getDb } from './mocks/db'
import { nextId } from './mocks/ids'
import { applyStockDelta } from './inventoryService'
import { ServiceError } from './errors'

export async function listReceiving(
  filter: { storeId?: StoreId; productId?: ProductId } = {},
): Promise<ReceivingRecord[]> {
  return getDb()
    .receiving.filter(
      (record) =>
        (!filter.storeId || record.storeId === filter.storeId) &&
        (!filter.productId || record.productId === filter.productId),
    )
    .map((record) => ({ ...record }))
}

export async function createReceiving(input: NewReceivingInput): Promise<ReceivingRecord> {
  if (input.quantity <= 0) {
    throw new ServiceError('validation', 'Received quantity must be greater than zero.')
  }
  if (!input.supplier.trim()) {
    throw new ServiceError('validation', 'Supplier is required.')
  }
  if (input.costPriceMinor < 0) {
    throw new ServiceError('validation', 'Cost price cannot be negative.')
  }
  const record: ReceivingRecord = {
    id: nextId('recv'),
    storeId: input.storeId,
    productId: input.productId,
    quantity: input.quantity,
    supplier: input.supplier.trim(),
    costPriceMinor: input.costPriceMinor,
    receivedAt: new Date().toISOString(),
  }
  getDb().receiving.push(record)
  applyStockDelta(input.storeId, input.productId, input.quantity)
  return { ...record }
}
