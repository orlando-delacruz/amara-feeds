import { getCurrentStock } from '@/services'
import { AsyncBoundary } from '@/components/ui/AsyncBoundary'
import { PageHeader } from '@/components/ui/PageHeader'
import { RecordList } from '@/components/ui/RecordList'
import { Stack } from '@/components/ui/Stack'
import { useAsyncData } from '@/features/shared'
import { storeNames } from '@/store/stores'
import { useStore } from '@/store/useStore'

export function InventoryPage() {
  const { store } = useStore()
  const { data, loading, error, reload } = useAsyncData(async () => {
    const stock = await getCurrentStock()
    return stock.filter((row) => row.storeId === store)
  }, store)

  return (
    <Stack>
      <PageHeader
        title="Inventory"
        description={`Current stock for ${storeNames[store]}. Stock changes automatically on sales and receiving.`}
      />
      <AsyncBoundary
        loading={loading}
        loadingText="Loading inventory…"
        error={error}
        onRetry={reload}
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
