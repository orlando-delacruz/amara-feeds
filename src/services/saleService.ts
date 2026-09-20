import type { CustomerId, NewSaleInput, Sale, SaleId } from '@/domain'
import type { StoreId } from '@/domain'
import type { Money } from '@/lib/money'
import { todayIso } from '@/lib/dates'
import { getDb } from './mocks/db'
import { nextId } from './mocks/ids'
import { applyStockDelta } from './inventoryService'
import { createObligationFromSale } from './creditService'
import { assertActiveRecorder } from './userService'
import { isSupabaseConfigured, supabase } from './supabaseClient'
import { serviceErrorFromSupabase } from './userService'
import { ServiceError } from './errors'

function cloneSale(sale: Sale): Sale {
  return { ...sale, lines: sale.lines.map((line) => ({ ...line })) }
}

function saleDay(sale: Sale): string {
  return sale.saleDate
}

export async function listSales(
  filter: {
    storeId?: StoreId
    date?: string
    from?: string
    to?: string
    customerId?: CustomerId
  } = {},
): Promise<Sale[]> {
  if (isSupabaseConfigured && supabase) {
    let query = supabase.from('sales').select(
      `id, store_id, sale_date, customer_id, payment_type, payment_method,
         delivery_fee_minor, delivery_rider_id, delivery_vehicle_id, discount_minor,
         total_minor, recorded_by_user_id, created_at,
         sale_lines(id, product_id, quantity, unit_price_minor)`,
    )
    if (filter.storeId) {
      query = query.eq('store_id', filter.storeId)
    }
    if (filter.customerId) {
      query = query.eq('customer_id', filter.customerId)
    }
    if (filter.date) {
      query = query.eq('sale_date', filter.date)
    }
    if (filter.from) {
      query = query.gte('sale_date', filter.from)
    }
    if (filter.to) {
      query = query.lte('sale_date', filter.to)
    }
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    return (data ?? []).map((row) => ({
      id: row.id,
      storeId: row.store_id as StoreId,
      saleDate: row.sale_date,
      customerId: row.customer_id ?? undefined,
      paymentType: row.payment_type as Sale['paymentType'],
      paymentMethod: row.payment_method ?? undefined,
      lines: (row.sale_lines ?? []).map((line: Record<string, unknown>) => ({
        productId: line.product_id as string,
        quantity: line.quantity as number,
        unitPriceMinor: line.unit_price_minor as Money,
      })),
      delivery:
        row.delivery_rider_id || row.delivery_vehicle_id || row.delivery_fee_minor > 0
          ? {
              feeMinor: row.delivery_fee_minor > 0 ? row.delivery_fee_minor : undefined,
              riderId: row.delivery_rider_id ?? undefined,
              vehicleId: row.delivery_vehicle_id ?? undefined,
            }
          : undefined,
      discountMinor: row.discount_minor > 0 ? row.discount_minor : undefined,
      totalMinor: row.total_minor,
      recordedByUserId: row.recorded_by_user_id,
      createdAt: row.created_at,
    }))
  }
  return getDb()
    .sales.filter(
      (sale) =>
        (!filter.storeId || sale.storeId === filter.storeId) &&
        (!filter.customerId || sale.customerId === filter.customerId) &&
        (!filter.date || saleDay(sale) === filter.date) &&
        (!filter.from || sale.saleDate >= filter.from) &&
        (!filter.to || sale.saleDate <= filter.to),
    )
    .map(cloneSale)
}

export async function getSale(id: SaleId): Promise<Sale> {
  const sale = getDb().sales.find((item) => item.id === id)
  if (!sale) {
    throw new ServiceError('not_found', 'Sale not found.')
  }
  return cloneSale(sale)
}

