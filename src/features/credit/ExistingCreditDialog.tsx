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
import { MoneyText } from '@/components/ui/MoneyText'
import { toMinor } from '@/lib/money'
import { todayIso } from '@/lib/dates'
import { PAYMENT_METHOD_PRESETS } from '@/domain'
import type { Customer, Product } from '@/domain'

interface ExistingCreditDialogProps {
  open: boolean
  customers: Customer[]
  products: Product[]
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

const ItemRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 72px 104px 36px;
  gap: ${({ theme }) => theme.space.sm};
  align-items: end;
`

const RemoveItemButton = styled(Button)`
  min-height: ${({ theme }) => theme.touch.minTarget};
`

const Summary = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
  padding: ${({ theme }) => theme.space.md};
  border: 1px solid ${({ theme }) => theme.color.border.default};
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ theme }) => theme.color.surface.card};
  font-size: ${({ theme }) => theme.font.size.sm};
`

function parseMoney(value: string): number | null {
  if (value.trim() === '') {
    return null
  }
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

/**
 * Admin-only encoding of a customer's pre-system credit with complete
 * transaction details (DEC-049): item lines like a sale, an admin-set due
 * date, and an optional initial partial payment. Encoding never changes
 * stock; the balance settles through the normal payment flow.
 */
export function ExistingCreditDialog({
  open,
  customers,
  products,
  defaultStoreId,
  onClose,
  onCreated,
}: ExistingCreditDialogProps) {
  const [customerId, setCustomerId] = useState('')
  const [storeId, setStoreId] = useState<StoreId>(defaultStoreId)
  const [date, setDate] = useState(todayIso())
  const [dueDate, setDueDate] = useState(todayIso())
  const [items, setItems] = useState([{ productId: '', quantity: '', price: '' }])
  const [initialPayment, setInitialPayment] = useState('')
  const [initialPaymentMethod, setInitialPaymentMethod] = useState('Cash')
  const { run, pending } = useAlertMutation(createExistingCredit, 'Could not encode the credit.')

  function updateItem(index: number, patch: Partial<(typeof items)[number]>) {
    setItems((current) => current.map((item, at) => (at === index ? { ...item, ...patch } : item)))
  }

  const totalMinor = items.reduce((total, item) => {
    const quantity = parseMoney(item.quantity)
    const price = parseMoney(item.price)
    if (quantity === null || price === null || !item.productId) {
      return total
    }
    return total + quantity * toMinor(price)
  }, 0)
  const paymentMinor =
    parseMoney(initialPayment) === null ? 0 : toMinor(parseMoney(initialPayment) ?? 0)
  const balanceMinor = totalMinor - paymentMinor
  const itemsComplete = items.every(
    (item) =>
      item.productId && parseMoney(item.quantity) !== null && parseMoney(item.price) !== null,
  )
  const canSubmit =
    customerId !== '' &&
    itemsComplete &&
    items.length > 0 &&
    totalMinor > 0 &&
    paymentMinor <= totalMinor

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) {
      return
    }
    const created = await run({
      customerId,
      originStoreId: storeId,
      date,
      dueDate,
      lines: items.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        unitPriceMinor: toMinor(Number(item.price)),
      })),
      ...(paymentMinor > 0
        ? {
            initialPaymentMinor: paymentMinor,
            initialPaymentMethod: initialPaymentMethod || undefined,
          }
        : {}),
      recordedByUserId: '', // unused on the Supabase path (admin caller is server-derived)
    })
    if (created) {
      setCustomerId('')
      setItems([{ productId: '', quantity: '', price: '' }])
      setInitialPayment('')
      setDueDate(todayIso())
      onCreated()
    }
  }

  return (
    <Dialog open={open} title="Add existing credit" onClose={onClose}>
      <Form onSubmit={handleSubmit} noValidate>
        <Hint>
          Encode credit the customer already had before the system. The items below are recorded for
          reference only — encoding never changes current inventory. The balance is settled with
          normal payments.
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
        <DatePicker
          id="existing-credit-date"
          label="Transaction date"
          value={date}
          onChange={setDate}
          required
        />
        <div>
          <Hint>Items the customer received.</Hint>
          {items.map((item, index) => (
            <ItemRow key={index}>
              <Select
                id={`existing-credit-item-${index}`}
                label={index === 0 ? 'Item' : ''}
                value={item.productId}
                onChange={(event) => updateItem(index, { productId: event.target.value })}
                options={products.map((product) => ({ value: product.id, label: product.name }))}
                placeholder="Select an item"
                aria-label={index === 0 ? undefined : `Item ${index + 1}`}
                required
              />
              <TextField
                id={`existing-credit-qty-${index}`}
                label={index === 0 ? 'Qty' : ''}
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                autoComplete="off"
                value={item.quantity}
                onChange={(event) => updateItem(index, { quantity: event.target.value })}
                aria-label={index === 0 ? undefined : `Quantity ${index + 1}`}
                required
              />
              <TextField
                id={`existing-credit-price-${index}`}
                label={index === 0 ? 'Price (₱)' : ''}
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                autoComplete="off"
                value={item.price}
                onChange={(event) => updateItem(index, { price: event.target.value })}
                aria-label={index === 0 ? undefined : `Price ${index + 1}`}
                required
              />
              {items.length > 1 && (
                <RemoveItemButton
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => setItems((current) => current.filter((_, at) => at !== index))}
                >
                  Remove
                </RemoveItemButton>
              )}
            </ItemRow>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              setItems((current) => [...current, { productId: '', quantity: '', price: '' }])
            }
          >
            Add item
          </Button>
        </div>
        <TextField
          id="existing-credit-payment"
          label="Partial payment now (₱, optional)"
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          autoComplete="off"
          value={initialPayment}
          onChange={(event) => setInitialPayment(event.target.value)}
          error={
            paymentMinor > totalMinor && totalMinor > 0
              ? 'Payment cannot exceed the total.'
              : undefined
          }
        />
        {paymentMinor > 0 && (
          <Select
            id="existing-credit-method"
            label="Mode of payment"
            value={initialPaymentMethod}
            onChange={(event) => setInitialPaymentMethod(event.target.value)}
            options={PAYMENT_METHOD_PRESETS.map((method) => ({ value: method, label: method }))}
          />
        )}
        <DatePicker
          id="existing-credit-due"
          label="Due date"
          value={dueDate}
          onChange={setDueDate}
          required
        />
        <Summary>
          <span>
            Total: <MoneyText amountMinor={totalMinor} />
          </span>
          <span>
            Balance: <MoneyText amountMinor={Math.max(balanceMinor, 0)} />
          </span>
        </Summary>
        <Button type="submit" disabled={pending || !canSubmit}>
          {pending ? 'Saving…' : 'Encode credit'}
        </Button>
      </Form>
    </Dialog>
  )
}
