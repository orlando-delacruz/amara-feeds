import {
  getCurrentStock,
  getOutstandingCreditTotal,
  getOverallSalesInRange,
  getPaymentsSummary,
  getReceivedStock,
  getSalesByPaymentMethodInRange,
  getSalesByStoreInRange,
} from '@/services'
import { useAsyncData } from '@/features/shared'

/**
 * Range-based summaries for the admin Reports page. Unlike the shared
 * `useBusinessSummaries` (dashboards, single-date periods), this seam
 * aggregates sales, payments, and received stock over a From/To date range.
 */
export function useReportSummaries(from: string, to: string) {
  return useAsyncData(async () => {
    const [perStore, overall, outstanding, payments, stock, received, byPaymentMethod] =
      await Promise.all([
        getSalesByStoreInRange(from, to),
        getOverallSalesInRange(from, to),
        getOutstandingCreditTotal(),
        getPaymentsSummary({ from, to }),
        getCurrentStock(),
        getReceivedStock({ from, to }),
        getSalesByPaymentMethodInRange(from, to),
      ])
    return { from, to, perStore, overall, outstanding, payments, stock, received, byPaymentMethod }
  }, `${from}:${to}`)
}

export type ReportSummaries = NonNullable<ReturnType<typeof useReportSummaries>['data']>
