import type { ExpenseType } from '@/domain'
import { toDateOnly } from '@/lib/dates'
import { toMinor } from '@/lib/money'

/**
 * Excel import for the Expenses summary (DEC-054). Summary-only: the file is
 * parsed and validated in memory and grouped by date — nothing is written to
 * the database, so no schema or service changes are involved.
 *
 * Expected columns (order-flexible, header spelling case-insensitive):
 * Date, Type (Fuel/Repair), Amount (₱), Rider, Vehicle, Note (optional).
 * At least one of Rider/Vehicle is required per row, mirroring create_expense.
 */

export interface ImportedExpenseRow {
  date: string
  type: ExpenseType
  amountMinor: number
  targetName: string
  note?: string
}

export interface ExpenseImportResult {
  rows: ImportedExpenseRow[]
  /** Row-level problems as plain-language messages ("Row 4: …"). */
  errors: string[]
}

export interface ImportNameLists {
  riderNames: string[]
  vehicleNames: string[]
}

export interface ExpenseDateEntry {
  date: string
  fuelMinor: number
  repairMinor: number
  totalMinor: number
}

export const EXPENSE_IMPORT_HEADERS = ['Date', 'Type', 'Amount', 'Rider', 'Vehicle', 'Note']

type CellValue = string | number | boolean | Date | null

function cellText(value: CellValue): string {
  if (value === null || value === undefined) {
    return ''
  }
  if (value instanceof Date) {
    return toDateOnly(value)
  }
  return String(value).trim()
}

function parseImportDate(value: CellValue): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return toDateOnly(value)
  }
  const text = cellText(value)
  if (!text) {
    return null
  }
  // ISO date or datetime first (covers Excel text dates like 2026-03-04).
  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (iso) {
    const [, year, month, day] = iso
    const normalized = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    const check = new Date(`${normalized}T00:00:00`)
    if (!Number.isNaN(check.getTime())) {
      return normalized
    }
    return null
  }
  // Common Philippine handwritten shape: MM/DD/YYYY or MM-DD-YYYY.
  const slashed = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (slashed) {
    const [, month, day, year] = slashed
    const normalized = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    const check = new Date(`${normalized}T00:00:00`)
    if (!Number.isNaN(check.getTime())) {
      return normalized
    }
  }
  return null
}

function parseImportAmount(value: CellValue): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 0 ? toMinor(value) : null
  }
  const text = cellText(value)
    .replace(/₱/g, '')
    .replace(/^php\s*/i, '')
    .replace(/,/g, '')
    .trim()
  if (!text) {
    return null
  }
  const amount = Number(text)
  if (!Number.isFinite(amount) || amount <= 0) {
    return null
  }
  return toMinor(amount)
}

function parseImportType(value: CellValue): ExpenseType | null {
  const text = cellText(value).toLowerCase()
  if (text === 'fuel') {
    return 'fuel'
  }
  if (text === 'repair') {
    return 'repair'
  }
  return null
}

function buildNameLookup(names: string[]): Map<string, string> {
  const lookup = new Map<string, string>()
  for (const name of names) {
    const key = name.trim().toLowerCase()
    if (key && !lookup.has(key)) {
      lookup.set(key, name.trim())
    }
  }
  return lookup
}

/**
 * Parses an .xlsx expense file into validated rows. Never throws for bad
 * content — every problem is returned in `errors` with its row number
 * (1-based sheet rows, header included, matching what the user sees).
 */
