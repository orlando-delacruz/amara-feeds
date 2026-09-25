import styled from 'styled-components'
import { getCurrentStock, getDailySalesByStore, getWeeklySalesByStore } from '@/services'
import type { StoreId } from '@/domain'
import { Stack } from '@/components/ui/Stack'
import { StatCard } from '@/components/ui/StatCard'
import { Section } from '@/components/ui/Section'
import { AsyncBoundary } from '@/components/ui/AsyncBoundary'
import { Icon } from '@/components/ui/icons'
import { MoneyText } from '@/components/ui/MoneyText'
import { StatsSkeleton } from '@/components/ui/Skeletons'
import { useAsyncData } from '@/features/shared'
import { todayIso } from '@/lib/dates'
import { concreteStoreId, storeNames } from '@/store/stores'
import { useStore } from '@/store/useStore'
import { RouteBoard } from './RouteBoard'
import { BalanceStateChip } from './BalanceState'
import type { BalanceState } from './BalanceState'

const StoreLivery = styled.span<{ $store: StoreId }>`
  flex: 1;
  height: 100%;
  background-color: ${({ theme, $store }) => theme.color.store[$store].solid};
`

const Stamp = styled.div`
  animation: plateIn 260ms cubic-bezier(0.16, 1, 0.3, 1) both;

  @keyframes plateIn {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`

const Plates = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.space.md};

  @media (min-width: ${({ theme }) => theme.breakpoint.phoneWide}) {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
`

function stockState(count: number): BalanceState {
  if (count === 0) return 'critical'
  if (count <= 2) return 'attention'
  return 'healthy'
}

export function StaffDashboardPage() {
  const { store } = useStore()
  const date = todayIso()
  const data = useAsyncData(async () => {
    const [sales, stock, weekly] = await Promise.all([
      getDailySalesByStore(date),
      getCurrentStock(),
      getWeeklySalesByStore(date),
    ])
    return {
      storeSales: sales.find((row) => row.storeId === store),
      stockCount: stock.filter((row) => row.storeId === store).length,
      weeklySales: weekly.find((row) => row.storeId === store),
    }
  }, `${store}:${date}`)

  return (
    <Stack>
      <RouteBoard
        title="Dashboard"
        route={storeNames[concreteStoreId(store)]}
        date={date}
        accent={<StoreLivery $store={concreteStoreId(store)} />}
      />
      <AsyncBoundary
        loading={data.loading}
        error={data.error}
        onRetry={data.reload}
        empty={null}
        skeleton={
          <Stack>
            <StatsSkeleton count={1} />
            <StatsSkeleton count={1} />
            <StatsSkeleton count={1} />
          </Stack>
        }
      >
        {data.data && (
          <Stack gap="lg">
            <Stamp>
              <StatCard
                label="Today's sales"
                value={<MoneyText amountMinor={data.data.storeSales?.totalMinor ?? 0} />}
                caption={`${data.data.storeSales?.saleCount ?? 0} sales today`}
                tone={concreteStoreId(store)}
                icon={<Icon name="card" />}
                valueScale="hero"
                panel
              />
            </Stamp>
            <Plates>
              <StatCard
                label="Items in stock"
                value={data.data.stockCount}
                caption="products tracked"
                tone="brand"
                icon={<Icon name="box" />}
                badge={<BalanceStateChip state={stockState(data.data.stockCount)} />}
                outline
              />
            </Plates>
            <Section title="Weekly sales" variant="flush">
              <Plates>
                <StatCard
                  label="Weekly sales"
                  value={<MoneyText amountMinor={data.data.weeklySales?.totalMinor ?? 0} />}
                  caption={`${data.data.weeklySales?.saleCount ?? 0} sales · last 7 days`}
                  tone={concreteStoreId(store)}
                  icon={<Icon name="calendar" />}
                />
              </Plates>
            </Section>
          </Stack>
        )}
      </AsyncBoundary>
    </Stack>
  )
}
