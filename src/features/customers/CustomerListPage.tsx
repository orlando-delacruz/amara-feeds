import { useState } from 'react'
import { listCustomers, searchCustomers } from '@/services'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingState } from '@/components/ui/LoadingState'
import { PageHeader } from '@/components/ui/PageHeader'
import { Stack } from '@/components/ui/Stack'
import { TextField } from '@/components/ui/TextField'
import { useAsyncData } from '@/features/shared'
import { AddCustomerDialog } from './AddCustomerDialog'

interface CustomerListPageProps {
  canAdd?: boolean
}

export function CustomerListPage({ canAdd = true }: CustomerListPageProps) {
  const [term, setTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const { data, loading, error, reload } = useAsyncData(
    () => (term.trim() ? searchCustomers(term) : listCustomers()),
    term,
  )

  function handleCreated() {
    setDialogOpen(false)
    setNotice('Customer added.')
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
      />
      {notice && <Alert variant="success">{notice}</Alert>}
      <TextField
        id="customer-search"
        label="Search customers"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
      />
      {loading && <LoadingState text="Loading customers…" />}
      {error && <ErrorState description={error} onRetry={reload} />}
      {!loading && !error && data && data.length === 0 && (
        <EmptyState
          title={term.trim() ? 'No matching customers' : 'No customers yet'}
          description={
            term.trim()
              ? 'Try a different search term.'
              : 'Add the first shared customer record to get started.'
          }
          action={
            canAdd ? <Button onClick={() => setDialogOpen(true)}>Add customer</Button> : undefined
          }
        />
      )}
      {!loading && !error && data && data.length > 0 && (
        <DataTable
          caption="Customers"
          columns={[
            { key: 'name', header: 'Name' },
            { key: 'contact', header: 'Contact' },
          ]}
          rows={data.map((customer) => ({
            name: customer.name,
            contact: customer.contact ?? '—',
          }))}
        />
      )}
      <AddCustomerDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={handleCreated}
      />
    </Stack>
  )
}
