import type { Expense } from '@/domain'
import { toDateOnly } from '@/lib/dates'

/**
 * By-date summary of recorded expenses (DEC-054). Expenses carry no
 * expense-date field — only the server-set `createdAt` — so each record is
 * attributed to its recording date. Pure grouping; nothing is written.
 */

export interface ExpenseDateEntry {
  date: string
  fuelMinor: number
  repairMinor: number
  totalMinor: number
}

/** Groups stored expense records by recording date (ascending). */
export function buildExpenseDateSummary(expenses: Expense[]): ExpenseDateEntry[] {
  const byDate = new Map<string, ExpenseDateEntry>()
  for (const expense of expenses) {
    const date = toDateOnly(new Date(expense.createdAt))
    const entry = byDate.get(date) ?? { date, fuelMinor: 0, repairMinor: 0, totalMinor: 0 }
    if (expense.type === 'fuel') {
      entry.fuelMinor += expense.amountMinor
    } else {
      entry.repairMinor += expense.amountMinor
    }
    entry.totalMinor += expense.amountMinor
    byDate.set(date, entry)
  }
  return [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1))
}
