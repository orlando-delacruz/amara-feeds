import { useState } from 'react'
import { approveProduct, listProducts } from '@/services'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DataTable } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingState } from '@/components/ui/LoadingState'
import { PageHeader } from '@/components/ui/PageHeader'
import { Stack } from '@/components/ui/Stack'
import { useAsyncData, useMutation } from '@/features/shared'
import type { Product } from '@/domain'

export function ProductApprovalPage() {
  const [selected, setSelected] = useState<Product | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const { data, loading, error, reload } = useAsyncData(() => listProducts({ status: 'pending' }))
  const approve = useMutation(approveProduct)

  async function handleConfirm() {
    if (!selected) {
      return
    }
    const approved = await approve.run(selected.id)
    if (approved) {
      setNotice(`${approved.name} is now active.`)
      setSelected(null)
      reload()
    }
  }

  return (
    <Stack>
      <PageHeader
        title="Product Approvals"
        description="Approve staff-submitted products to make them active."
      />
      {notice && <Alert variant="success">{notice}</Alert>}
      {loading && <LoadingState text="Loading pending products…" />}
      {error && <ErrorState description={error} onRetry={reload} />}
      {!loading && !error && data && data.length === 0 && (
        <EmptyState
          title="No products awaiting approval"
          description="Nothing to review right now."
        />
      )}
      {!loading && !error && data && data.length > 0 && (
        <DataTable
          caption="Pending products"
          columns={[
            { key: 'name', header: 'Name' },
            { key: 'action', header: '' },
          ]}
          rows={data.map((product) => ({
            name: product.name,
            action: (
              <Button size="sm" onClick={() => setSelected(product)}>
                Approve
              </Button>
            ),
          }))}
        />
      )}
      <ConfirmDialog
        open={selected !== null}
        title="Approve product"
        message={selected ? `Approve "${selected.name}"? It will become active.` : ''}
        confirmLabel="Approve"
        pending={approve.pending}
        onConfirm={handleConfirm}
        onCancel={() => setSelected(null)}
      />
      {approve.error && <Alert variant="danger">{approve.error}</Alert>}
    </Stack>
  )
}
