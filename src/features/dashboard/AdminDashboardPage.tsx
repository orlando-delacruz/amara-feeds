import { useState } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { AsyncBoundary } from '@/components/ui/AsyncBoundary'
import { Button } from '@/components/ui/Button'
import { MoneyText } from '@/components/ui/MoneyText'
import { RecordList } from '@/components/ui/RecordList'
import { Section } from '@/components/ui/Section'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Stack } from '@/components/ui/Stack'
import { StatCard } from '@/components/ui/StatCard'
import { Icon } from '@/components/ui/icons'
import { ListSkeleton, StatsSkeleton } from '@/components/ui/Skeletons'
import { todayIso } from '@/lib/dates'
import { storeNames } from '@/store/stores'
import type { StoreId } from '@/domain'
import { useBusinessSummaries } from './useBusinessSummaries'
import { RouteBoard } from './RouteBoard'
import { BalanceStateChip } from './BalanceState'

/** Dashboard lists preview five rows; the full list lives on its page. */
const DASHBOARD_LIST_LIMIT = 5

const LiveryHalf = styled.span<{ $store: StoreId }>`
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

const DepotBoard = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.space.md};

  @media (min-width: ${({ theme }) => theme.breakpoint.phoneWide}) {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
`

const StoreColumn = styled.div`
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.color.surface.card};
  border: 1px solid ${({ theme }) => theme.color.border.default};
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
`

const ColumnHeader = styled.h2<{ $store: StoreId }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space.sm};
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.lg};
  background-color: ${({ theme, $store }) => theme.color.store[$store].solid};
  color: ${({ theme }) => theme.color.text.inverse};
  font-family: ${({ theme }) => theme.font.familyCondensed};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  letter-spacing: ${({ theme }) => theme.font.tracking.wide};
  text-transform: uppercase;
  line-height: ${({ theme }) => theme.font.lineHeight.tight};
`

const ColumnCount = styled.span`
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.color.text.inverse};
  opacity: 0.85;
  white-space: nowrap;
`

const DayFigure = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
  padding: ${({ theme }) => theme.space.md} ${({ theme }) => theme.space.lg};
`

const DayValue = styled.span`
  font-family: ${({ theme }) => theme.font.familyCondensed};
  font-size: ${({ theme }) => theme.font.size.xxl};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  line-height: ${({ theme }) => theme.font.lineHeight.tight};
  letter-spacing: ${({ theme }) => theme.font.tracking.tight};
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.color.text.primary};
`

const DayCaption = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.color.text.muted};

  &::before {
    content: '';
    width: 14px;
    height: 2px;
    flex-shrink: 0;
    background-color: currentColor;
    opacity: 0.7;
  }
