import styled from 'styled-components'
import { getCurrentStock, getDailySalesByStore, getOutstandingCreditTotal } from '@/services'
import { PageHeader } from '@/components/ui/PageHeader'
import { Stack } from '@/components/ui/Stack'
import { StatCard } from '@/components/ui/StatCard'
import { AsyncBoundary } from '@/components/ui/AsyncBoundary'
import { MoneyText } from '@/components/ui/MoneyText'
import { useAsyncData } from '@/features/shared'
import { todayIso } from '@/lib/dates'
import { storeNames } from '@/store/stores'
import { useStore } from '@/store/useStore'

const Cards = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.space.md};

  @media (min-width: ${({ theme }) => theme.breakpoint.tablet}) {
    grid-template-columns: repeat(3, 1fr);
  }
`

export function StaffDashboardPage() {
  const { store } = useStore()
  const data = useAsyncData(async () => {
    const [sales, outstanding, stock] = await Promise.all([
      getDailySalesByStore(todayIso()),
      getOutstandingCreditTotal(),
      getCurrentStock(),
    ])
    return {
      storeSales: sales.find((row) => row.storeId === store),
      outstanding,
      stockCount: stock.filter((row) => row.storeId === store).length,
    }
  }, store)

  return (
    <Stack>
      <PageHeader title="Dashboard" description={`Today's overview for ${storeNames[store]}.`} />
      <AsyncBoundary
        loading={data.loading}
        loadingText="Loading dashboard…"
        error={data.error}
        onRetry={data.reload}
        empty={null}
      >
        {data.data && (
          <Cards>
            <StatCard
              label="Today's sales"
              value={<MoneyText amountMinor={data.data.storeSales?.totalMinor ?? 0} />}
              caption={`${data.data.storeSales?.saleCount ?? 0} sales`}
            />
            <StatCard
              label="Outstanding credit"
              value={<MoneyText amountMinor={data.data.outstanding.totalMinor} />}
              caption={`${data.data.outstanding.count} obligations`}
            />
            <StatCard
              label="Items in stock"
              value={data.data.stockCount}
              caption="products tracked"
            />
          </Cards>
        )}
      </AsyncBoundary>
    </Stack>
  )
}
