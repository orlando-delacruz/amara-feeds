import {
  getCurrentStock,
  getDailySalesByStore,
  getMonthlySalesByStore,
  getOutstandingCreditTotal,
  getOverallDailySales,
  getOverallMonthlySales,
  getOverallWeeklySales,
  getPaymentsSummary,
  getReceivedStock,
  getWeeklySalesByStore,
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
      const [
        perStore,
        overall,
        outstanding,
        payments,
        stock,
        received,
        weeklyPerStore,
        weeklyOverall,
        monthlyPerStore,
        monthlyOverall,
      ] = await Promise.all([
        getDailySalesByStore(date),
        getOverallDailySales(date),
        getOutstandingCreditTotal(),
        getPaymentsSummary({ date }),
        getCurrentStock(),
        getReceivedStock({ date }),
        getWeeklySalesByStore(date),
        getOverallWeeklySales(date),
        getMonthlySalesByStore(date),
        getOverallMonthlySales(date),
      ])
      const weekly = { perStore: weeklyPerStore, overall: weeklyOverall }
      const monthly = { perStore: monthlyPerStore, overall: monthlyOverall }
      if (!storeId) {
        return { perStore, overall, outstanding, payments, stock, received, weekly, monthly }
      }
      const scopedSales = perStore.filter((row) => row.storeId === storeId)
      const scoped = scopedSales[0]
      const scopedWeekly = weeklyPerStore.filter((row) => row.storeId === storeId)
      const scopedMonthly = monthlyPerStore.filter((row) => row.storeId === storeId)
      return {
        perStore: scopedSales,
        overall: { date, totalMinor: scoped?.totalMinor ?? 0, saleCount: scoped?.saleCount ?? 0 },
        outstanding,
        payments,
        stock: stock.filter((row) => row.storeId === storeId),
        received: received.filter((row) => row.storeId === storeId),
        weekly: {
          perStore: scopedWeekly,
          overall: {
            startDate: weeklyOverall.startDate,
            endDate: weeklyOverall.endDate,
            totalMinor: scopedWeekly[0]?.totalMinor ?? 0,
            saleCount: scopedWeekly[0]?.saleCount ?? 0,
          },
        },
        monthly: {
          perStore: scopedMonthly,
          overall: {
            startDate: monthlyOverall.startDate,
            endDate: monthlyOverall.endDate,
            totalMinor: scopedMonthly[0]?.totalMinor ?? 0,
            saleCount: scopedMonthly[0]?.saleCount ?? 0,
          },
        },
      }
    },
    `${date}:${storeId ?? 'all'}`,
  )
}

export type BusinessSummaries = NonNullable<ReturnType<typeof useBusinessSummaries>['data']>
