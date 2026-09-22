import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  downloadExpenseTemplate,
  expenseSummaryFilename,
  exportExpenseSummaryExcel,
} from './exportExpenseExcel'
import type { ExpenseDateEntry } from '@/features/expenses/expenseImport'

describe('expenseSummaryFilename', () => {
  it('names the file by date range and store (DEC-054)', () => {
    const entries: ExpenseDateEntry[] = [
      { date: '2026-03-05', fuelMinor: 10000, repairMinor: 0, totalMinor: 10000 },
      { date: '2026-03-04', fuelMinor: 75000, repairMinor: 120000, totalMinor: 195000 },
    ]
    expect(expenseSummaryFilename('amara', entries)).toBe(
      'zaf-one-expense-summary-2026-03-04-to-2026-03-05-Amara.xlsx',
    )
    expect(expenseSummaryFilename('zeann', [entries[0]])).toBe(
      'zaf-one-expense-summary-2026-03-05-Zeann.xlsx',
    )
  })
})

describe('exportExpenseSummaryExcel', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock'),
      revokeObjectURL: vi.fn(),
    })
  })

  it('downloads the summary workbook without throwing (DEC-054)', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    await exportExpenseSummaryExcel({
      storeId: 'amara',
      entries: [{ date: '2026-03-04', fuelMinor: 75000, repairMinor: 120000, totalMinor: 195000 }],
    })
    expect(click).toHaveBeenCalled()
    const anchor = document.querySelector('a[download]') as HTMLAnchorElement | null
    // The anchor is removed after clicking; the filename drove the download.
    expect(anchor).toBeNull()
    click.mockRestore()
  })

  it('downloads the import template without throwing (DEC-054)', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    await downloadExpenseTemplate()
    expect(click).toHaveBeenCalled()
    click.mockRestore()
  })
})
