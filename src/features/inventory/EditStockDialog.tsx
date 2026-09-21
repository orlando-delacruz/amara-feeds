import { useState } from 'react'
import styled from 'styled-components'
import { updateStock } from '@/services'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { TextField } from '@/components/ui/TextField'
import { useAlertMutation } from '@/features/shared'
import { storeNames } from '@/store/stores'
import { toMinor } from '@/lib/money'
import type { ProductId, StoreId } from '@/domain'
import type { Money } from '@/lib/money'

interface EditStockDialogProps {
  /** { storeId, productId, productName, quantity, priceMinor } — keyed per row by the caller. */
  row: {
    storeId: StoreId
    productId: ProductId
    productName: string
    quantity: number
    priceMinor?: Money
  } | null
  actorUserId?: string
  actorRole: 'staff' | 'admin'
  onClose: () => void
  onSaved: (quantity: number, previousQuantity: number) => void
}

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.lg};
`

export function EditStockDialog({
  row,
  actorUserId,
  actorRole,
  onClose,
  onSaved,
}: EditStockDialogProps) {
  const [quantity, setQuantity] = useState(row ? String(row.quantity) : '')
  const [price, setPrice] = useState('')
  const { run, pending } = useAlertMutation(
    (input: { quantity: number; priceMinor?: number }) =>
      updateStock(row!.storeId, row!.productId, {
        quantity: input.quantity,
        ...(input.priceMinor !== undefined ? { priceMinor: input.priceMinor } : {}),
        actorUserId: actorUserId ?? '',
        actorRole,
      }),
    'Could not update the stock.',
  )

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!row) {
      return
    }
    const quantityValue = Number(quantity)
    if (quantity === '' || Number.isNaN(quantityValue)) {
      return
    }
    const priceValue = price === '' ? undefined : toMinor(Number(price))
    if (priceValue !== undefined && Number.isNaN(priceValue)) {
      return
    }
    const saved = await run({ quantity: quantityValue, priceMinor: priceValue })
    if (saved) {
      onSaved(saved.level.quantity, saved.previousQuantity)
    }
  }

  return (
    <Dialog open={row !== null} title="Edit stock" onClose={onClose}>
      <Form onSubmit={handleSubmit} noValidate>
        <p>
          {row?.productName} at {row ? storeNames[row.storeId] : ''}.
        </p>
        <TextField
          id="edit-stock-quantity"
          label="Quantity on hand"
          type="number"
          min="0"
          step="1"
          autoComplete="off"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          required
        />
        <TextField
          id="edit-stock-price"
          label="Selling price (₱)"
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          autoComplete="off"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          hint={
            row?.priceMinor !== undefined
              ? `Current price: ₱${(row.priceMinor / 100).toFixed(2)} — leave empty to keep it.`
              : 'Leave empty to keep the price from the latest recorded stock receipt.'
          }
        />
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save changes'}
        </Button>
      </Form>
    </Dialog>
  )
}
