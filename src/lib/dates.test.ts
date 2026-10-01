import { describe, expect, it } from 'vitest'
import { startOfMonthOnly, startOfWeekOnly } from './dates'

describe('dates', () => {
  describe('startOfWeekOnly', () => {
    it('returns the same day for a Sunday', () => {
      expect(startOfWeekOnly('2026-10-04')).toBe('2026-10-04')
    })

    it('returns Sunday for mid-week days', () => {
      expect(startOfWeekOnly('2026-10-08')).toBe('2026-10-04')
    })

    it('returns the same Sunday for a Saturday', () => {
      expect(startOfWeekOnly('2026-10-10')).toBe('2026-10-04')
    })

    it('crosses a month boundary', () => {
      expect(startOfWeekOnly('2026-10-02')).toBe('2026-09-27')
    })

    it('crosses a year boundary', () => {
      expect(startOfWeekOnly('2026-01-01')).toBe('2025-12-28')
    })
  })

  describe('startOfMonthOnly', () => {
    it('returns the first day of the month', () => {
      expect(startOfMonthOnly('2026-10-08')).toBe('2026-10-01')
    })

    it('crosses a year boundary', () => {
      expect(startOfMonthOnly('2026-01-31')).toBe('2026-01-01')
    })
  })
})
