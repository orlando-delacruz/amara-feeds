import { useState } from 'react'
import styled from 'styled-components'
import { createExistingCredit } from '@/services'
import { Button } from '@/components/ui/Button'
import { DatePicker } from '@/components/ui/DatePicker'
import { Dialog } from '@/components/ui/Dialog'
import { Select } from '@/components/ui/Select'
import { TextField } from '@/components/ui/TextField'
import { useAlertMutation } from '@/features/shared'
import { storeIds, storeNames, type StoreId } from '@/store/stores'
import { toMinor } from '@/lib/money'
import { todayIso } from '@/lib/dates'
import type { Customer } from '@/domain'

interface ExistingCreditDialogProps {
  open: boolean
  customers: Customer[]
  defaultStoreId: StoreId
  onClose: () => void
  onCreated: () => void
}

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.lg};
`

const Hint = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.color.text.muted};
`

/**
 * Admin-only encoding of a customer's pre-system credit balance (client
 * change): balance-only, no sale and no stock effect. Settled through the
 * normal payment flow.
 */
export function ExistingCreditDialog({
  open,
  customers,
  defaultStoreId,
  onClose,
  onCreated,
}: ExistingCreditDialogProps) {
  const [customerId, setCustomerId] = useState('')
  const [storeId, setStoreId] = useState<StoreId>(defaultStoreId)
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState(todayIso())
  const { run, pending } = useAlertMutation(createExistingCredit, 'Could not encode the credit.')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const amountValue = Number(amount)
    if (!customerId || amount === '' || Number.isNaN(amountValue)) {
      return
    }
    const amountMinor = toMinor(amountValue)
    if (amountMinor <= 0) {
      return
    }
    const created = await run({
      customerId,
      originStoreId: storeId,
      amountMinor,
      dueDate,
    })
    if (created) {
      setCustomerId('')
      setAmount('')
      setDueDate(todayIso())
      onCreated()
    }
  }

  return (
    <Dialog open={open} title="Add existing credit" onClose={onClose}>
      <Form onSubmit={handleSubmit} noValidate>
        <Hint>
          Encode a customer's credit balance from before the system. This never changes stock —
          inventory moves only when sales are recorded. The balance can be settled with normal
          payments.
        </Hint>
        <Select
          id="existing-credit-customer"
          label="Customer"
          value={customerId}
          onChange={(event) => setCustomerId(event.target.value)}
          options={customers.map((customer) => ({ value: customer.id, label: customer.name }))}
          placeholder="Select a customer"
          required
        />
        <Select
          id="existing-credit-store"
          label="Origin store"
          value={storeId}
          onChange={(event) => setStoreId(event.target.value as StoreId)}
          options={storeIds.map((id) => ({ value: id, label: storeNames[id] }))}
          required
        />
        <TextField
          id="existing-credit-amount"
          label="Outstanding balance (₱)"
          type="number"
          min="0.01"
          step="0.01"
          inputMode="decimal"
          autoComplete="off"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          required
        />
        <DatePicker
          id="existing-credit-due"
          label="Due date"
          value={dueDate}
          onChange={setDueDate}
          required
        />
        <Button type="submit" disabled={pending || !customerId}>
          {pending ? 'Saving…' : 'Encode credit'}
        </Button>
      </Form>
    </Dialog>
  )
}
