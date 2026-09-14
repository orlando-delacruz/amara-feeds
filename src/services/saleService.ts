import type { CustomerId, NewSaleInput, Sale, SaleId } from '@/domain'
import type { StoreId } from '@/domain'
import type { Money } from '@/lib/money'
import { todayIso } from '@/lib/dates'
import { getDb } from './mocks/db'
import { nextId } from './mocks/ids'
import { applyStockDelta } from './inventoryService'
import { createObligationFromSale } from './creditService'
import { assertActiveRecorder } from './userService'
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