export async function createSale(input: NewSaleInput): Promise<Sale> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc('record_sale', {
      p_store_id: input.storeId,
      p_sale_date: input.saleDate?.trim() || todayIso(),
      p_customer_id: input.customerId ?? null,
      p_payment_type: input.paymentType,
      p_payment_method: input.paymentMethod?.trim() || null,
      p_delivery_fee_minor: input.delivery?.feeMinor ?? 0,
      p_delivery_rider_id: input.delivery?.riderId ?? null,
      p_delivery_vehicle_id: input.delivery?.vehicleId ?? null,
      p_discount_minor: input.discountMinor ?? 0,
      p_terms_id: input.termsId ?? null,
      p_lines: JSON.stringify(
        input.lines.map((line) => ({
          product_id: line.productId,
          quantity: line.quantity,
          unit_price_minor: line.unitPriceMinor,
        })),
      ),
    })
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    return {
      id: data?.sale_id as string,
      storeId: input.storeId,
      saleDate: input.saleDate?.trim() || todayIso(),
      customerId: input.customerId,
      paymentType: input.paymentType,
      paymentMethod: input.paymentMethod?.trim() || undefined,
      lines: input.lines.map((line) => ({ ...line })),
      delivery: input.delivery,
      discountMinor: input.discountMinor,
      totalMinor: (data?.total_minor as Money) ?? 0,
      recordedByUserId: input.recordedByUserId,
      createdAt: new Date().toISOString(),
    }
  }

  assertActiveRecorder(input.recordedByUserId)
  if (input.lines.length === 0) {
    throw new ServiceError('validation', 'A sale needs at least one item.')
  }
  for (const line of input.lines) {
    if (line.quantity <= 0) {
      throw new ServiceError('validation', 'Item quantity must be greater than zero.')
    }
    if (line.unitPriceMinor < 0) {
      throw new ServiceError('validation', 'Item price cannot be negative.')
    }
  }
  if (input.paymentMethod !== undefined && input.paymentMethod.trim().length === 0) {
    throw new ServiceError('validation', 'Payment method cannot be blank.')
  }
  const saleDate = input.saleDate?.trim() || todayIso()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(saleDate) || Number.isNaN(Date.parse(saleDate))) {
    throw new ServiceError('validation', 'Sale date must be a valid date.')
  }
  if (input.paymentType === 'charge') {
    if (!input.customerId) {
      throw new ServiceError('validation', 'A charge sale requires a customer.')
    }
    if (!input.termsId) {
      throw new ServiceError('validation', 'A charge sale requires payment terms.')
    }
  }

  const createdAt = new Date().toISOString()
  const lines = input.lines.map((line) => ({ ...line }))
  const itemsMinor = lines.reduce((total, line) => total + line.quantity * line.unitPriceMinor, 0)
  const deliveryFeeMinor = input.delivery?.feeMinor ?? 0
  const discountMinor: Money = input.discountMinor ?? 0
  if (discountMinor < 0) {
    throw new ServiceError('validation', 'Discount cannot be negative.')
  }
  if (discountMinor > itemsMinor + deliveryFeeMinor) {
    throw new ServiceError('validation', 'Discount cannot be more than the sale amount.')
  }
  const totalMinor = itemsMinor + deliveryFeeMinor - discountMinor

  const sale: Sale = {
    id: nextId('sale'),
    storeId: input.storeId,
    saleDate,
    customerId: input.customerId,
    paymentType: input.paymentType,
    paymentMethod: input.paymentMethod?.trim() || undefined,
    lines,
    delivery: input.delivery,
    discountMinor,
    totalMinor,
    recordedByUserId: input.recordedByUserId,
    createdAt,
  }

  getDb().sales.push(sale)
  for (const line of lines) {
    applyStockDelta(input.storeId, line.productId, -line.quantity)
  }
  if (input.paymentType === 'charge' && input.termsId && input.customerId) {
    createObligationFromSale({
      customerId: input.customerId,
      originStoreId: input.storeId,
      saleId: sale.id,
      termsId: input.termsId,
      amountMinor: totalMinor,
      saleDate,
      createdAt,
    })
  }

  return cloneSale(sale)
}
