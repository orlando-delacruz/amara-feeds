import styled from 'styled-components'
import { getCurrentStock, getDailySalesByStore, getOutstandingCreditTotal } from '@/services'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingState } from '@/components/ui/LoadingState'
import { MoneyText } from '@/components/ui/MoneyText'
import { PageHeader } from '@/components/ui/PageHeader'
import { Stack } from '@/components/ui/Stack'
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

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
  padding: ${({ theme }) => theme.space.lg};
  background-color: ${({ theme }) => theme.color.surface.card};
  border: 1px solid ${({ theme }) => theme.color.border.default};
  border-radius: ${({ theme }) => theme.radius.lg};
`

const CardLabel = styled.span`
  font-size: ${({ theme }) => theme.font.size.xs};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${({ theme }) => theme.color.text.secondary};
`

const CardValue = styled.span`
  font-size: ${({ theme }) => theme.font.size.xl};
  font-weight: ${({ theme }) => theme.font.weight.bold};
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
      {data.loading && <LoadingState text="Loading dashboard…" />}
      {data.error && <ErrorState description={data.error} onRetry={data.reload} />}
      {!data.loading && !data.error && data.data && (
        <Cards>
          <Card>
            <CardLabel>Today's sales</CardLabel>
            <CardValue>
              <MoneyText amountMinor={data.data.storeSales?.totalMinor ?? 0} />
            </CardValue>
            <span>{data.data.storeSales?.saleCount ?? 0} sales</span>
          </Card>
          <Card>
            <CardLabel>Outstanding credit</CardLabel>
            <CardValue>
              <MoneyText amountMinor={data.data.outstanding.totalMinor} />
            </CardValue>
            <span>{data.data.outstanding.count} obligations</span>
          </Card>
          <Card>
            <CardLabel>Items in stock</CardLabel>
            <CardValue>{data.data.stockCount}</CardValue>
            <span>products tracked</span>
          </Card>
        </Cards>
      )}
    </Stack>
  )
}
