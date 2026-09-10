import styled from 'styled-components'
import {
  getCurrentStock,
  getDailySalesByStore,
  getOutstandingCreditTotal,
  getOverallDailySales,
  getPaymentsSummary,
  getReceivedStock,
} from '@/services'
import { DateText } from '@/components/ui/DateText'
import { MoneyText } from '@/components/ui/MoneyText'
import { RecordList } from '@/components/ui/RecordList'
import { Section } from '@/components/ui/Section'
import { Stack } from '@/components/ui/Stack'
import { StatCard } from '@/components/ui/StatCard'
import { AsyncBoundary } from '@/components/ui/AsyncBoundary'
import { useAsyncData } from '@/features/shared'
import { storeNames } from '@/store/stores'

interface SummarySectionsProps {
  date: string
}

const Stats = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.space.md};

  @media (min-width: ${({ theme }) => theme.breakpoint.tablet}) {
    grid-template-columns: repeat(3, 1fr);
  }
`

export function SummarySections({ date }: SummarySectionsProps) {
  const summaries = useAsyncData(async () => {
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

  return (
    <AsyncBoundary
      loading={summaries.loading}
      loadingText="Loading summaries…"
      error={summaries.error}
      onRetry={summaries.reload}
      empty={null}
    >
      {summaries.data && (
        <Stack>
          <Section
            title={
              <>
                Daily sales by store <DateText value={date} />
              </>
            }
          >
            <RecordList
              caption="Daily sales by store"
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
            />
            <StatCard
              label="Outstanding credit"
              value={<MoneyText amountMinor={summaries.data.outstanding.totalMinor} />}
              caption={`${summaries.data.outstanding.count} obligations`}
            />
            <StatCard
              label="Payments"
              value={<MoneyText amountMinor={summaries.data.payments.totalMinor} />}
              caption={`${summaries.data.payments.count} payments`}
            />
          </Stats>

          <Section title="Current stock">
            <RecordList
              caption="Current stock"
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
          >
            <RecordList
              caption="Received stock"
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
