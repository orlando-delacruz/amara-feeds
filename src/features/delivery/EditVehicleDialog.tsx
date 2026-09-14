import { useState } from 'react'
import styled from 'styled-components'
import { updateVehicle } from '@/services'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { TextField } from '@/components/ui/TextField'
import { useMutation } from '@/features/shared'
import type { Vehicle } from '@/domain'

interface EditVehicleDialogProps {
  vehicle: Vehicle | null
  onClose: () => void
  onSaved: (vehicle: Vehicle) => void
}

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.lg};
`

export function EditVehicleDialog({ vehicle, onClose, onSaved }: EditVehicleDialogProps) {
  // Remounted per vehicle (keyed by the caller), so initial state always
  // reflects the selected vehicle.
  const [label, setLabel] = useState(vehicle?.label ?? '')
  const { run, pending, error } = useMutation((input: { id: string; label: string }) =>
    updateVehicle(input.id, { label: input.label }),
  )

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!vehicle) {
      return
    }
    const saved = await run({ id: vehicle.id, label })
    if (saved) {
      onSaved(saved)
    }
  }

  return (
    <Dialog open={vehicle !== null} title="Edit vehicle" onClose={onClose}>
      <Form onSubmit={handleSubmit} noValidate>
        {error && <Alert variant="danger">{error}</Alert>}
        <TextField
          id="edit-vehicle-label"
          label="Vehicle type"
          placeholder="Motorcycle, Tricycle, Van…"
          autoComplete="off"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          required
        />
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save changes'}
        </Button>
      </Form>
    </Dialog>
  )
}
