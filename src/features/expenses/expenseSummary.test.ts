import { describe, expect, it } from 'vitest'
import { buildExpenseDateSummary } from './expenseSummary'
import type { Expense } from '@/domain'

function expense(overrides: Partial<Expense> & { createdAt: string }): Expense {
  return {
    id: 'exp-test',
    storeId: 'amara',
    riderId: 'rider-1',
    type: 'fuel',
    amountMinor: 10000,
    recordedByUserId: 'user-1',
    ...overrides,
  }
}

describe('buildExpenseDateSummary', () => {
  it('groups stored expenses by recording date ascending with splits (DEC-054)', () => {
    const entries = buildExpenseDateSummary([
      expense({ createdAt: '2026-03-05T08:00:00.000Z', type: 'fuel', amountMinor: 10000 }),
      expense({ createdAt: '2026-03-04T08:00:00.000Z', type: 'fuel', amountMinor: 75000 }),
      expense({
        createdAt: '2026-03-04T09:00:00.000Z',
        type: 'repair',
        amountMinor: 120000,
        riderId: undefined,
        vehicleId: 'vehicle-1',
      }),
    ])
    expect(entries).toEqual([
      { date: '2026-03-04', fuelMinor: 75000, repairMinor: 120000, totalMinor: 195000 },
      { date: '2026-03-05', fuelMinor: 10000, repairMinor: 0, totalMinor: 10000 },
    ])
  })

  it('returns an empty summary when there are no expenses (DEC-054)', () => {
    expect(buildExpenseDateSummary([])).toEqual([])
  })
})
