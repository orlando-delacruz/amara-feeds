import type { NewReceivingInput, ProductId, ReceivingRecord } from '@/domain'
import type { Money } from '@/lib/money'
import type { StoreId } from '@/domain'
import { getDb } from './mocks/db'
import { nextId } from './mocks/ids'
import { applyStockDelta } from './inventoryService'
import { assertActiveRecorder } from './userService'
import { isSupabaseConfigured, supabase } from './supabaseClient'
import { serviceErrorFromSupabase } from './userService'
import { ServiceError } from './errors'

export async function listReceiving(
  filter: { storeId?: StoreId; productId?: ProductId } = {},
): Promise<ReceivingRecord[]> {
  if (isSupabaseConfigured && supabase) {
    let query = supabase
      .from('receiving_records')
      .select(
        'id, store_id, product_id, quantity, supplier, cost_price_minor, selling_price_minor, rider_id, vehicle_id, recorded_by_user_id, received_at',
      )
    if (filter.storeId) {
      query = query.eq('store_id', filter.storeId)
    }
    if (filter.productId) {
      query = query.eq('product_id', filter.productId)
    }
    const { data, error } = await query.order('received_at', { ascending: false })
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    return (data ?? []).map((row) => ({
      id: row.id,
      storeId: row.store_id as StoreId,
      productId: row.product_id,
      quantity: row.quantity,
      supplier: row.supplier,
      costPriceMinor: row.cost_price_minor,
      sellingPriceMinor: row.selling_price_minor ?? undefined,
      riderId: row.rider_id ?? undefined,
      vehicleId: row.vehicle_id ?? undefined,
      recordedByUserId: row.recorded_by_user_id,
      receivedAt: row.received_at,
    }))
  }
  return getDb()
    .receiving.filter(
      (record) =>
        (!filter.storeId || record.storeId === filter.storeId) &&
        (!filter.productId || record.productId === filter.productId),
    )
    .map((record) => ({ ...record }))
}

/**
 * Returns the selling price per product for a store. A stock row's current
 * price (editable inventory, DEC-049) wins; rows without one fall back to
 * the latest priced receiving record (the automatic-price rule). Products
 * with neither are omitted.
 */
export async function listStorePrices(storeId: StoreId): Promise<Record<string, Money>> {
  if (isSupabaseConfigured && supabase) {
    const { data: stock, error: stockError } = await supabase
      .from('stock_levels')
      .select('product_id, price_minor')
      .eq('store_id', storeId)
    if (stockError) {
      throw serviceErrorFromSupabase(stockError)
    }
    const prices: Record<string, Money> = {}
    for (const row of stock ?? []) {
      if (row.price_minor !== null) {
        prices[row.product_id] = row.price_minor as Money
      }
    }
    const { data: receipts, error } = await supabase
      .from('receiving_records')
      .select('product_id, selling_price_minor, received_at')
      .eq('store_id', storeId)
      .not('selling_price_minor', 'is', null)
      .order('received_at', { ascending: false })
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    for (const row of receipts ?? []) {
      if (prices[row.product_id] === undefined) {
        prices[row.product_id] = row.selling_price_minor as Money
      }
    }
    return prices
  }
  const db = getDb()
  const prices: Record<string, Money> = {}
  for (const level of db.stock.filter((row) => row.storeId === storeId)) {
    if (level.priceMinor !== undefined) {
      prices[level.productId] = level.priceMinor
    }
  }
  const records = db.receiving
    .filter((record) => record.storeId === storeId && record.sellingPriceMinor !== undefined)
    .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
  for (const record of records) {
    if (prices[record.productId] === undefined) {
      prices[record.productId] = record.sellingPriceMinor as Money
    }
  }
  return prices
}

export async function createReceiving(input: NewReceivingInput): Promise<ReceivingRecord> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc('record_receiving', {
      p_store_id: input.storeId,
      p_product_id: input.productId,
      p_quantity: input.quantity,
      p_supplier: input.supplier,
      p_cost_price_minor: input.costPriceMinor,
      p_selling_price_minor: input.sellingPriceMinor ?? null,
      p_rider_id: input.riderId ?? null,
      p_vehicle_id: input.vehicleId ?? null,
    })
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    return {
      id: data?.receiving_id as string,
      storeId: input.storeId,
      productId: input.productId,
      quantity: input.quantity,
      supplier: input.supplier.trim(),
      costPriceMinor: input.costPriceMinor,
      sellingPriceMinor: input.sellingPriceMinor,
      riderId: input.riderId,
      vehicleId: input.vehicleId,
      recordedByUserId: input.recordedByUserId,
      receivedAt: new Date().toISOString(),
    }
  }
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
    ...(input.sellingPriceMinor !== undefined
      ? { sellingPriceMinor: input.sellingPriceMinor }
      : {}),
    ...(input.riderId ? { riderId: input.riderId } : {}),
    ...(input.vehicleId ? { vehicleId: input.vehicleId } : {}),
    recordedByUserId: input.recordedByUserId,
    receivedAt: new Date().toISOString(),
  }
  getDb().receiving.push(record)
  applyStockDelta(input.storeId, input.productId, input.quantity)
  // Receiving maintains the stock row's current selling price (DEC-049).
  if (input.sellingPriceMinor !== undefined) {
    const level = getDb().stock.find(
      (row) => row.storeId === input.storeId && row.productId === input.productId,
    )
    if (level) {
      level.priceMinor = input.sellingPriceMinor
    }
  }
  return { ...record }
}
