import styled from 'styled-components'
import { getCurrentStock, getDailySalesByStore, getOutstandingCreditTotal } from '@/services'
import { PageHeader } from '@/components/ui/PageHeader'
import { Stack } from '@/components/ui/Stack'
import { StatCard } from '@/components/ui/StatCard'
import { AsyncBoundary } from '@/components/ui/AsyncBoundary'
import { Icon } from '@/components/ui/icons'
import { MoneyText } from '@/components/ui/MoneyText'
import { StatsSkeleton } from '@/components/ui/Skeletons'
import { useAsyncData } from '@/features/shared'
import { todayIso } from '@/lib/dates'
import { storeNames } from '@/store/stores'
import { useStore } from '@/store/useStore'

const Cards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  gap: ${({ theme }) => theme.space.md};
`

const FullWidth = styled.div`
  grid-column: 1 / -1;
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
      <PageHeader
        title="Dashboard"
        description={`Today's overview for ${storeNames[store]}.`}
        size="compact"
      />
      <AsyncBoundary
        loading={data.loading}
        error={data.error}
        onRetry={data.reload}
        empty={null}
        skeleton={<StatsSkeleton count={3} />}
      >
        {data.data && (
          <Cards>
            <FullWidth>
              <StatCard
                label="Today's sales"
                value={<MoneyText amountMinor={data.data.storeSales?.totalMinor ?? 0} />}
                caption={`${data.data.storeSales?.saleCount ?? 0} sales`}
                tone="brand"
                icon={<Icon name="card" />}
                valueScale="hero"
              />
            </FullWidth>
            <StatCard
              label="Outstanding credit"
              value={<MoneyText amountMinor={data.data.outstanding.totalMinor} />}
              caption={`${data.data.outstanding.count} obligations`}
              icon={<Icon name="alert" />}
            />
            <StatCard
              label="Items in stock"
              value={data.data.stockCount}
              caption="products tracked"
              icon={<Icon name="box" />}
            />
          </Cards>
        )}
      </AsyncBoundary>
    </Stack>
  )
}
