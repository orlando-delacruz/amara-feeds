import { listProducts, listReceiving, listUsers } from '@/services'
import type { StoreId } from '@/domain'
import { toDateOnly } from '@/lib/dates'
import { getDisplayName } from '@/features/session/displayName'

/**
 * One row per stock receipt for the per-store Inventory Excel export
 * (DEC-060): the receiving history as shown on the Receiving page, newest
 * first. Names are resolved at build time so the file reads standalone.
 */
export interface ReceivingExcelRow {
  date: string
  storeId: StoreId
  productName: string
  quantity: number
  supplier: string
  costPriceMinor: number
  sellingPriceMinor?: number
  recordedByName: string
}

export async function buildReceivingReportRows(storeId: StoreId): Promise<ReceivingExcelRow[]> {
  const [records, products, users] = await Promise.all([
    listReceiving({ storeId }),
    listProducts(),
    listUsers(),
  ])
  const productNames = new Map(products.map((product) => [product.id, product.name]))
  const userNames = new Map(users.map((user) => [user.id, getDisplayName(user.name)]))

  // Newest first on both backends: the database orders by received_at, the
  // mock returns insertion order, so the export sorts either way (same class
  // of guarantee as the DEC-058 customer ordering).
  const ordered = [...records].sort((a, b) =>
    a.receivedAt < b.receivedAt ? 1 : a.receivedAt > b.receivedAt ? -1 : 0,
  )
  return ordered.map((record) => ({
    date: toDateOnly(new Date(record.receivedAt)),
    storeId: record.storeId,
    productName: productNames.get(record.productId) ?? 'Not available',
    quantity: record.quantity,
    supplier: record.supplier,
    costPriceMinor: record.costPriceMinor,
    sellingPriceMinor: record.sellingPriceMinor,
    recordedByName: userNames.get(record.recordedByUserId) ?? 'Not available',
  }))
}
