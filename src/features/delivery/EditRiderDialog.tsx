import { useState } from 'react'
import styled from 'styled-components'
import { updateRider } from '@/services'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { TextField } from '@/components/ui/TextField'
import { useAlertMutation } from '@/features/shared'
import type { Rider } from '@/domain'

interface EditRiderDialogProps {
  rider: Rider | null
  onClose: () => void
  onSaved: (rider: Rider) => void
}

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.lg};
`

export function EditRiderDialog({ rider, onClose, onSaved }: EditRiderDialogProps) {
  // Remounted per rider (keyed by the caller), so initial state always
  // reflects the selected rider.
  const [name, setName] = useState(rider?.name ?? '')
  const { run, pending } = useAlertMutation(
    (input: { id: string; name: string }) => updateRider(input.id, { name: input.name }),
    'Could not update the rider.',
  )

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!rider) {
      return
    }
    const saved = await run({ id: rider.id, name })
    if (saved) {
      onSaved(saved)
    }
  }

  return (
    <Dialog open={rider !== null} title="Edit rider" onClose={onClose}>
      <Form onSubmit={handleSubmit} noValidate>
        <TextField
          id="edit-rider-name"
          label="Rider name"
          autoComplete="off"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save changes'}
        </Button>
      </Form>
    </Dialog>
  )
}
