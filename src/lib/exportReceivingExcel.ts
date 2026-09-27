import { storeNames } from '@/store/stores'
import type { StoreId } from '@/domain'
import type { ReceivingExcelRow } from '@/features/receiving/receivingReportRows'

/**
 * Excel export for the per-store Inventory report (DEC-060). Mirrors
 * exportReportExcel: lazy browser import, styled headers, blob download.
 * The rows are the store's receiving history as shown on the Receiving page.
 */

export interface ReceivingExcelInput {
  storeId: StoreId
  rows: ReceivingExcelRow[]
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

export function receivingExcelFilename(storeId: StoreId): string {
  return `zaf-one-inventory-${storeNames[storeId] ?? storeId}.xlsx`
}

export async function exportReceivingExcel(input: ReceivingExcelInput): Promise<void> {
  const writeExcelFile = (await import('write-excel-file/browser')).default

  const headerStyle = {
    fontWeight: 'bold' as const,
    backgroundColor: '#013c68',
    textColor: '#ffffff',
  }

  const columns = [
    { header: headerStyle, label: 'Date Added', width: 12 },
    { header: headerStyle, label: 'Store', width: 14 },
    { header: headerStyle, label: 'Item', width: 24 },
    { header: headerStyle, label: 'Quantity', width: 10 },
    { header: headerStyle, label: 'Supplier', width: 20 },
    { header: headerStyle, label: 'Cost Price', width: 12 },
    { header: headerStyle, label: 'Selling Price', width: 14 },
    { header: headerStyle, label: 'Recorded By', width: 16 },
  ]

  const sheet = [
    columns.map((col) => ({ value: col.label, ...col.header })),
    ...input.rows.map((row) => [
      { value: row.date, type: String },
      { value: storeNames[row.storeId] ?? row.storeId, type: String },
      { value: row.productName, type: String },
      { value: row.quantity, type: Number },
      { value: row.supplier, type: String },
      { value: row.costPriceMinor / 100, type: Number, format: '#,##0.00' },
      ...(row.sellingPriceMinor === undefined
        ? [{ value: '', type: String }]
        : [{ value: row.sellingPriceMinor / 100, type: Number, format: '#,##0.00' }]),
      { value: row.recordedByName, type: String },
    ]),
  ]

  const blob = await writeExcelFile([
    {
      data: sheet,
      sheet: 'Inventory',
      columns: columns.map((col) => ({ width: col.width })),
    },
  ] as unknown as Parameters<typeof writeExcelFile>[0]).toBlob()

  downloadBlob(blob, receivingExcelFilename(input.storeId))
}
