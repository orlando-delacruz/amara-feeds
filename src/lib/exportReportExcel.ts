import type { StoreId } from '@/domain'
import { storeNames } from '@/store/stores'

export interface ReportExcelInput {
  from: string
  to: string
  storeId?: StoreId
  rows: ReportExcelRow[]
}

export interface ReportExcelRow {
  date: string
  storeId: StoreId
  customerName: string
  productName: string
  quantity: number
  unitPriceMinor: number
  lineTotalMinor: number
  paymentType: string
  deliveryFeeMinor: number
  discountMinor: number
  netTotalMinor: number
  riderName: string
  vehiclePlate: string
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

export function reportExcelFilename(from: string, to: string, storeId?: StoreId): string {
  const scope = storeId ? storeNames[storeId] : 'both-stores'
  const range = from === to ? from : `${from}-to-${to}`
  return `amara-feeds-report-${range}-${scope}.xlsx`
}

export async function exportReportExcel(input: ReportExcelInput): Promise<void> {
  const writeExcelFile = (await import('write-excel-file/browser')).default

  const headerStyle = {
    fontWeight: 'bold' as const,
    backgroundColor: '#1d3a2f',
    textColor: '#ffffff',
  }

  const columns = [
    { header: headerStyle, label: 'Date', width: 12 },
    { header: headerStyle, label: 'Location', width: 14 },
    { header: headerStyle, label: 'Customer', width: 20 },
    { header: headerStyle, label: 'Item', width: 24 },
    { header: headerStyle, label: 'Quantity', width: 10 },
    { header: headerStyle, label: 'Price', width: 12 },
    { header: headerStyle, label: 'Amount', width: 12 },
    { header: headerStyle, label: 'Type', width: 10 },
    { header: headerStyle, label: 'Delivery Fee', width: 14 },
    { header: headerStyle, label: 'Discount', width: 12 },
    { header: headerStyle, label: 'Net', width: 12 },
    { header: headerStyle, label: 'Rider', width: 16 },
    { header: headerStyle, label: 'Vehicle', width: 12 },
  ]

  const sheetData = [
    columns.map((col) => ({ value: col.label, ...col.header })),
    ...input.rows.map((row) => [
      { value: row.date, type: String },
      { value: storeNames[row.storeId] ?? row.storeId, type: String },
      { value: row.customerName, type: String },
      { value: row.productName, type: String },
      { value: row.quantity, type: Number },
      { value: row.unitPriceMinor / 100, type: Number, format: '#,##0.00' },
      { value: row.lineTotalMinor / 100, type: Number, format: '#,##0.00' },
      { value: row.paymentType, type: String },
      { value: row.deliveryFeeMinor / 100, type: Number, format: '#,##0.00' },
      { value: row.discountMinor / 100, type: Number, format: '#,##0.00' },
      { value: row.netTotalMinor / 100, type: Number, format: '#,##0.00' },
      { value: row.riderName, type: String },
      { value: row.vehiclePlate, type: String },
    ]),
  ]

  const blob = await writeExcelFile(sheetData, {
    columns: columns.map((col) => ({ width: col.width })),
  }).toBlob()

  downloadBlob(blob, reportExcelFilename(input.from, input.to, input.storeId))
}
