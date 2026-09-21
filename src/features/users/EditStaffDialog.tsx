import { useState } from 'react'
import styled from 'styled-components'
import { updateUser } from '@/services'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Select } from '@/components/ui/Select'
import { TextField } from '@/components/ui/TextField'
import { useAlertMutation } from '@/features/shared'
import { storeIds, storeNames } from '@/store/stores'
import type { StoreId, UpdateUserInput, User, UserId } from '@/domain'

interface EditStaffDialogProps {
  user: User | null
  onClose: () => void
  onSaved: (user: User) => void
}

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.lg};
`

export function EditStaffDialog({ user, onClose, onSaved }: EditStaffDialogProps) {
  // Remounted per edited account (keyed by the caller), so initial state
  // always reflects the selected staff member.
  const [name, setName] = useState(user?.name ?? '')
  const [username, setUsername] = useState(user?.username ?? '')
  const [password, setPassword] = useState('')
  const [storeId, setStoreId] = useState<StoreId>(user?.storeId ?? 'amara')
  const { run, pending } = useAlertMutation(
    (input: { id: UserId; patch: UpdateUserInput }) => updateUser(input.id, input.patch),
    'Could not update the staff account.',
  )

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) {
      return
    }
    const saved = await run({
      id: user.id,
      patch: {
        name,
        username,
        storeId,
        ...(password ? { password } : {}),
      },
    })
    if (saved) {
      onSaved(saved)
    }
  }

  return (
    <Dialog open={user !== null} title="Edit staff" onClose={onClose}>
      <Form onSubmit={handleSubmit} noValidate>
        <TextField
          id="edit-staff-name"
          label="Name"
          autoComplete="off"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <TextField
          id="edit-staff-username"
          label="Username"
          autoComplete="off"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
        />
        <TextField
          id="edit-staff-password"
          label="New password (leave blank to keep)"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Select
          id="edit-staff-store"
          label="Assigned store"
          options={storeIds.map((id) => ({ value: id, label: storeNames[id] }))}
          value={storeId}
          onChange={(event) => setStoreId(event.target.value as StoreId)}
          required
        />
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save changes'}
        </Button>
      </Form>
    </Dialog>
  )
}
