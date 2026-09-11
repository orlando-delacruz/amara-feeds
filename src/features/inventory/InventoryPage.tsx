import { getCurrentStock } from '@/services'
import { AsyncBoundary } from '@/components/ui/AsyncBoundary'
import { FilterBar } from '@/components/ui/FilterBar'
import { PageHeader } from '@/components/ui/PageHeader'
import { RecordList } from '@/components/ui/RecordList'
import { ListSkeleton } from '@/components/ui/Skeletons'
import { Stack } from '@/components/ui/Stack'
import { StoreControl, useAsyncData } from '@/features/shared'
import { storeNames } from '@/store/stores'
import { useStore } from '@/store/useStore'

export function InventoryPage() {
  const { store, canSwitchStore } = useStore()
  const { data, loading, error, reload } = useAsyncData(async () => {
    const stock = await getCurrentStock()
    return stock.filter((row) => row.storeId === store)
  }, store)

  return (
    <Stack>
      <PageHeader
        title="Inventory"
        description={`Current stock for ${storeNames[store]}. Stock changes automatically on sales and receiving.`}
        size="compact"
      />
      {canSwitchStore && (
        <FilterBar>
          <StoreControl />
        </FilterBar>
      )}
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
        {data && data.length > 0 && (
          <RecordList
            caption={`Current stock at ${storeNames[store]}`}
            columns={[
              { key: 'product', header: 'Product' },
              { key: 'quantity', header: 'Quantity' },
            ]}
            rows={data.map((row) => ({
              product: row.productName,
              quantity: String(row.quantity),
            }))}
          />
        )}
      </AsyncBoundary>
    </Stack>
  )
}
