import type { StoreId } from '@/domain'
import { storeNames } from '@/store/stores'
import type { CreditExcelRow, ExpenseExcelRow } from '@/features/reports/reportRows'

export interface ReportExcelInput {
  from: string
  to: string
  storeId?: StoreId
  rows: ReportExcelRow[]
  creditRows?: CreditExcelRow[]
  expenseRows?: ExpenseExcelRow[]
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
  paymentMethod: string
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
  return `zaf-one-report-${range}-${scope}.xlsx`
}

export async function exportReportExcel(input: ReportExcelInput): Promise<void> {
  const writeExcelFile = (await import('write-excel-file/browser')).default

  const headerStyle = {
    fontWeight: 'bold' as const,
    backgroundColor: '#013c68',
    textColor: '#ffffff',
  }

  const salesColumns = [
    { header: headerStyle, label: 'Date', width: 12 },
    { header: headerStyle, label: 'Location', width: 14 },
    { header: headerStyle, label: 'Customer', width: 20 },
    { header: headerStyle, label: 'Item', width: 24 },
    { header: headerStyle, label: 'Quantity', width: 10 },
    { header: headerStyle, label: 'Price', width: 12 },
    { header: headerStyle, label: 'Amount', width: 12 },
    { header: headerStyle, label: 'Type', width: 10 },
    { header: headerStyle, label: 'Mode of Payment', width: 16 },
    { header: headerStyle, label: 'Delivery Fee', width: 14 },
    { header: headerStyle, label: 'Discount', width: 12 },
    { header: headerStyle, label: 'Net', width: 12 },
    { header: headerStyle, label: 'Rider', width: 16 },
    { header: headerStyle, label: 'Vehicle', width: 12 },
  ]

  const creditColumns = [
    { header: headerStyle, label: 'Customer', width: 20 },
    { header: headerStyle, label: 'Origin Store', width: 14 },
    { header: headerStyle, label: 'Created', width: 12 },
    { header: headerStyle, label: 'Due Date', width: 12 },
    { header: headerStyle, label: 'Original', width: 12 },
    { header: headerStyle, label: 'Paid', width: 12 },
    { header: headerStyle, label: 'Balance', width: 12 },
    { header: headerStyle, label: 'Status', width: 12 },
  ]

  const salesSheet = [
    salesColumns.map((col) => ({ value: col.label, ...col.header })),
    ...input.rows.map((row) => [
      { value: row.date, type: String },
      { value: storeNames[row.storeId] ?? row.storeId, type: String },
      { value: row.customerName, type: String },
      { value: row.productName, type: String },
      { value: row.quantity, type: Number },
      { value: row.unitPriceMinor / 100, type: Number, format: '#,##0.00' },
      { value: row.lineTotalMinor / 100, type: Number, format: '#,##0.00' },
      { value: row.paymentType, type: String },
      { value: row.paymentMethod, type: String },
      { value: row.deliveryFeeMinor / 100, type: Number, format: '#,##0.00' },
      { value: row.discountMinor / 100, type: Number, format: '#,##0.00' },
      { value: row.netTotalMinor / 100, type: Number, format: '#,##0.00' },
      { value: row.riderName, type: String },
      { value: row.vehiclePlate, type: String },
    ]),
  ]

  const creditRows = input.creditRows ?? []
  const creditSheet = [
    creditColumns.map((col) => ({ value: col.label, ...col.header })),
    ...creditRows.map((row) => [
      { value: row.customerName, type: String },
      { value: storeNames[row.originStoreId] ?? row.originStoreId, type: String },
      { value: row.createdDate, type: String },
      { value: row.dueDate, type: String },
      { value: row.originalMinor / 100, type: Number, format: '#,##0.00' },
      { value: row.paidMinor / 100, type: Number, format: '#,##0.00' },
      { value: row.balanceMinor / 100, type: Number, format: '#,##0.00' },
      { value: row.status, type: String },
    ]),
  ]

  const expenseColumns = [
    { header: headerStyle, label: 'Date', width: 12 },
    { header: headerStyle, label: 'Location', width: 14 },
    { header: headerStyle, label: 'Fuel', width: 12 },
    { header: headerStyle, label: 'Repair', width: 12 },
    { header: headerStyle, label: 'Total', width: 12 },
  ]

  const expenseRows = input.expenseRows ?? []
  const expenseSheet = [
    expenseColumns.map((col) => ({ value: col.label, ...col.header })),
    ...expenseRows.map((row) => [
      { value: row.date, type: String },
      { value: storeNames[row.storeId] ?? row.storeId, type: String },
      { value: row.fuelMinor / 100, type: Number, format: '#,##0.00' },
      { value: row.repairMinor / 100, type: Number, format: '#,##0.00' },
      { value: row.totalMinor / 100, type: Number, format: '#,##0.00' },
    ]),
  ]

  const columnsWidth = (cols: Array<{ width: number }>) => cols.map((col) => ({ width: col.width }))

  // Multi-sheet shape per write-excel-file's docs: one { data, sheet, columns } per tab.
  const salesTab = { data: salesSheet, sheet: 'Sales', columns: columnsWidth(salesColumns) }
  const creditTab = { data: creditSheet, sheet: 'Credit', columns: columnsWidth(creditColumns) }
  const expenseTab = {
    data: expenseSheet,
    sheet: 'Expenses',
    columns: columnsWidth(expenseColumns),
  }
  const conditionalSheets = input.expenseRows
    ? [salesTab, creditTab, expenseTab]
    : input.creditRows
      ? [salesTab, creditTab]
      : [salesTab]

  const blob = await writeExcelFile(
    conditionalSheets as unknown as Parameters<typeof writeExcelFile>[0],
  ).toBlob()

  downloadBlob(blob, reportExcelFilename(input.from, input.to, input.storeId))
}
