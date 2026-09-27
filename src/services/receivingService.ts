import type { NewReceivingInput, ProductId, ReceivingRecord, ReceivingStatus } from '@/domain'
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
  filter: { storeId?: StoreId; productId?: ProductId; status?: ReceivingStatus } = {},
): Promise<ReceivingRecord[]> {
  if (isSupabaseConfigured && supabase) {
    let query = supabase
      .from('receiving_records')
      .select(
        'id, store_id, product_id, quantity, supplier, cost_price_minor, selling_price_minor, rider_id, vehicle_id, recorded_by_user_id, received_at, status',
      )
    if (filter.storeId) {
      query = query.eq('store_id', filter.storeId)
    }
    if (filter.productId) {
      query = query.eq('product_id', filter.productId)
    }
    if (filter.status) {
      query = query.eq('status', filter.status)
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
      status: row.status as ReceivingStatus,
    }))
  }
  return getDb()
    .receiving.filter(
      (record) =>
        (!filter.storeId || record.storeId === filter.storeId) &&
        (!filter.productId || record.productId === filter.productId) &&
        (!filter.status || record.status === filter.status),
    )
    .map((record) => ({ ...record }))
}

/**
 * Returns the selling price per product for a store. A stock row's current
 * price (editable inventory, DEC-049) wins; rows without one fall back to
 * the latest priced receiving record (the automatic-price rule). Only
 * approved receipts feed prices (DEC-060) — pending rows must not price
 * sales. Products with neither are omitted.
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
      .eq('status', 'approved')
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
    .filter(
      (record) =>
        record.storeId === storeId &&
        record.status === 'approved' &&
        record.sellingPriceMinor !== undefined,
    )
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
      // Pending by default (DEC-060): inventory moves only on admin approval.
      status: 'pending' as ReceivingStatus,
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
    // Pending by default (DEC-060): stock and price move only on approval.
    status: 'pending',
  }
  getDb().receiving.push(record)
  return { ...record }
}

/**
 * Applies a receipt's quantity (and selling price, when present) to inventory
 * exactly once: only pending receipts move, and the status flip + delta share
 * the call so approval can never double-count. Mirrors approve_receipt.
 */
function applyReceiptApproval(record: ReceivingRecord): void {
  if (record.status !== 'pending') {
    throw new ServiceError(
      'conflict',
      record.status === 'approved'
        ? 'This receipt was already approved.'
        : 'Only pending receipts can be reviewed.',
    )
  }
  applyStockDelta(record.storeId, record.productId, record.quantity)
  if (record.sellingPriceMinor !== undefined) {
    const level = getDb().stock.find(
      (row) => row.storeId === record.storeId && row.productId === record.productId,
    )
    if (level) {
      level.priceMinor = record.sellingPriceMinor
    }
  }
  record.status = 'approved'
}

export async function approveReceipt(id: string): Promise<string> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.rpc('approve_receipt', { p_receipt_id: id })
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    return id
  }
  const db = getDb()
  const record = db.receiving.find((item) => item.id === id)
  if (!record) {
    throw new ServiceError('not_found', 'Receipt not found.')
  }
  applyReceiptApproval(record)
  return id
}

export async function rejectReceipt(id: string): Promise<string> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.rpc('reject_receipt', { p_receipt_id: id })
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    return id
  }
  const db = getDb()
  const record = db.receiving.find((item) => item.id === id)
  if (!record) {
    throw new ServiceError('not_found', 'Receipt not found.')
  }
  if (record.status !== 'pending') {
    throw new ServiceError('conflict', 'Only pending receipts can be reviewed.')
  }
  record.status = 'rejected'
  return id
}
