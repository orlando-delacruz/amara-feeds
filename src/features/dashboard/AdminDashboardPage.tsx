import styled from 'styled-components'
import { AsyncBoundary } from '@/components/ui/AsyncBoundary'
import { DateText } from '@/components/ui/DateText'
import { MoneyText } from '@/components/ui/MoneyText'
import { PageHeader } from '@/components/ui/PageHeader'
import { RecordList } from '@/components/ui/RecordList'
import { Section } from '@/components/ui/Section'
import { Stack } from '@/components/ui/Stack'
import { StatCard } from '@/components/ui/StatCard'
import { Icon } from '@/components/ui/icons'
import { ListSkeleton, StatsSkeleton } from '@/components/ui/Skeletons'
import { todayIso } from '@/lib/dates'
import { storeNames } from '@/store/stores'
import { useBusinessSummaries } from './useBusinessSummaries'

const Hero = styled.div`
  padding: ${({ theme }) => theme.space.xl} ${({ theme }) => theme.space.lg};
  background: ${({ theme }) => theme.color.brand.gradient};
  border-radius: ${({ theme }) => theme.radius.xl};
  box-shadow: ${({ theme }) => theme.shadow.md};
  color: ${({ theme }) => theme.color.text.inverse};
`

const HeroLabel = styled.p`
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  letter-spacing: ${({ theme }) => theme.font.tracking.wide};
  text-transform: uppercase;
  opacity: 0.85;
`

const HeroValue = styled.p`
  margin-top: ${({ theme }) => theme.space.xs};
  font-size: ${({ theme }) => theme.font.size.hero};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  line-height: ${({ theme }) => theme.font.lineHeight.tight};
  letter-spacing: ${({ theme }) => theme.font.tracking.tight};
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.color.text.inverse};
  text-wrap: balance;
`

const HeroCaption = styled.p`
  margin-top: ${({ theme }) => theme.space.xs};
  font-size: ${({ theme }) => theme.font.size.sm};
  opacity: 0.8;
`

const PairGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  gap: ${({ theme }) => theme.space.md};
`

export function AdminDashboardPage() {
  const date = todayIso()
  const summaries = useBusinessSummaries(date)
  const data = summaries.data

  return (
    <Stack>
      <PageHeader
        title="Admin Dashboard"
        description={
          <>
            Today <DateText value={date} /> · both stores
          </>
        }
        size="compact"
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
            <ListSkeleton rows={2} />
          </Stack>
        }
      >
        {data && (
          <Stack>
            <Hero>
              <HeroLabel>Overall daily sales</HeroLabel>
              <HeroValue>
                <MoneyText amountMinor={data.overall.totalMinor} />
              </HeroValue>
              <HeroCaption>{data.overall.saleCount} sales today across Amara and Zeann</HeroCaption>
            </Hero>
            <Section title="Daily sales by store" variant="flush">
              <PairGrid>
                {data.perStore.map((row) => (
                  <StatCard
                    key={row.storeId}
                    label={storeNames[row.storeId]}
                    value={<MoneyText amountMinor={row.totalMinor} />}
                    caption={`${row.saleCount} sales`}
                    tone={row.storeId}
                    valueScale="medium"
                  />
                ))}
              </PairGrid>
            </Section>
            <Section title="Credit & payments" variant="flush">
              <Stack gap="sm">
                <StatCard
                  label="Outstanding credit"
                  value={<MoneyText amountMinor={data.outstanding.totalMinor} />}
                  caption={`${data.outstanding.count} obligations`}
                  icon={<Icon name="alert" />}
                  orientation="row"
                />
                <StatCard
                  label="Payments today"
                  value={<MoneyText amountMinor={data.payments.totalMinor} />}
                  caption={`${data.payments.count} payments`}
                  icon={<Icon name="card" />}
                  orientation="row"
                />
              </Stack>
            </Section>
            <Section title="Current stock" variant="flush">
              <RecordList
                caption="Current stock"
                variant="grouped"
                columns={[
                  { key: 'store', header: 'Store' },
                  { key: 'product', header: 'Product' },
                  { key: 'quantity', header: 'Quantity' },
                ]}
                rows={data.stock.map((row) => ({
                  store: storeNames[row.storeId],
                  product: row.productName,
                  quantity: String(row.quantity),
                }))}
              />
            </Section>
            <Section title="Received stock" variant="flush">
              <RecordList
                caption="Received stock"
                variant="grouped"
                columns={[
                  { key: 'store', header: 'Store' },
                  { key: 'product', header: 'Product' },
                  { key: 'quantity', header: 'Quantity' },
                  { key: 'cost', header: 'Cost price' },
                ]}
                rows={data.received.map((row) => ({
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
