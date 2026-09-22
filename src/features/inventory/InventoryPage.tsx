import { useState } from 'react'
import styled from 'styled-components'
import { approveStock, deleteStock, getCurrentStock, listStorePrices } from '@/services'
import { AsyncBoundary } from '@/components/ui/AsyncBoundary'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { RecordList } from '@/components/ui/RecordList'
import { ListSkeleton } from '@/components/ui/Skeletons'
import { Stack } from '@/components/ui/Stack'
import { useAsyncData, useAlertMutation } from '@/features/shared'
import { confirmAction, notifySuccess } from '@/lib/swal'
import { useSession } from '@/features/session/useSession'
import { isAllStores, storeLabel, storeNames } from '@/store/stores'
import { useStore } from '@/store/useStore'
import { EditStockDialog } from './EditStockDialog'
import type { ProductId, StoreId } from '@/domain'
import type { Money } from '@/lib/money'

interface Row {
  storeId: StoreId
  productId: ProductId
  productName: string
  quantity: number
  adminApproved?: boolean
  priceMinor?: Money
}

const RowActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space.sm};
  justify-content: flex-end;
`

const StoreCell = styled.span`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.color.text.secondary};
`

const ApprovedCell = styled.span`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.color.text.muted};
`

export function InventoryPage() {
  const { store } = useStore()
  const { user } = useSession()
  const isAdmin = user?.role === 'admin'
  const [editing, setEditing] = useState<Row | null>(null)
  // "All stores" shows both stores combined; a concrete store filters to it.
  const allMode = isAllStores(store)
  const { data, loading, error, reload } = useAsyncData(async () => {
    const stock = await getCurrentStock()
    return allMode ? stock : stock.filter((row) => row.storeId === store)
  }, store)
  // Effective selling prices: stock-row price wins, latest receipt fills gaps.
  const storePrices = useAsyncData(
    () =>
      allMode
        ? Promise.resolve<Record<string, Money>>({})
        : listStorePrices(store as 'amara' | 'zeann'),
    store,
  )
  function effectivePrice(row: Row): Money | undefined {
    return row.priceMinor ?? storePrices.data?.[row.productId]
  }
  const remove = useAlertMutation(
    (input: { storeId: StoreId; productId: ProductId }) =>
      deleteStock(input.storeId, input.productId, {
        userId: user?.id ?? '',
        role: user?.role ?? 'staff',
      }),
    'Could not delete the stock.',
  )
  const approve = useAlertMutation(
    (input: { storeId: StoreId; productId: ProductId }) =>
      approveStock(input.storeId, input.productId, {
        userId: user?.id ?? '',
        role: user?.role ?? 'staff',
      }),
    'Could not approve the inventory.',
  )

  function productNameOf(row: Row): string {
    return (
      (data ?? []).find((item) => item.productId === row.productId && item.storeId === row.storeId)
        ?.productName ?? 'Item'
    )
  }

  async function requestDelete(row: Row) {
    const confirmed = await confirmAction({
      title: 'Delete stock?',
      text: `Delete all stock of "${productNameOf(row)}" at ${storeNames[row.storeId]}? This cannot be undone. Items with sales at this store cannot be deleted.`,
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!confirmed) {
      return
    }
    const removed = await remove.run({ storeId: row.storeId, productId: row.productId })
    if (removed) {
      void notifySuccess(`Stock for "${productNameOf(row)}" deleted.`)
      reload()
    }
  }

  async function requestApprove(row: Row) {
    const confirmed = await confirmAction({
      title: 'Approve inventory?',
      text: `Approve the stock of "${productNameOf(row)}" at ${storeNames[row.storeId]}? Store staff will no longer be able to edit or delete it — only you can.`,
      confirmLabel: 'Approve',
    })
    if (!confirmed) {
      return
    }
    const approved = await approve.run({ storeId: row.storeId, productId: row.productId })
    if (approved) {
      void notifySuccess(`Inventory for "${productNameOf(row)}" approved.`)
      reload()
    }
  }

  type RowWithActions = Row & Record<string, React.ReactNode>
  const rows: RowWithActions[] = (data ?? []).map((row) => ({
    ...row,
    product: row.productName,
    store: <StoreCell>{storeNames[row.storeId]}</StoreCell>,
    quantityDisplay: String(row.quantity),
    approved: row.adminApproved ? <ApprovedCell>Approved</ApprovedCell> : '',
    // Inventory correction is admin-only (DEC-050): staff see data only.
    actions: isAdmin ? (
      <RowActions>
        {!row.adminApproved && (
          <Button
            size="sm"
            variant="secondary"
            disabled={approve.pending}
            onClick={() => void requestApprove(row)}
          >
            Approve
          </Button>
        )}
        <Button size="sm" variant="secondary" onClick={() => setEditing(row)}>
          Edit
        </Button>
        <Button
          size="sm"
          variant="danger"
          disabled={remove.pending}
          onClick={() => void requestDelete(row)}
        >
          Delete
        </Button>
      </RowActions>
    ) : (
      <ApprovedCell>Admin-managed</ApprovedCell>
    ),
  }))

  return (
    <Stack>
      <PageHeader
        title="Inventory"
        description={`Current stock for ${storeLabel(store)}. Stock changes automatically on sales and receiving.`}
        size="compact"
      />
      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={reload}
        skeleton={<ListSkeleton rows={4} />}
        empty={
          data && data.length === 0
            ? {
                title: 'No stock yet',
                description: 'Receive stock to begin tracking inventory.',
              }
            : null
        }
      >
        {rows.length > 0 && (
          <RecordList
            caption={`Current stock — ${storeLabel(store)}`}
            columns={[
              { key: 'product', header: 'Product' },
              ...(allMode ? ([{ key: 'store', header: 'Store' }] as const) : []),
              { key: 'quantityDisplay', header: 'Quantity' },
              { key: 'approved', header: 'Status' },
              { key: 'actions', header: 'Actions' },
            ]}
            rows={rows}
          />
        )}
      </AsyncBoundary>
      <EditStockDialog
        key={editing?.productId ?? 'none'}
        row={editing ? { ...editing, priceMinor: effectivePrice(editing) } : null}
        actorUserId={user?.id}
        actorRole={user?.role ?? 'staff'}
        onClose={() => setEditing(null)}
        onSaved={(quantity, previousQuantity) => {
          void notifySuccess(`Stock adjusted from ${previousQuantity} to ${quantity}.`)
          setEditing(null)
          reload()
        }}
      />
    </Stack>
  )
}
