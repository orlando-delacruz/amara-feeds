import { useState } from 'react'
import { listProducts } from '@/services'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingState } from '@/components/ui/LoadingState'
import { PageHeader } from '@/components/ui/PageHeader'
import { Stack } from '@/components/ui/Stack'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAsyncData } from '@/features/shared'
import { AddProductDialog } from './AddProductDialog'

export function ProductListPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const { data, loading, error, reload } = useAsyncData(() => listProducts())

  function handleCreated() {
    setDialogOpen(false)
    setNotice('Product submitted for admin approval.')
    reload()
  }

  return (
    <Stack>
      <PageHeader
        title="Products"
        description="Staff-submitted products stay pending until an admin approves them."
        actions={<Button onClick={() => setDialogOpen(true)}>Add product</Button>}
      />
      {notice && <Alert variant="success">{notice}</Alert>}
      {loading && <LoadingState text="Loading products…" />}
      {error && <ErrorState description={error} onRetry={reload} />}
      {!loading && !error && data && data.length === 0 && (
        <EmptyState
          title="No products yet"
          description="Submit the first product for admin approval."
          action={<Button onClick={() => setDialogOpen(true)}>Add product</Button>}
        />
      )}
      {!loading && !error && data && data.length > 0 && (
        <DataTable
          caption="Products"
          columns={[
            { key: 'name', header: 'Name' },
            { key: 'status', header: 'Status' },
          ]}
          rows={data.map((product) => ({
            name: product.name,
            status: <StatusBadge status={product.status} />,
          }))}
        />
      )}
      <AddProductDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={handleCreated}
      />
    </Stack>
  )
}
