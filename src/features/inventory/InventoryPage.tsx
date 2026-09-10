import { getCurrentStock } from '@/services'
import { DataTable } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingState } from '@/components/ui/LoadingState'
import { PageHeader } from '@/components/ui/PageHeader'
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
      {loading && <LoadingState text="Loading inventory…" />}
      {error && <ErrorState description={error} onRetry={reload} />}
      {!loading && !error && data && data.length === 0 && (
        <EmptyState title="No stock yet" description="Receive stock to begin tracking inventory." />
      )}
      {!loading && !error && data && data.length > 0 && (
        <DataTable
          caption={`Current stock — ${storeNames[store]}`}
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
    </Stack>
  )
}
