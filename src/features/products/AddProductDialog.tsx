import { useState } from 'react'
import styled from 'styled-components'
import { createProduct } from '@/services'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { TextField } from '@/components/ui/TextField'
import { useMutation } from '@/features/shared'
import { useSession } from '@/features/session/useSession'

interface AddProductDialogProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.lg};
`

export function AddProductDialog({ open, onClose, onCreated }: AddProductDialogProps) {
  const { user } = useSession()
  const [name, setName] = useState('')
  const { run, pending, error } = useMutation(createProduct)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const created = await run({ name, createdByUserId: user?.id })
    if (created) {
      setName('')
      onCreated()
    }
  }

  return (
    <Dialog open={open} title="Add product" onClose={onClose}>
      <Form onSubmit={handleSubmit} noValidate>
        {error && <Alert variant="danger">{error}</Alert>}
        <Alert variant="info">
          New products are submitted for admin approval and stay pending until approved.
        </Alert>
        <TextField
          id="new-product-name"
          label="Product name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <Button type="submit" disabled={pending}>
          {pending ? 'Submitting…' : 'Submit product'}
        </Button>
      </Form>
    </Dialog>
  )
}
