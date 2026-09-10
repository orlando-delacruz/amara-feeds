import styled from 'styled-components'
import {
  getCurrentStock,
  getDailySalesByStore,
  getOutstandingCreditTotal,
  getOverallDailySales,
  getPaymentsSummary,
  getReceivedStock,
} from '@/services'
import { DataTable } from '@/components/ui/DataTable'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingState } from '@/components/ui/LoadingState'
import { MoneyText } from '@/components/ui/MoneyText'
import { Stack } from '@/components/ui/Stack'
import { useAsyncData } from '@/features/shared'
import { storeNames } from '@/store/stores'

interface SummarySectionsProps {
  date: string
}

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};
`

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
`

const SummaryLine = styled.p`
  color: ${({ theme }) => theme.color.text.secondary};
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

  if (summaries.loading) {
    return <LoadingState text="Loading summaries…" />
  }
  if (summaries.error) {
    return <ErrorState description={summaries.error} onRetry={summaries.reload} />
  }
  if (!summaries.data) {
    return null
  }

  const { perStore, overall, outstanding, payments, stock, received } = summaries.data

  return (
    <Stack>
      <Section>
        <SectionTitle>Daily sales by store — {date}</SectionTitle>
        <DataTable
          caption="Daily sales by store"
          columns={[
            { key: 'store', header: 'Store' },
            { key: 'sales', header: 'Sales' },
            { key: 'total', header: 'Total' },
          ]}
          rows={perStore.map((row) => ({
            store: storeNames[row.storeId],
            sales: String(row.saleCount),
            total: <MoneyText amountMinor={row.totalMinor} />,
          }))}
        />
      </Section>

      <Section>
        <SectionTitle>Overall daily sales</SectionTitle>
        <SummaryLine>
          {overall.saleCount} sales · <MoneyText amountMinor={overall.totalMinor} />
        </SummaryLine>
      </Section>

      <Section>
        <SectionTitle>Outstanding credit</SectionTitle>
        <SummaryLine>
          {outstanding.count} obligations · <MoneyText amountMinor={outstanding.totalMinor} />
        </SummaryLine>
      </Section>

      <Section>
        <SectionTitle>Payments — {date}</SectionTitle>
        <SummaryLine>
          {payments.count} payments · <MoneyText amountMinor={payments.totalMinor} />
        </SummaryLine>
      </Section>

      <Section>
        <SectionTitle>Current stock</SectionTitle>
        <DataTable
          caption="Current stock"
          columns={[
            { key: 'store', header: 'Store' },
            { key: 'product', header: 'Product' },
            { key: 'quantity', header: 'Quantity' },
          ]}
          rows={stock.map((row) => ({
            store: storeNames[row.storeId],
            product: row.productName,
            quantity: String(row.quantity),
          }))}
        />
      </Section>

      <Section>
        <SectionTitle>Received stock — {date}</SectionTitle>
        <DataTable
          caption="Received stock"
          columns={[
            { key: 'store', header: 'Store' },
            { key: 'product', header: 'Product' },
            { key: 'quantity', header: 'Quantity' },
            { key: 'cost', header: 'Cost price' },
          ]}
          rows={received.map((row) => ({
            store: storeNames[row.storeId],
            product: row.productName,
            quantity: String(row.quantity),
            cost: <MoneyText amountMinor={row.costPriceMinor} />,
          }))}
        />
      </Section>
    </Stack>
  )
}
