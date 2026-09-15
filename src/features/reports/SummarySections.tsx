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
import { useReportSummaries } from '@/features/reports/useReportSummaries'
import type { DataTableRow } from '@/components/ui/DataTable'
import type { StoreId } from '@/domain'

interface SummarySectionsProps {
  from: string
  to: string
  /** When given, store-specific summaries are scoped to this store. */
  storeId?: StoreId
  summaries: ReturnType<typeof useReportSummaries>
}

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 9rem), 1fr));
  gap: ${({ theme }) => theme.space.md};
`

const CardTitle = styled.span`
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  overflow-wrap: break-word;
`

const MetaRow = styled.span`
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space.md};
  font-size: ${({ theme }) => theme.font.size.sm};
`

const MetaLabel = styled.span`
  color: ${({ theme }) => theme.color.text.muted};
`

const MetaValue = styled.span`
  text-align: right;
  overflow-wrap: break-word;
  font-variant-numeric: tabular-nums;
`

function productCard(
  productKey: string,
  rows: Array<[string, React.ReactNode]>,
): (row: DataTableRow) => React.ReactNode {
  return (row) => (
    <>
      <CardTitle>{row[productKey]}</CardTitle>
      {rows.map(([label, key]) => (
        <MetaRow key={String(key)}>
          <MetaLabel>{label}</MetaLabel>
          <MetaValue>{row[key as string]}</MetaValue>
        </MetaRow>
      ))}
    </>
  )
}

export function SummarySections({ from, to, storeId, summaries }: SummarySectionsProps) {
  const stockWide = !storeId
  const rangeLabel =
    from === to ? (
      <DateText value={from} />
    ) : (
      <>
        From <DateText value={from} /> to <DateText value={to} />
      </>
    )

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
          <Section title={<>Sales by store {rangeLabel}</>} variant="flush">
            <RecordList
              caption="Sales by store"
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
              label="Overall sales"
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

          <Section title="Sales by mode of payment" variant="flush">
            <RecordList
              caption="Sales by mode of payment"
              columns={[
                { key: 'method', header: 'Mode of payment' },
                { key: 'sales', header: 'Sales' },
                { key: 'total', header: 'Total' },
              ]}
              rows={summaries.data.byPaymentMethod.map((row) => ({
                method: row.method,
                sales: String(row.saleCount),
                total: <MoneyText amountMinor={row.totalMinor} />,
              }))}
            />
          </Section>

          <Section title="Current stock" variant="flush">
            <RecordList
              caption="Current stock"
              variant="grouped"
              columns={
                stockWide
                  ? [
                      { key: 'store', header: 'Store' },
                      { key: 'product', header: 'Product' },
                      { key: 'quantity', header: 'Quantity' },
                    ]
                  : [
                      { key: 'product', header: 'Product' },
                      { key: 'quantity', header: 'Quantity' },
                    ]
              }
              rows={summaries.data.stock.map((row) => ({
                store: storeNames[row.storeId],
                product: row.productName,
                quantity: String(row.quantity),
              }))}
              renderCard={productCard(
                'product',
                stockWide
                  ? [
                      ['Store', 'store'],
                      ['Quantity', 'quantity'],
                    ]
                  : [['Quantity', 'quantity']],
              )}
            />
          </Section>

          <Section title={<>Received stock {rangeLabel}</>} variant="flush">
            <RecordList
              caption="Received stock"
              variant="grouped"
              columns={
                stockWide
                  ? [
                      { key: 'store', header: 'Store' },
                      { key: 'product', header: 'Product' },
                      { key: 'quantity', header: 'Quantity' },
                      { key: 'cost', header: 'Cost price' },
                    ]
                  : [
                      { key: 'product', header: 'Product' },
                      { key: 'quantity', header: 'Quantity' },
                      { key: 'cost', header: 'Cost price' },
                    ]
              }
              rows={summaries.data.received.map((row) => ({
                store: storeNames[row.storeId],
                product: row.productName,
                quantity: String(row.quantity),
                cost: <MoneyText amountMinor={row.costPriceMinor} />,
              }))}
              renderCard={productCard(
                'product',
                stockWide
                  ? [
                      ['Store', 'store'],
                      ['Quantity', 'quantity'],
                      ['Cost price', 'cost'],
                    ]
                  : [
                      ['Quantity', 'quantity'],
                      ['Cost price', 'cost'],
                    ],
              )}
            />
          </Section>
        </Stack>
      )}
    </AsyncBoundary>
  )
}
