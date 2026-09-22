import { useState } from 'react'
import styled from 'styled-components'
import {
  deleteCustomer,
  listCustomers,
  listUsers,
  searchCustomers,
  updateCustomer,
} from '@/services'
import { AsyncBoundary } from '@/components/ui/AsyncBoundary'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { PageHeader } from '@/components/ui/PageHeader'
import { RecordList } from '@/components/ui/RecordList'
import { ListSkeleton } from '@/components/ui/Skeletons'
import { Stack } from '@/components/ui/Stack'
import { TextField } from '@/components/ui/TextField'
import { useAsyncData, useAlertMutation } from '@/features/shared'
import { confirmAction, notifySuccess } from '@/lib/swal'
import { getDisplayName } from '@/features/session/displayName'
import { useSession } from '@/features/session/useSession'
import { AddCustomerDialog } from './AddCustomerDialog'
import type { Customer } from '@/domain'

interface CustomerListPageProps {
  canAdd?: boolean
}

const RowActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space.sm};
  justify-content: flex-end;
`

function EditCustomerDialog({
  customer,
  onSaved,
}: {
  customer: Customer | null
  onSaved: () => void
}) {
  const [name, setName] = useState(customer?.name ?? '')
  const [contact, setContact] = useState(customer?.contact ?? '')
  const [address, setAddress] = useState(customer?.address ?? '')
  const { run, pending } = useAlertMutation(
    (input: { name: string; contact?: string; address?: string }) =>
      updateCustomer(customer!.id, input),
    'Could not update the customer.',
  )

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!customer || name.trim() === '') {
      return
    }
    const saved = await run({
      name,
      contact: contact.trim() || undefined,
      address: address.trim() || undefined,
    })
    if (saved) {
      onSaved()
    }
  }

  return (
    <Dialog open={customer !== null} title="Edit customer" onClose={onSaved}>
      <form
        onSubmit={handleSubmit}
        noValidate
        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        <TextField
          id="edit-customer-name"
          label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <TextField
          id="edit-customer-contact"
          label="Contact (optional)"
          value={contact}
          onChange={(event) => setContact(event.target.value)}
        />
        <TextField
          id="edit-customer-address"
          label="Address (optional)"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
        />
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save changes'}
        </Button>
      </form>
    </Dialog>
  )
}

export function CustomerListPage({ canAdd = true }: CustomerListPageProps) {
  const { user } = useSession()
  const isAdmin = user?.role === 'admin'
  const [term, setTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)

  const { data, loading, error, reload } = useAsyncData(
    () => (term.trim() ? searchCustomers(term) : listCustomers()),
    term,
  )
  const users = useAsyncData(() => listUsers())
  const userNames = new Map((users.data ?? []).map((item) => [item.id, getDisplayName(item.name)]))
  const remove = useAlertMutation(
    (customerId: string) => deleteCustomer(customerId),
    'Could not delete the customer.',
  )

  function handleCreated() {
    setDialogOpen(false)
    void notifySuccess('Customer added.')
    reload()
  }

  function handleSaved() {
    setEditing(null)
    void notifySuccess('Customer updated.')
    reload()
  }

  async function requestDelete(customer: Customer) {
    const confirmed = await confirmAction({
      title: 'Delete this customer?',
      text: `Permanently delete "${customer.name}"? Their sales, credit records, and payments are removed too and cannot be recovered. A customer with an outstanding credit balance cannot be deleted.`,
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!confirmed) {
      return
    }
    const deleted = await remove.run(customer.id)
    if (deleted) {
      void notifySuccess('Customer deleted.')
      reload()
    }
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
              { key: 'actions', header: 'Actions' },
            ]}
            rows={data.map((customer) => ({
              name: customer.name,
              contact: customer.contact ?? 'Not listed',
              address: customer.address ?? 'Not listed',
              addedBy: customer.createdByUserId
                ? (userNames.get(customer.createdByUserId) ?? 'Not available')
                : 'Not available',
              actions: (
                <RowActions>
                  <Button size="sm" variant="secondary" onClick={() => setEditing(customer)}>
                    Edit
                  </Button>
                  {isAdmin && (
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={remove.pending}
                      onClick={() => void requestDelete(customer)}
                    >
                      Delete
                    </Button>
                  )}
                </RowActions>
              ),
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
      <EditCustomerDialog key={editing?.id ?? 'none'} customer={editing} onSaved={handleSaved} />
    </Stack>
  )
}
