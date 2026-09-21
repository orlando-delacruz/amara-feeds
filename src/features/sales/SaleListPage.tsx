import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteSale, listCustomers, listSales, listUsers } from '@/services'
import { AsyncBoundary } from '@/components/ui/AsyncBoundary'
import { Button } from '@/components/ui/Button'
import { DatePicker } from '@/components/ui/DatePicker'
import { DateText } from '@/components/ui/DateText'
import { FilterBar } from '@/components/ui/FilterBar'
import { MoneyText } from '@/components/ui/MoneyText'
import { PageHeader } from '@/components/ui/PageHeader'
import { RecordList } from '@/components/ui/RecordList'
import { ListSkeleton } from '@/components/ui/Skeletons'
import { Stack } from '@/components/ui/Stack'
import { useAsyncData, useAlertMutation } from '@/features/shared'
import { StoreControl } from '@/features/shared'
import { getDisplayName } from '@/features/session/displayName'
import { confirmAction, notifySuccess } from '@/lib/swal'
import { useSession } from '@/features/session/useSession'
import { todayIso } from '@/lib/dates'
import { formatDate } from '@/lib/format'
import { concreteStoreId, isAllStores, storeNames, storeLabel } from '@/store/stores'
import { useStore } from '@/store/useStore'

interface SaleListPageProps {
  basePath?: string
}

export function SaleListPage({ basePath = '/sales' }: SaleListPageProps) {
  const navigate = useNavigate()
  const { store } = useStore()
  const { user } = useSession()
  const isAdmin = user?.role === 'admin'
  const [date, setDate] = useState(todayIso())
  // 'All stores' lists both stores' sales combined.
  const allMode = isAllStores(store)
  const contextStoreId = concreteStoreId(store)
  const sales = useAsyncData(
    () => listSales(allMode ? { date } : { storeId: contextStoreId, date }),
    `${store}:${date}`,
  )
  const customers = useAsyncData(() => listCustomers())
  const users = useAsyncData(() => listUsers())
  const remove = useAlertMutation(
    (saleId: string) => deleteSale(saleId),
    'Could not delete the sale.',
  )

  async function requestDelete(saleId: string) {
    const confirmed = await confirmAction({
      title: 'Delete this sale?',
      text: 'The sold quantities return to the current stock of the same store. A sale with recorded payments cannot be deleted.',
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!confirmed) {
      return
    }
    const deleted = await remove.run(saleId)
    if (deleted) {
      void notifySuccess('Sale deleted.', 'The stock was restored to this store.')
      sales.reload()
    }
  }

  const customerNames = useMemo(
    () => new Map((customers.data ?? []).map((customer) => [customer.id, customer.name])),
    [customers.data],
  )

  const userNames = useMemo(
    () => new Map((users.data ?? []).map((item) => [item.id, getDisplayName(item.name)])),
    [users.data],
  )

  return (
    <Stack>
      <PageHeader
        title="Sales"
        description={`Sales recorded at ${storeLabel(store)}.`}
        actions={<Button onClick={() => navigate(`${basePath}/new`)}>New sale</Button>}
        size="compact"
      />
      {/* Quick store switch for admins (DEC-046); staff render nothing. */}
      <StoreControl />
      <FilterBar>
        <DatePicker id="sales-date" label="Date" value={date} onChange={setDate} />
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
            caption={`Sales — ${storeLabel(store)} — ${formatDate(date)}`}
            columns={[
              { key: 'customer', header: 'Customer' },
              ...(allMode ? ([{ key: 'store', header: 'Store' }] as const) : []),
              { key: 'payment', header: 'Payment' },
              { key: 'items', header: 'Items' },
              { key: 'total', header: 'Total' },
              { key: 'recordedBy', header: 'Recorded by' },
              { key: 'createdAt', header: 'Recorded' },
              ...(isAdmin ? ([{ key: 'actions', header: 'Actions' }] as const) : []),
            ]}
            rows={sales.data.map((sale) => ({
              customer: sale.customerId
                ? (customerNames.get(sale.customerId) ?? 'Not available')
                : 'No customer',
              ...(allMode ? { store: storeNames[sale.storeId] } : {}),
              payment: sale.paymentType === 'charge' ? 'Charge' : 'Cash',
              items: String(sale.lines.length),
              total: <MoneyText amountMinor={sale.totalMinor} />,
              recordedBy: userNames.get(sale.recordedByUserId) ?? 'Not available',
              createdAt: <DateText value={sale.createdAt} />,
              ...(isAdmin
                ? {
                    actions: (
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={remove.pending}
                        onClick={() => void requestDelete(sale.id)}
                      >
                        Delete
                      </Button>
                    ),
                  }
                : {}),
            }))}
          />
        )}
      </AsyncBoundary>
    </Stack>
  )
}
