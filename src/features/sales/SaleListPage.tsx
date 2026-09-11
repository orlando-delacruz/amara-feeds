import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listCustomers, listSales } from '@/services'
import { AsyncBoundary } from '@/components/ui/AsyncBoundary'
import { Button } from '@/components/ui/Button'
import { DateText } from '@/components/ui/DateText'
import { FilterBar } from '@/components/ui/FilterBar'
import { MoneyText } from '@/components/ui/MoneyText'
import { PageHeader } from '@/components/ui/PageHeader'
import { RecordList } from '@/components/ui/RecordList'
import { ListSkeleton } from '@/components/ui/Skeletons'
import { Stack } from '@/components/ui/Stack'
import { TextField } from '@/components/ui/TextField'
import { StoreControl, useAsyncData } from '@/features/shared'
import { todayIso } from '@/lib/dates'
import { formatDate } from '@/lib/format'
import { storeNames } from '@/store/stores'
import { useStore } from '@/store/useStore'

interface SaleListPageProps {
  basePath?: string
}

export function SaleListPage({ basePath = '/sales' }: SaleListPageProps) {
  const navigate = useNavigate()
  const { store } = useStore()
  const [date, setDate] = useState(todayIso())
  const sales = useAsyncData(() => listSales({ storeId: store, date }), `${store}:${date}`)
  const customers = useAsyncData(() => listCustomers())

  const customerNames = useMemo(
    () => new Map((customers.data ?? []).map((customer) => [customer.id, customer.name])),
    [customers.data],
  )

  return (
    <Stack>
      <PageHeader
        title="Sales"
        description={`Sales recorded at ${storeNames[store]}.`}
        actions={<Button onClick={() => navigate(`${basePath}/new`)}>New sale</Button>}
        size="compact"
      />
      <FilterBar>
        <StoreControl />
        <TextField
          id="sales-date"
          label="Date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </FilterBar>
      <AsyncBoundary
        loading={sales.loading}
        error={sales.error}
        onRetry={sales.reload}
        skeleton={<ListSkeleton rows={4} />}
        empty={
          sales.data && sales.data.length === 0
            ? {
                title: 'No sales on this date',
                description: 'Record the first sale of the day to see it here.',
                action: <Button onClick={() => navigate(`${basePath}/new`)}>New sale</Button>,
              }
            : null
        }
      >
        {sales.data && sales.data.length > 0 && (
          <RecordList
            caption={`Sales at ${storeNames[store]} on ${formatDate(date)}`}
            columns={[
              { key: 'customer', header: 'Customer' },
              { key: 'payment', header: 'Payment' },
              { key: 'items', header: 'Items' },
              { key: 'total', header: 'Total' },
              { key: 'createdAt', header: 'Recorded' },
            ]}
            rows={sales.data.map((sale) => ({
              customer: sale.customerId
                ? (customerNames.get(sale.customerId) ?? 'Not available')
                : 'No customer',
              payment: sale.paymentType === 'charge' ? 'Charge' : 'Cash',
              items: String(sale.lines.length),
              total: <MoneyText amountMinor={sale.totalMinor} />,
              createdAt: <DateText value={sale.createdAt} />,
            }))}
          />
        )}
      </AsyncBoundary>
    </Stack>
  )
}
