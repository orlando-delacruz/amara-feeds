import { useState } from 'react'
import { listCustomers, listUsers, searchCustomers } from '@/services'
import { AsyncBoundary } from '@/components/ui/AsyncBoundary'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { RecordList } from '@/components/ui/RecordList'
import { ListSkeleton } from '@/components/ui/Skeletons'
import { Stack } from '@/components/ui/Stack'
import { TextField } from '@/components/ui/TextField'
import { useAsyncData } from '@/features/shared'
import { notifySuccess } from '@/lib/swal'
import { getDisplayName } from '@/features/session/displayName'
import { useSession } from '@/features/session/useSession'
import { AddCustomerDialog } from './AddCustomerDialog'

interface CustomerListPageProps {
  canAdd?: boolean
}

export function CustomerListPage({ canAdd = true }: CustomerListPageProps) {
  const { user } = useSession()
  const [term, setTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, loading, error, reload } = useAsyncData(
    () => (term.trim() ? searchCustomers(term) : listCustomers()),
    term,
  )
  const users = useAsyncData(() => listUsers())
  const userNames = new Map((users.data ?? []).map((item) => [item.id, getDisplayName(item.name)]))

  function handleCreated() {
    setDialogOpen(false)
    void notifySuccess('Customer added.')
    reload()
  }

  return (
    <Stack>
      <PageHeader
        title="Customers"
        description="One shared customer record across Amara and Zeann."
        actions={
          canAdd ? <Button onClick={() => setDialogOpen(true)}>Add customer</Button> : undefined
        }
        size="compact"
      />
      <TextField
        id="customer-search"
        label="Search customers"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
      />
      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={reload}
        skeleton={<ListSkeleton rows={4} />}
        empty={
          data && data.length === 0
            ? {
                title: term.trim() ? 'No matching customers' : 'No customers yet',
                description: term.trim()
                  ? 'Try a different search term.'
                  : 'Add the first shared customer record to get started.',
                action: canAdd ? (
                  <Button onClick={() => setDialogOpen(true)}>Add customer</Button>
                ) : undefined,
              }
            : null
        }
      >
        {data && data.length > 0 && (
          <RecordList
            caption="Customers"
            columns={[
              { key: 'name', header: 'Name' },
              { key: 'contact', header: 'Contact' },
              { key: 'address', header: 'Address' },
              { key: 'addedBy', header: 'Added by' },
            ]}
            rows={data.map((customer) => ({
              name: customer.name,
              contact: customer.contact ?? 'Not listed',
              address: customer.address ?? 'Not listed',
              addedBy: customer.createdByUserId
                ? (userNames.get(customer.createdByUserId) ?? 'Not available')
                : 'Not available',
            }))}
          />
        )}
      </AsyncBoundary>
      <AddCustomerDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={handleCreated}
        createdByUserId={user?.id}
      />
    </Stack>
  )
}
