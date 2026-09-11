import {
  getCurrentStock,
  getDailySalesByStore,
  getOutstandingCreditTotal,
  getOverallDailySales,
  getPaymentsSummary,
  getReceivedStock,
} from '@/services'
import { useAsyncData } from '@/features/shared'

/** Shared data seam for business summaries. Dashboard and Reports fetch once and compose different layouts. */
export function useBusinessSummaries(date: string) {
  return useAsyncData(async () => {
    const [perStore, overall, outstanding, payments, stock, received] = await Promise.all([
      getDailySalesByStore(date),
      getOverallDailySales(date),
      getOutstandingCreditTotal(),
      getPaymentsSummary({ date }),
      getCurrentStock(),
      getReceivedStock({ date }),
    ])
    return { perStore, overall, outstanding, payments, stock, received }
  }, date)
}

export type BusinessSummaries = NonNullable<ReturnType<typeof useBusinessSummaries>['data']>
