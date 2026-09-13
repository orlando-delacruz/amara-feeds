import {
  getCurrentStock,
  getDailySalesByStore,
  getOutstandingCreditTotal,
  getOverallDailySales,
  getPaymentsSummary,
  getReceivedStock,
} from '@/services'
import { useAsyncData } from '@/features/shared'
import type { StoreId } from '@/domain'

/**
 * Shared data seam for business summaries. Dashboard and Reports fetch once
 * and compose different layouts. When a storeId is given (staff surface),
 * store-specific summaries (sales, stock, received) are scoped to that store;
 * shared credit and payments stay business-wide per the confirmed model.
 */
export function useBusinessSummaries(date: string, storeId?: StoreId) {
  return useAsyncData(
    async () => {
      const [perStore, overall, outstanding, payments, stock, received] = await Promise.all([
        getDailySalesByStore(date),
        getOverallDailySales(date),
        getOutstandingCreditTotal(),
        getPaymentsSummary({ date }),
        getCurrentStock(),
        getReceivedStock({ date }),
      ])
      if (!storeId) {
        return { perStore, overall, outstanding, payments, stock, received }
      }
      const scopedSales = perStore.filter((row) => row.storeId === storeId)
      const scoped = scopedSales[0]
      return {
        perStore: scopedSales,
        overall: { date, totalMinor: scoped?.totalMinor ?? 0, saleCount: scoped?.saleCount ?? 0 },
        outstanding,
        payments,
        stock: stock.filter((row) => row.storeId === storeId),
        received: received.filter((row) => row.storeId === storeId),
      }
    },
    `${date}:${storeId ?? 'all'}`,
  )
}

export type BusinessSummaries = NonNullable<ReturnType<typeof useBusinessSummaries>['data']>
