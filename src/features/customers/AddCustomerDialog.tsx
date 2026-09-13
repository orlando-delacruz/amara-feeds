import { useState } from 'react'
import styled from 'styled-components'
import { createCustomer } from '@/services'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { TextField } from '@/components/ui/TextField'
import { useMutation } from '@/features/shared'
import type { Customer, UserId } from '@/domain'

interface AddCustomerDialogProps {
  open: boolean
  onClose: () => void
  onCreated: (customer: Customer) => void
  createdByUserId?: UserId
}

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.lg};
`

export function AddCustomerDialog({
  open,
  onClose,
  onCreated,
  createdByUserId,
}: AddCustomerDialogProps) {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const { run, pending, error } = useMutation(createCustomer)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const created = await run({ name, contact: contact.trim() || undefined, createdByUserId })
    if (created) {
      setName('')
      setContact('')
      onCreated(created)
    }
  }

  return (
    <Dialog open={open} title="Add customer" onClose={onClose}>
      <Form onSubmit={handleSubmit} noValidate>
        {error && <Alert variant="danger">{error}</Alert>}
        <TextField
          id="new-customer-name"
          label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <TextField
          id="new-customer-contact"
          label="Contact (optional)"
          value={contact}
          onChange={(event) => setContact(event.target.value)}
        />
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Add customer'}
        </Button>
      </Form>
    </Dialog>
  )
}
