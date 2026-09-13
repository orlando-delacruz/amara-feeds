import type { NewReceivingInput, ProductId, ReceivingRecord } from '@/domain'
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
  if (!input.riderId) {
    throw new ServiceError('validation', 'Delivery rider is required.')
  }
  if (!input.vehicleId) {
    throw new ServiceError('validation', 'Delivery vehicle is required.')
  }
  const rider = getDb().riders.find((r) => r.id === input.riderId && r.storeId === input.storeId)
  if (!rider || !rider.active) {
    throw new ServiceError('validation', 'Selected rider is not active at this store.')
  }
  const vehicle = getDb().vehicles.find(
    (v) => v.id === input.vehicleId && v.storeId === input.storeId,
  )
  if (!vehicle || !vehicle.active) {
    throw new ServiceError('validation', 'Selected vehicle is not active at this store.')
  }
  const record: ReceivingRecord = {
    id: nextId('recv'),
    storeId: input.storeId,
    productId: input.productId,
    quantity: input.quantity,
    supplier: input.supplier.trim(),
    costPriceMinor: input.costPriceMinor,
    riderId: input.riderId,
    vehicleId: input.vehicleId,
    recordedByUserId: input.recordedByUserId,
    receivedAt: new Date().toISOString(),
  }
  getDb().receiving.push(record)
  applyStockDelta(input.storeId, input.productId, input.quantity)
  return { ...record }
}