`

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const date = todayIso()
  const summaries = useBusinessSummaries(date)
  const data = summaries.data
  const [period, setPeriod] = useState<'today' | 'weekly' | 'monthly'>('today')

  const periodSales = data
    ? period === 'today'
      ? {
          overall: data.overall,
          perStore: data.perStore,
          heroLabel: 'Overall daily sales',
          rangeCaption: 'sales across Amara and Zeann',
          columnCaption: 'today',
        }
      : period === 'weekly'
        ? {
            overall: data.weekly.overall,
            perStore: data.weekly.perStore,
            heroLabel: 'Overall weekly sales',
            rangeCaption: 'sales · last 7 days',
            columnCaption: 'last 7 days',
          }
        : {
            overall: data.monthly.overall,
            perStore: data.monthly.perStore,
            heroLabel: 'Overall monthly sales',
            rangeCaption: 'sales · this month',
            columnCaption: 'this month',
          }
    : null

  return (
    <Stack>
      <RouteBoard
        title="Admin Dashboard"
        route="Both stores"
        date={date}
        accent={
          <>
            <LiveryHalf $store="amara" />
            <LiveryHalf $store="zeann" />
          </>
        }
      />
      <AsyncBoundary
        loading={summaries.loading}
        error={summaries.error}
        onRetry={summaries.reload}
        empty={null}
        skeleton={
          <Stack>
            <StatsSkeleton count={1} />
            <StatsSkeleton count={2} />
            <StatsSkeleton count={2} />
            <StatsSkeleton count={2} />
            <ListSkeleton rows={2} />
          </Stack>
        }
      >
        {data && periodSales && (
          <Stack gap="lg">
            <SegmentedControl
              label="Sales period"
              value={period}
              onChange={(next) => setPeriod(next as 'today' | 'weekly' | 'monthly')}
              options={[
                { value: 'today', label: 'Today' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
              ]}
            />
            <Stamp key={period}>
              <StatCard
                label={periodSales.heroLabel}
                value={<MoneyText amountMinor={periodSales.overall.totalMinor} />}
                caption={`${periodSales.overall.saleCount} ${periodSales.rangeCaption}`}
                tone="brand"
                icon={<Icon name="card" />}
                valueScale="hero"
                panel
              />
            </Stamp>

            <DepotBoard>
              {periodSales.perStore.map((row) => (
                <StoreColumn key={row.storeId}>
                  <ColumnHeader $store={row.storeId}>
                    <span>{storeNames[row.storeId]}</span>
                    <ColumnCount>{row.saleCount} sales</ColumnCount>
                  </ColumnHeader>
                  <DayFigure>
                    <DayValue>
                      <MoneyText amountMinor={row.totalMinor} />
                    </DayValue>
                    <DayCaption>{periodSales.columnCaption}</DayCaption>
                  </DayFigure>
                </StoreColumn>
              ))}
            </DepotBoard>

            <Section title="Credit & payments" variant="flush">
              <DepotBoard>
                <StatCard
                  label="Outstanding credit"
                  value={<MoneyText amountMinor={data.outstanding.totalMinor} />}
                  valueScale="large"
                  caption={`${data.outstanding.count} obligations`}
                  icon={<Icon name="alert" />}
                  badge={
                    <BalanceStateChip
                      state={data.outstanding.totalMinor > 0 ? 'attention' : 'healthy'}
                    />
                  }
                />
                <StatCard
                  label="Payments today"
                  value={<MoneyText amountMinor={data.payments.totalMinor} />}
                  valueScale="large"
                  caption={`${data.payments.count} payments`}
                  icon={<Icon name="card" />}
                />
              </DepotBoard>
            </Section>

            <Section
              title="Current stock"
              variant="flush"
              action={
                <Button variant="subtle" size="sm" onClick={() => navigate('/admin/inventory')}>
                  View all
                </Button>
              }
            >
              <RecordList
                caption="Current stock"
                variant="grouped"
                columns={[
                  { key: 'store', header: 'Store' },
                  { key: 'product', header: 'Product' },
                  { key: 'quantity', header: 'Quantity' },
                ]}
                rows={data.stock.slice(0, DASHBOARD_LIST_LIMIT).map((row) => ({
                  store: storeNames[row.storeId],
                  product: row.productName,
                  quantity: String(row.quantity),
                }))}
              />
            </Section>

            <Section
              title="Received stock"
              variant="flush"
              action={
                <Button variant="subtle" size="sm" onClick={() => navigate('/admin/receiving')}>
                  View all
                </Button>
              }
            >
              <RecordList
                caption="Received stock"
                variant="grouped"
                columns={[
                  { key: 'store', header: 'Store' },
                  { key: 'product', header: 'Product' },
                  { key: 'quantity', header: 'Quantity' },
                  { key: 'cost', header: 'Cost price' },
                ]}
                rows={data.received.slice(0, DASHBOARD_LIST_LIMIT).map((row) => ({
                  store: storeNames[row.storeId],
                  product: row.productName,
                  quantity: String(row.quantity),
                  cost: <MoneyText amountMinor={row.costPriceMinor} />,
                }))}
              />
            </Section>
          </Stack>
        )}
      </AsyncBoundary>
    </Stack>
  )
}
