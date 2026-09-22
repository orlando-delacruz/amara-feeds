import { storeNames } from '@/store/stores'
import type { StoreId } from '@/domain'
import type { ExpenseDateEntry } from '@/features/expenses/expenseImport'
import { EXPENSE_IMPORT_HEADERS } from '@/features/expenses/expenseImport'

/**
 * Excel export for the Expenses date summary (DEC-054). Mirrors
 * exportReportExcel: lazy browser import, styled headers, blob download.
 * The summary is built from an imported file, never from stored records.
 */

export interface ExpenseSummaryExcelInput {
  storeId: StoreId
  entries: ExpenseDateEntry[]
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

export function expenseSummaryFilename(storeId: StoreId, entries: ExpenseDateEntry[]): string {
  const scope = storeNames[storeId] ?? storeId
  const dates = entries.map((entry) => entry.date).sort()
  const first = dates[0] ?? 'empty'
  const last = dates[dates.length - 1] ?? 'empty'
  const range = first === last ? first : `${first}-to-${last}`
  return `zaf-one-expense-summary-${range}-${scope}.xlsx`
}

export async function exportExpenseSummaryExcel(input: ExpenseSummaryExcelInput): Promise<void> {
  const writeExcelFile = (await import('write-excel-file/browser')).default

  const headerStyle = {
    fontWeight: 'bold' as const,
    backgroundColor: '#013c68',
    textColor: '#ffffff',
  }

  const sheet = [
    EXPENSE_SUMMARY_HEADERS.map((label) => ({ value: label, ...headerStyle })),
    ...input.entries.map((entry) => [
      { value: entry.date, type: String },
      { value: entry.fuelMinor / 100, type: Number, format: '#,##0.00' },
      { value: entry.repairMinor / 100, type: Number, format: '#,##0.00' },
      { value: entry.totalMinor / 100, type: Number, format: '#,##0.00' },
    ]),
  ]

  const blob = await writeExcelFile([
    {
      data: sheet,
      sheet: 'Expense Summary',
      columns: EXPENSE_SUMMARY_HEADERS.map(() => ({ width: 14 })),
    },
  ] as unknown as Parameters<typeof writeExcelFile>[0]).toBlob()

  downloadBlob(blob, expenseSummaryFilename(input.storeId, input.entries))
}

const EXPENSE_SUMMARY_HEADERS = ['Date', 'Fuel (₱)', 'Repair (₱)', 'Total (₱)']

/**
 * Downloadable one-row template so the client fills the import file with the
 * exact columns the parser expects.
 */
export async function downloadExpenseTemplate(): Promise<void> {
  const writeExcelFile = (await import('write-excel-file/browser')).default

  const blob = await writeExcelFile([
    {
      data: [
        EXPENSE_IMPORT_HEADERS.map((label) => ({ value: label })),
        ['2026-03-04', 'Fuel', 750, 'Jojo Ramos', '', 'Weekly fuel'],
      ],
      sheet: 'Expenses',
      columns: EXPENSE_IMPORT_HEADERS.map(() => ({ width: 16 })),
    },
  ] as unknown as Parameters<typeof writeExcelFile>[0]).toBlob()

  downloadBlob(blob, 'zaf-one-expense-import-template.xlsx')
}
