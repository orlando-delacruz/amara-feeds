import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listCredits, listCustomers, listProducts } from '@/services'
import { AsyncBoundary } from '@/components/ui/AsyncBoundary'
import { Button } from '@/components/ui/Button'
import { DateText } from '@/components/ui/DateText'
import { ListRow } from '@/components/ui/ListRow'
import { MoneyText } from '@/components/ui/MoneyText'
import { PageHeader } from '@/components/ui/PageHeader'
import { RecordList } from '@/components/ui/RecordList'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { ListSkeleton } from '@/components/ui/Skeletons'
import { Stack } from '@/components/ui/Stack'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAsyncData } from '@/features/shared'
import { notifySuccess } from '@/lib/swal'
import { useSession } from '@/features/session/useSession'
import { concreteStoreId, storeNames } from '@/store/stores'
import { useStore } from '@/store/useStore'
import { ExistingCreditDialog } from './ExistingCreditDialog'
import type { CreditStatus } from '@/domain'

interface CreditListPageProps {
  basePath?: string
}

type StatusFilter = 'all' | CreditStatus

export function CreditListPage({ basePath = '/credit' }: CreditListPageProps) {
  const [status, setStatus] = useState<StatusFilter>('all')
  const [existingOpen, setExistingOpen] = useState(false)
  const { user } = useSession()
  const { store } = useStore()
  const credits = useAsyncData(() => listCredits())
  const customers = useAsyncData(() => listCustomers())
  const products = useAsyncData(() => listProducts())
  const isAdmin = user?.role === 'admin'

  const customerNames = useMemo(
    () => new Map((customers.data ?? []).map((customer) => [customer.id, customer.name])),
    [customers.data],
  )
  const filtered =
    credits.data?.filter((credit) => status === 'all' || credit.status === status) ?? []

  return (
    <Stack>
      <PageHeader
        title="Credit / Collection"
        description="Shared credit across both stores, with traceable origin and payment stores."
        size="compact"
      />
      {isAdmin && (
        <div>
          <Button variant="secondary" onClick={() => setExistingOpen(true)}>
            Add existing credit
          </Button>
        </div>
      )}
      <SegmentedControl
        label="Status"
        value={status}
        onChange={(value) => setStatus(value as StatusFilter)}
        options={[
          { value: 'all', label: 'All' },
          { value: 'outstanding', label: 'Outstanding' },
          { value: 'settled', label: 'Settled' },
        ]}
      />
      <AsyncBoundary
        loading={credits.loading}
        error={credits.error}
        onRetry={credits.reload}
        skeleton={<ListSkeleton rows={4} />}
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
            renderCard={(_row, index) => {
              const credit = filtered[index]
              if (!credit) {
                return null
              }
              return (
                <ListRow
                  title={customerNames.get(credit.customerId) ?? 'Not available'}
                  subtitle={
                    <>
                      {storeNames[credit.originStoreId]} · Due <DateText value={credit.dueDate} />
                    </>
                  }
                  trailing={<MoneyText amountMinor={credit.balanceMinor} />}
                  href={`${basePath}/${credit.id}`}
                />
              )
            }}
          />
        )}
      </AsyncBoundary>
      <ExistingCreditDialog
        open={existingOpen}
        customers={customers.data ?? []}
        products={products.data ?? []}
        defaultStoreId={concreteStoreId(store)}
        onClose={() => setExistingOpen(false)}
        onCreated={() => {
          setExistingOpen(false)
          void notifySuccess('Existing credit encoded.', 'The balance was added for this customer.')
          credits.reload()
        }}
      />
    </Stack>
  )
}
