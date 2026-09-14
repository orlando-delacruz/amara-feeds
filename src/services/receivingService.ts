import type { NewReceivingInput, ProductId, ReceivingRecord } from '@/domain'
import type { Money } from '@/lib/money'
import type { StoreId } from '@/domain'
import { getDb } from './mocks/db'
import { nextId } from './mocks/ids'
import { applyStockDelta } from './inventoryService'
import { assertActiveRecorder } from './userService'
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

/**
 * Returns the automatic selling price per product for a store, taken from the
 * selling price of that product's most recent receiving record at the store.
 * Products never received at the store are omitted (they have no price).
 */
export async function listStorePrices(storeId: StoreId): Promise<Record<string, Money>> {
  const records = getDb().receiving
    .filter((record) => record.storeId === storeId && record.sellingPriceMinor !== undefined)
    .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
  const prices: Record<string, Money> = {}
  for (const record of records) {
    if (prices[record.productId] === undefined) {
      prices[record.productId] = record.sellingPriceMinor as Money
    }
  }
  return prices
}

export async function createReceiving(input: NewReceivingInput): Promise<ReceivingRecord> {
  assertActiveRecorder(input.recordedByUserId)
  if (input.quantity <= 0) {
    throw new ServiceError('validation', 'Received quantity must be greater than zero.')
  }
  if (!input.supplier.trim()) {
    throw new ServiceError('validation', 'Supplier is required.')
  }
  if (input.costPriceMinor < 0) {
    throw new ServiceError('validation', 'Cost price cannot be negative.')
  }
  if (input.sellingPriceMinor !== undefined && input.sellingPriceMinor < 0) {
    throw new ServiceError('validation', 'Selling price cannot be negative.')
  }
  // Rider/vehicle are legacy-only: validated when provided so old records and
  // old callers stay checked, but never required on new receipts.
  if (input.riderId) {
    const rider = getDb().riders.find((r) => r.id === input.riderId && r.storeId === input.storeId)
    if (!rider || !rider.active) {
      throw new ServiceError('validation', 'Selected rider is not active at this store.')
    }
  }
  if (input.vehicleId) {
    const vehicle = getDb().vehicles.find(
      (v) => v.id === input.vehicleId && v.storeId === input.storeId,
    )
    if (!vehicle || !vehicle.active) {
      throw new ServiceError('validation', 'Selected vehicle is not active at this store.')
    }
  }
  const record: ReceivingRecord = {
    id: nextId('recv'),
    storeId: input.storeId,
    productId: input.productId,
    quantity: input.quantity,
    supplier: input.supplier.trim(),
    costPriceMinor: input.costPriceMinor,
    ...(input.sellingPriceMinor !== undefined ? { sellingPriceMinor: input.sellingPriceMinor } : {}),
    ...(input.riderId ? { riderId: input.riderId } : {}),
    ...(input.vehicleId ? { vehicleId: input.vehicleId } : {}),
    recordedByUserId: input.recordedByUserId,
    receivedAt: new Date().toISOString(),
  }
  getDb().receiving.push(record)
  applyStockDelta(input.storeId, input.productId, input.quantity)
  return { ...record }
}
