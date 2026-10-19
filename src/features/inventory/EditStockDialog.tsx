import { useState } from 'react'
import styled from 'styled-components'
import { renameProduct, updateStock } from '@/services'
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
  const [name, setName] = useState(row ? row.productName : '')
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
  // Renamed before the stock write so a rejected name leaves quantity and price
  // untouched; the reverse order would half-apply the edit.
  const { run: runRename, pending: renaming } = useAlertMutation(
    (input: { name: string }) =>
      renameProduct(row!.productId, input.name, {
        userId: actorUserId ?? '',
        role: actorRole,
      }),
    'Could not rename the item.',
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
    const trimmed = name.trim()
    if (!trimmed) {
      return
    }
    if (trimmed !== row.productName) {
      const renamed = await runRename({ name: trimmed })
      if (!renamed) {
        return
      }
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
          id="edit-stock-name"
          label="Item name"
          autoComplete="off"
          value={name}
          onChange={(event) => setName(event.target.value)}
          hint="Renames the item everywhere, including the sale catalog."
          required
        />
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
        <Button type="submit" disabled={pending || renaming}>
          {pending || renaming ? 'Saving…' : 'Save changes'}
        </Button>
      </Form>
    </Dialog>
  )
}
