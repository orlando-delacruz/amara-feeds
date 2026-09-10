import { useState } from 'react'
import { listProducts } from '@/services'
import { Alert } from '@/components/ui/Alert'
import { AsyncBoundary } from '@/components/ui/AsyncBoundary'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { RecordList } from '@/components/ui/RecordList'
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
      <AsyncBoundary
        loading={loading}
        loadingText="Loading products…"
        error={error}
        onRetry={reload}
        empty={
          data && data.length === 0
            ? {
                title: 'No products yet',
                description: 'Submit the first product for admin approval.',
                action: <Button onClick={() => setDialogOpen(true)}>Add product</Button>,
              }
            : null
        }
      >
        {data && data.length > 0 && (
          <RecordList
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
      </AsyncBoundary>
      <AddProductDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={handleCreated}
      />
    </Stack>
  )
}
