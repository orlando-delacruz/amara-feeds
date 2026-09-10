import { useState } from 'react'
import { Link } from 'react-router-dom'
import { listCredits, listCustomers } from '@/services'
import { AsyncBoundary } from '@/components/ui/AsyncBoundary'
import { DateText } from '@/components/ui/DateText'
import { MoneyText } from '@/components/ui/MoneyText'
import { PageHeader } from '@/components/ui/PageHeader'
import { RecordList } from '@/components/ui/RecordList'
import { Select } from '@/components/ui/Select'
import { Stack } from '@/components/ui/Stack'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAsyncData } from '@/features/shared'
import { storeNames } from '@/store/stores'
import type { CreditStatus } from '@/domain'

interface CreditListPageProps {
  basePath?: string
}

type StatusFilter = 'all' | CreditStatus

export function CreditListPage({ basePath = '/credit' }: CreditListPageProps) {
  const [status, setStatus] = useState<StatusFilter>('all')
  const credits = useAsyncData(() => listCredits())
  const customers = useAsyncData(() => listCustomers())

  const customerNames = new Map(
    (customers.data ?? []).map((customer) => [customer.id, customer.name]),
  )
  const filtered =
    credits.data?.filter((credit) => status === 'all' || credit.status === status) ?? []

  return (
    <Stack>
      <PageHeader
        title="Credit / Collection"
        description="Shared credit across both stores, with traceable origin and payment stores."
      />
      <Select
        id="credit-status"
        label="Status"
        value={status}
        onChange={(event) => setStatus(event.target.value as StatusFilter)}
        options={[
          { value: 'all', label: 'All' },
          { value: 'outstanding', label: 'Outstanding' },
          { value: 'settled', label: 'Settled' },
        ]}
      />
      <AsyncBoundary
        loading={credits.loading}
        loadingText="Loading credit…"
        error={credits.error}
        onRetry={credits.reload}
        empty={
          !credits.loading && !credits.error && filtered.length === 0
            ? {
                title: 'No credit records',
                description: 'Charge sales create shared credit obligations.',
              }
            : null
        }
      >
        {filtered.length > 0 && (
          <RecordList
            caption="Credit obligations"
            columns={[
              { key: 'customer', header: 'Customer' },
              { key: 'origin', header: 'Origin store' },
              { key: 'due', header: 'Due date' },
              { key: 'balance', header: 'Balance' },
              { key: 'status', header: 'Status' },
            ]}
            rows={filtered.map((credit) => ({
              customer: (
                <Link to={`${basePath}/${credit.id}`}>
                  {customerNames.get(credit.customerId) ?? 'Not available'}
                </Link>
              ),
              origin: storeNames[credit.originStoreId],
              due: <DateText value={credit.dueDate} />,
              balance: <MoneyText amountMinor={credit.balanceMinor} />,
              status: <StatusBadge status={credit.status} />,
            }))}
          />
        )}
      </AsyncBoundary>
    </Stack>
  )
}
