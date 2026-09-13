import styled from 'styled-components'
import { DateText } from '@/components/ui/DateText'
import { MoneyText } from '@/components/ui/MoneyText'
import { RecordList } from '@/components/ui/RecordList'
import { Section } from '@/components/ui/Section'
import { Stack } from '@/components/ui/Stack'
import { StatCard } from '@/components/ui/StatCard'
import { AsyncBoundary } from '@/components/ui/AsyncBoundary'
import { Icon } from '@/components/ui/icons'
import { ListSkeleton, StatsSkeleton } from '@/components/ui/Skeletons'
import { storeNames } from '@/store/stores'
import { useBusinessSummaries } from '@/features/dashboard/useBusinessSummaries'
import type { StoreId } from '@/domain'

interface SummarySectionsProps {
  date: string
  /** When given, store-specific summaries are scoped to this store. */
  storeId?: StoreId
}

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  gap: ${({ theme }) => theme.space.md};
`

export function SummarySections({ date, storeId }: SummarySectionsProps) {
  const summaries = useBusinessSummaries(date, storeId)

  return (
    <AsyncBoundary
      loading={summaries.loading}
      error={summaries.error}
      onRetry={summaries.reload}
      empty={null}
      skeleton={
        <Stack>
          <StatsSkeleton count={3} />
          <ListSkeleton rows={3} />
        </Stack>
      }
    >
      {summaries.data && (
        <Stack>
          <Section
            title={
              <>
                Daily sales by store <DateText value={date} />
              </>
            }
            variant="flush"
          >
            <RecordList
              caption="Daily sales by store"
              variant="grouped"
              columns={[
                { key: 'store', header: 'Store' },
                { key: 'sales', header: 'Sales' },
                { key: 'total', header: 'Total' },
              ]}
              rows={summaries.data.perStore.map((row) => ({
                store: storeNames[row.storeId],
                sales: String(row.saleCount),
                total: <MoneyText amountMinor={row.totalMinor} />,
              }))}
            />
          </Section>

          <Stats>
            <StatCard
              label="Overall daily sales"
              value={<MoneyText amountMinor={summaries.data.overall.totalMinor} />}
              caption={`${summaries.data.overall.saleCount} sales`}
              tone="brand"
              icon={<Icon name="card" />}
            />
            <StatCard
              label="Outstanding credit"
              value={<MoneyText amountMinor={summaries.data.outstanding.totalMinor} />}
              caption={`${summaries.data.outstanding.count} obligations`}
              icon={<Icon name="alert" />}
            />
            <StatCard
              label="Payments"
              value={<MoneyText amountMinor={summaries.data.payments.totalMinor} />}
              caption={`${summaries.data.payments.count} payments`}
              icon={<Icon name="card" />}
            />
          </Stats>

          <Section title="Current stock" variant="flush">
            <RecordList
              caption="Current stock"
              variant="grouped"
              columns={[
                { key: 'store', header: 'Store' },
                { key: 'product', header: 'Product' },
                { key: 'quantity', header: 'Quantity' },
              ]}
              rows={summaries.data.stock.map((row) => ({
                store: storeNames[row.storeId],
                product: row.productName,
                quantity: String(row.quantity),
              }))}
            />
          </Section>

          <Section
            title={
              <>
                Received stock <DateText value={date} />
              </>
            }
            variant="flush"
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
              rows={summaries.data.received.map((row) => ({
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
  )
}
