import { useState } from 'react'
import { approveProduct, listProducts } from '@/services'
import { Alert } from '@/components/ui/Alert'
import { AsyncBoundary } from '@/components/ui/AsyncBoundary'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PageHeader } from '@/components/ui/PageHeader'
import { RecordList } from '@/components/ui/RecordList'
import { ListSkeleton } from '@/components/ui/Skeletons'
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
        size="compact"
      />
      {notice && <Alert variant="success">{notice}</Alert>}
      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={reload}
        skeleton={<ListSkeleton rows={3} />}
        empty={
          data && data.length === 0
            ? {
                title: 'No products awaiting approval',
                description: 'Nothing to review right now.',
              }
            : null
        }
      >
        {data && data.length > 0 && (
          <RecordList
            caption="Pending products"
            columns={[
              { key: 'name', header: 'Name' },
              { key: 'action', header: 'Action' },
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
      </AsyncBoundary>
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