export async function parseExpenseExcel(
  file: Blob,
  names: ImportNameLists,
): Promise<ExpenseImportResult> {
  const readXlsxFile = (await import('read-excel-file/browser')).default
  let sheet: CellValue[][]
  try {
    const sheets = await readXlsxFile(file)
    sheet = (sheets[0]?.data ?? []) as CellValue[][]
  } catch {
    return { rows: [], errors: ['This file could not be read as an Excel (.xlsx) file.'] }
  }
  const rows: ImportedExpenseRow[] = []
  const errors: string[] = []
  if (sheet.length === 0) {
    return { rows, errors: ['The Excel file is empty.'] }
  }

  const header = sheet[0].map((cell) => cellText(cell).toLowerCase())
  const columnOf = (name: string): number => header.indexOf(name)
  const missing = ['date', 'type', 'amount'].filter((name) => columnOf(name) === -1)
  if (missing.length > 0) {
    return {
      rows,
      errors: [
        `The Excel file is missing required column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}. Expected columns: ${EXPENSE_IMPORT_HEADERS.join(', ')}.`,
      ],
    }
  }
  const dateCol = columnOf('date')
  const typeCol = columnOf('type')
  const amountCol = columnOf('amount')
  const riderCol = columnOf('rider')
  const vehicleCol = columnOf('vehicle')
  const noteCol = columnOf('note')
  const hasTargetColumns = riderCol !== -1 || vehicleCol !== -1
  if (!hasTargetColumns) {
    return {
      rows,
      errors: [
        'The Excel file needs a Rider or Vehicle column so each expense has someone to assign it to.',
      ],
    }
  }

  const riders = buildNameLookup(names.riderNames)
  const vehicles = buildNameLookup(names.vehicleNames)

  sheet.slice(1).forEach((cells, index) => {
    const rowNumber = index + 2
    if (cells.every((cell) => cellText(cell) === '')) {
      return
    }
    const date = parseImportDate(cells[dateCol])
    if (!date) {
      errors.push(`Row ${rowNumber}: Date is missing or not a real date.`)
      return
    }
    const type = parseImportType(cells[typeCol])
    if (!type) {
      errors.push(`Row ${rowNumber}: Type must be Fuel or Repair.`)
      return
    }
    const amountMinor = parseImportAmount(cells[amountCol])
    if (amountMinor === null) {
      errors.push(`Row ${rowNumber}: Amount must be a number greater than zero.`)
      return
    }
    const riderName = riderCol === -1 ? '' : cellText(cells[riderCol])
    const vehicleName = vehicleCol === -1 ? '' : cellText(cells[vehicleCol])
    if (!riderName && !vehicleName) {
      errors.push(`Row ${rowNumber}: assign the expense to a rider or a vehicle.`)
      return
    }
    const matchedRider = riderName ? riders.get(riderName.toLowerCase()) : undefined
    const matchedVehicle = vehicleName ? vehicles.get(vehicleName.toLowerCase()) : undefined
    if (riderName && !matchedRider) {
      errors.push(`Row ${rowNumber}: rider "${riderName}" was not found at this store.`)
      return
    }
    if (vehicleName && !matchedVehicle) {
      errors.push(`Row ${rowNumber}: vehicle "${vehicleName}" was not found at this store.`)
      return
    }
    const note = noteCol === -1 ? '' : cellText(cells[noteCol])
    rows.push({
      date,
      type,
      amountMinor,
      targetName: (matchedRider ?? matchedVehicle ?? riderName ?? vehicleName).trim(),
      note: note || undefined,
    })
  })

  if (rows.length === 0 && errors.length === 0) {
    errors.push('The Excel file has no expense rows to summarize.')
  }
  return { rows, errors }
}

/** Groups validated import rows by date (ascending) with fuel/repair splits. */
export function groupExpensesByDate(rows: ImportedExpenseRow[]): ExpenseDateEntry[] {
  const byDate = new Map<string, ExpenseDateEntry>()
  for (const row of rows) {
    const entry = byDate.get(row.date) ?? {
      date: row.date,
      fuelMinor: 0,
      repairMinor: 0,
      totalMinor: 0,
    }
    if (row.type === 'fuel') {
      entry.fuelMinor += row.amountMinor
    } else {
      entry.repairMinor += row.amountMinor
    }
    entry.totalMinor += row.amountMinor
    byDate.set(row.date, entry)
  }
  return [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1))
}
