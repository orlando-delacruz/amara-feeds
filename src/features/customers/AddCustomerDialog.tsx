import { useState } from 'react'
import styled from 'styled-components'
import { createCustomer } from '@/services'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { TextField } from '@/components/ui/TextField'
import { useAlertMutation } from '@/features/shared'
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
  const [address, setAddress] = useState('')
  const { run, pending } = useAlertMutation(createCustomer, 'Could not add the customer.')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const created = await run({
      name,
      contact: contact.trim() || undefined,
      address: address.trim() || undefined,
      createdByUserId,
    })
    if (created) {
      setName('')
      setContact('')
      setAddress('')
      onCreated(created)
    }
  }

  return (
    <Dialog open={open} title="Add customer" onClose={onClose}>
      <Form onSubmit={handleSubmit} noValidate>
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
        <TextField
          id="new-customer-address"
          label="Address (optional)"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
        />
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Add customer'}
        </Button>
      </Form>
    </Dialog>
  )
}
