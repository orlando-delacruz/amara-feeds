import { beforeEach, describe, expect, it, vi } from 'vitest'
import { exportReportExcel } from './exportReportExcel'
import type { ReportExcelInput } from './exportReportExcel'

interface CapturedSheet {
  sheet: string
  data: Array<Array<{ value: unknown }>>
  columns: Array<{ width: number }>
}

const mocks = vi.hoisted(() => ({ sheets: [] as CapturedSheet[] }))

vi.mock('write-excel-file/browser', () => ({
  default: (sheets: CapturedSheet[]) => {
    mocks.sheets = sheets
    return { toBlob: async () => new Blob() }
  },
}))

function headers(sheet: CapturedSheet): string[] {
  return (sheet.data[0] ?? []).map((cell) => String(cell.value))
}

function row(sheet: CapturedSheet, index: number): unknown[] {
  return (sheet.data[index] ?? []).map((cell) => cell.value)
}

function sheet(name: string): CapturedSheet {
  const found = mocks.sheets.find((entry) => entry.sheet === name)
  if (!found) {
    throw new Error(`Missing sheet: ${name}`)
  }
  return found
}

/** One credit worth 13,000.00 split over two item lines. */
const input: ReportExcelInput = {
  from: '2026-10-01',
  to: '2026-10-01',
  rows: [
    {
      date: '2026-10-01',
      storeId: 'amara',
      customerName: 'Dina Cruz',
      productName: 'Rice 25kg',
      quantity: 2,
      unitPriceMinor: 115000,
      lineTotalMinor: 230000,
      paymentType: 'Cash',
      paymentMethod: 'GCash',
      deliveryFeeMinor: 0,
      discountMinor: 0,
      netTotalMinor: 230000,
      riderName: '',
      vehiclePlate: '',
      recordedByName: 'Alice',
    },
  ],
  creditRows: [
    {
      customerName: 'Tina Lim',
      originStoreId: 'amara',
      createdDate: '2026-10-01',
      dueDate: '2026-10-15',
      recordedByName: 'Owner',
      productName: 'Rice 25kg',
      quantity: 2,
      unitPriceMinor: 50000,
      lineTotalMinor: 100000,
      originalMinor: 130000,
      paidMinor: 30000,
      balanceMinor: 100000,
      status: 'Outstanding',
    },
    {
      customerName: 'Tina Lim',
      originStoreId: 'amara',
      createdDate: '2026-10-01',
      dueDate: '2026-10-15',
      recordedByName: 'Owner',
      productName: 'Sugar 1kg',
      quantity: 3,
      unitPriceMinor: 10000,
      lineTotalMinor: 30000,
      originalMinor: 0,
      paidMinor: 0,
      balanceMinor: 0,
      status: 'Outstanding',
    },
  ],
  expenseRows: [
    { date: '2026-10-01', storeId: 'amara', fuelMinor: 75000, repairMinor: 0, totalMinor: 75000 },
  ],
  expenseRecordRows: [
    {
      date: '2026-10-01',
      storeId: 'amara',
      target: 'Jojo Ramos',
      type: 'Fuel',
      amountMinor: 75000,
      note: 'Top-up tank',
      recordedByName: 'Alice',
    },
  ],
}

describe('exportReportExcel', () => {
  beforeEach(() => {
    mocks.sheets = []
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock'),
      revokeObjectURL: vi.fn(),
    })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })

  it('writes Sales, Credit, Expenses, and Expense Records (DEC-067)', async () => {
    await exportReportExcel(input)
    expect(mocks.sheets.map((entry) => entry.sheet)).toEqual([
      'Sales',
      'Credit',
      'Expenses',
      'Expense Records',
    ])
  })

  it('shows the encoder on the Sales sheet', async () => {
    await exportReportExcel(input)
    const sales = sheet('Sales')
    expect(headers(sales)).toContain('Recorded By')
    const recordedBy = headers(sales).indexOf('Recorded By')
    expect(row(sales, 1)[recordedBy]).toBe('Alice')
  })

  it('shows Item, Quantity, Price, and Recorded By on the Credit sheet', async () => {
    await exportReportExcel(input)
    const credit = sheet('Credit')
    expect(headers(credit)).toEqual(
      expect.arrayContaining(['Item', 'Quantity', 'Price', 'Line Amount', 'Recorded By']),
    )
    expect(row(credit, 1)).toEqual(
      expect.arrayContaining([
        'Tina Lim',
        'Rice 25kg',
        2,
        500,
        'Owner',
        1300,
        300,
        1000,
        'Outstanding',
      ]),
    )
  })

  it('does not double-count a credit spread over several item lines (DEC-067)', async () => {
    await exportReportExcel(input)
    const credit = sheet('Credit')
    const columns = headers(credit)
    const original = columns.indexOf('Original')
    const balance = columns.indexOf('Balance')
    const amount = columns.indexOf('Line Amount')

    // Line totals are per item line; the obligation money rides line one only,
    // so each column still sums to the single obligation's figures.
    expect(Number(row(credit, 1)[amount]) + Number(row(credit, 2)[amount])).toBe(1300)
    expect(Number(row(credit, 1)[original]) + Number(row(credit, 2)[original])).toBe(1300)
    expect(Number(row(credit, 1)[balance]) + Number(row(credit, 2)[balance])).toBe(1000)
  })

  it('shows the encoder on the Expense Records sheet', async () => {
    await exportReportExcel(input)
    const records = sheet('Expense Records')
    expect(headers(records)).toEqual([
      'Date',
      'Location',
      'Rider / Vehicle',
      'Type',
      'Amount',
      'Note',
      'Recorded By',
    ])
    expect(row(records, 1)).toEqual([
      '2026-10-01',
      'Amara',
      'Jojo Ramos',
      'Fuel',
      750,
      'Top-up tank',
      'Alice',
    ])
  })

  it('keeps the aggregated Expenses sheet alongside the per-record one', async () => {
    await exportReportExcel(input)
    expect(headers(sheet('Expenses'))).toEqual(['Date', 'Location', 'Fuel', 'Repair', 'Total'])
    expect(row(sheet('Expenses'), 1)).toEqual(['2026-10-01', 'Amara', 750, 0, 750])
  })

  it('omits the sheets whose rows were not requested', async () => {
    await exportReportExcel({ from: '2026-10-01', to: '2026-10-01', rows: input.rows })
    expect(mocks.sheets.map((entry) => entry.sheet)).toEqual(['Sales'])
  })
})
