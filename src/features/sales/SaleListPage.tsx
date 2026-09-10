import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listCustomers, listSales } from '@/services'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { DateText } from '@/components/ui/DateText'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingState } from '@/components/ui/LoadingState'
import { MoneyText } from '@/components/ui/MoneyText'
import { PageHeader } from '@/components/ui/PageHeader'
import { Stack } from '@/components/ui/Stack'
import { TextField } from '@/components/ui/TextField'
import { useAsyncData } from '@/features/shared'
import { todayIso } from '@/lib/dates'
import { storeNames } from '@/store/stores'
import { useStore } from '@/store/useStore'

export function SaleListPage() {
  const navigate = useNavigate()
  const { store } = useStore()
  const [date, setDate] = useState(todayIso())
  const sales = useAsyncData(() => listSales({ storeId: store, date }), `${store}:${date}`)
  const customers = useAsyncData(() => listCustomers())

  const customerNames = new Map(
    (customers.data ?? []).map((customer) => [customer.id, customer.name]),
  )

  return (
    <Stack>
      <PageHeader
        title="Sales"
        description={`Sales recorded at ${storeNames[store]}.`}
        actions={<Button onClick={() => navigate('/sales/new')}>New sale</Button>}
      />
      <TextField
        id="sales-date"
        label="Date"
        type="date"
        value={date}
        onChange={(event) => setDate(event.target.value)}
      />
      {sales.loading && <LoadingState text="Loading sales…" />}
      {sales.error && <ErrorState description={sales.error} onRetry={sales.reload} />}
      {!sales.loading && !sales.error && sales.data && sales.data.length === 0 && (
        <EmptyState
          title="No sales on this date"
          description="Record the first sale of the day to see it here."
          action={<Button onClick={() => navigate('/sales/new')}>New sale</Button>}
        />
      )}
      {!sales.loading && !sales.error && sales.data && sales.data.length > 0 && (
        <DataTable
          caption={`Sales — ${storeNames[store]} — ${date}`}
          columns={[
            { key: 'customer', header: 'Customer' },
            { key: 'payment', header: 'Payment' },
            { key: 'items', header: 'Items' },
            { key: 'total', header: 'Total' },
            { key: 'createdAt', header: 'Recorded' },
          ]}
          rows={sales.data.map((sale) => ({
            customer: sale.customerId ? (customerNames.get(sale.customerId) ?? 'Unknown') : '—',
            payment: sale.paymentType === 'charge' ? 'Charge' : 'Cash',
            items: String(sale.lines.length),
            total: <MoneyText amountMinor={sale.totalMinor} />,
            createdAt: <DateText value={sale.createdAt} />,
          }))}
        />
      )}
    </Stack>
  )
}
