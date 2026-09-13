import { useState } from 'react'
import styled from 'styled-components'
import { createUser } from '@/services'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Select } from '@/components/ui/Select'
import { TextField } from '@/components/ui/TextField'
import { useMutation } from '@/features/shared'
import { storeIds, storeNames } from '@/store/stores'
import type { StoreId, User } from '@/domain'

interface AddStaffDialogProps {
  open: boolean
  onClose: () => void
  onCreated: (user: User) => void
}

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.lg};
`

export function AddStaffDialog({ open, onClose, onCreated }: AddStaffDialogProps) {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [storeId, setStoreId] = useState<StoreId>('amara')
  const { run, pending, error } = useMutation(createUser)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const created = await run({ name, username, password, role: 'staff', storeId })
    if (created) {
      setName('')
      setUsername('')
      setPassword('')
      setStoreId('amara')
      onCreated(created)
    }
  }

  return (
    <Dialog open={open} title="Add staff" onClose={onClose}>
      <Form onSubmit={handleSubmit} noValidate>
        {error && <Alert variant="danger">{error}</Alert>}
        <TextField
          id="new-staff-name"
          label="Name"
          autoComplete="off"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <TextField
          id="new-staff-username"
          label="Username"
          autoComplete="off"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
        />
        <TextField
          id="new-staff-password"
          label="Password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <Select
          id="new-staff-store"
          label="Assigned store"
          options={storeIds.map((id) => ({ value: id, label: storeNames[id] }))}
          value={storeId}
          onChange={(event) => setStoreId(event.target.value as StoreId)}
          required
        />
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Add staff'}
        </Button>
      </Form>
    </Dialog>
  )
}
