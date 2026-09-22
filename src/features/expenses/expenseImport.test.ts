import { beforeEach, describe, expect, it } from 'vitest'
import { groupExpensesByDate, parseExpenseExcel, type ImportedExpenseRow } from './expenseImport'

const NAMES = { riderNames: ['Jojo Ramos', 'Ramon Cruz'], vehicleNames: ['Motorcycle'] }

async function buildWorkbook(rows: Array<Array<string | number | Date>>): Promise<File> {
  const writeExcelFile = (await import('write-excel-file/browser')).default
  const blob = await writeExcelFile([
    {
      data: [
        ['Date', 'Type', 'Amount', 'Rider', 'Vehicle', 'Note'].map((value) => ({ value })),
        ...rows.map((cells) =>
          cells.map((value) =>
            value instanceof Date ? { value, type: Date, format: 'yyyy-mm-dd' } : { value },
          ),
        ),
      ],
      sheet: 'Expenses',
      columns: Array.from({ length: 6 }, () => ({ width: 16 })),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ] as any).toBlob()
  return new File([blob], 'expenses.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

describe('parseExpenseExcel', () => {
  beforeEach(() => {})

  it('parses valid rows with date objects, amounts, and name matching (DEC-054)', async () => {
    const file = await buildWorkbook([
      [new Date(2026, 2, 4), 'Fuel', 750, 'Jojo Ramos', '', 'Weekly fuel'],
      [new Date(2026, 2, 4), 'repair', 1200, '', 'motorcycle', ''],
      ['2026-03-05', 'Fuel', '₱1,200.00', 'ramon cruz', '', ''],
    ])
    const result = await parseExpenseExcel(file, NAMES)
    expect(result.errors).toEqual([])
    expect(result.rows).toHaveLength(3)
    expect(result.rows[0]).toMatchObject({
      date: '2026-03-04',
      type: 'fuel',
      amountMinor: 75000,
      targetName: 'Jojo Ramos',
      note: 'Weekly fuel',
    })
    expect(result.rows[1]).toMatchObject({
      date: '2026-03-04',
      type: 'repair',
      amountMinor: 120000,
      targetName: 'Motorcycle',
    })
    expect(result.rows[2]).toMatchObject({ date: '2026-03-05', amountMinor: 120000 })
  })

  it('reports row-level problems without throwing (DEC-054)', async () => {
    const file = await buildWorkbook([
      ['not-a-date', 'Fuel', 100, 'Jojo Ramos', '', ''],
      [new Date(2026, 2, 4), 'Diesel', 100, 'Jojo Ramos', '', ''],
      [new Date(2026, 2, 4), 'Fuel', 0, 'Jojo Ramos', '', ''],
      [new Date(2026, 2, 4), 'Fuel', 100, '', '', ''],
      [new Date(2026, 2, 4), 'Fuel', 100, 'Nobody Here', '', ''],
      [new Date(2026, 2, 4), 'Fuel', 100, '', 'Ghost Van', ''],
    ])
    const result = await parseExpenseExcel(file, NAMES)
    expect(result.rows).toHaveLength(0)
    expect(result.errors).toEqual([
      'Row 2: Date is missing or not a real date.',
      'Row 3: Type must be Fuel or Repair.',
      'Row 4: Amount must be a number greater than zero.',
      'Row 5: assign the expense to a rider or a vehicle.',
      'Row 6: rider "Nobody Here" was not found at this store.',
      'Row 7: vehicle "Ghost Van" was not found at this store.',
    ])
  })

  it('keeps valid rows and skips blank ones (DEC-054)', async () => {
    const file = await buildWorkbook([
      [new Date(2026, 2, 4), 'Fuel', 100, 'Jojo Ramos', '', ''],
      ['', '', '', '', '', ''],
      ['03/06/2026', 'Repair', 50, '', 'Motorcycle', ''],
    ])
    const result = await parseExpenseExcel(file, NAMES)
    expect(result.errors).toEqual([])
    expect(result.rows.map((row) => row.date)).toEqual(['2026-03-04', '2026-03-06'])
  })

  it('rejects files missing required columns (DEC-054)', async () => {
    const writeExcelFile = (await import('write-excel-file/browser')).default
    const blob = await writeExcelFile([
      {
        data: [[{ value: 'Day' }, { value: 'Kind' }]],
        sheet: 'Expenses',
        columns: [{ width: 12 }, { width: 12 }],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    ]).toBlob()
    const result = await parseExpenseExcel(new File([blob], 'bad.xlsx'), NAMES)
    expect(result.rows).toHaveLength(0)
    expect(result.errors[0]).toMatch(/missing required columns: date, type, amount/)
  })

  it('rejects empty and unreadable files (DEC-054)', async () => {
    const empty = await parseExpenseExcel(new File([], 'empty.xlsx'), NAMES).catch(
      (error: Error) => ({ rows: [], errors: [error.message] }),
    )
    expect(empty.rows).toHaveLength(0)
    expect(empty.errors.length).toBeGreaterThan(0)

    const text = await parseExpenseExcel(
      new File(['hello'], 'notes.txt', { type: 'text/plain' }),
      NAMES,
    )
    expect(text.rows).toHaveLength(0)
    expect(text.errors).toEqual(['This file could not be read as an Excel (.xlsx) file.'])
  })
})

describe('groupExpensesByDate', () => {
  it('groups by date ascending with fuel/repair splits (DEC-054)', () => {
    const rows: ImportedExpenseRow[] = [
      { date: '2026-03-05', type: 'fuel', amountMinor: 10000, targetName: 'Jojo Ramos' },
      { date: '2026-03-04', type: 'fuel', amountMinor: 75000, targetName: 'Jojo Ramos' },
      { date: '2026-03-04', type: 'repair', amountMinor: 120000, targetName: 'Motorcycle' },
    ]
    expect(groupExpensesByDate(rows)).toEqual([
      { date: '2026-03-04', fuelMinor: 75000, repairMinor: 120000, totalMinor: 195000 },
      { date: '2026-03-05', fuelMinor: 10000, repairMinor: 0, totalMinor: 10000 },
    ])
  })
})
