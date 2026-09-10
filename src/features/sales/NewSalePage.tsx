import { useState } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import {
  createSale,
  listCustomers,
  listPaymentTerms,
  listProducts,
  previewDueDate,
} from '@/services'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { DateText } from '@/components/ui/DateText'
import { MoneyText } from '@/components/ui/MoneyText'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import { Stack } from '@/components/ui/Stack'
import { TextField } from '@/components/ui/TextField'
import { AddCustomerDialog } from '@/features/customers/AddCustomerDialog'
import { useAsyncData, useMutation } from '@/features/shared'
import { toMinor } from '@/lib/money'
import { storeNames } from '@/store/stores'
import { useStore } from '@/store/useStore'
import type { PaymentType } from '@/domain'

interface ItemLine {
  productId: string
  quantity: string
  unitPrice: string
}

const emptyLine: ItemLine = { productId: '', quantity: '', unitPrice: '' }

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};
  padding: ${({ theme }) => theme.space.lg};
  background-color: ${({ theme }) => theme.color.surface.card};
  border: 1px solid ${({ theme }) => theme.color.border.default};
  border-radius: ${({ theme }) => theme.radius.lg};
`

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
`

const ItemRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 5rem 6.5rem auto;
  gap: ${({ theme }) => theme.space.sm};
  align-items: end;
`

const RemoveButton = styled(Button)`
  min-height: ${({ theme }) => theme.touch.minTarget};
`

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
`

const Review = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
`

export function NewSalePage() {
  const navigate = useNavigate()
  const { store } = useStore()
  const [customerId, setCustomerId] = useState('')
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false)
  const [items, setItems] = useState<ItemLine[]>([emptyLine])
  const [paymentType, setPaymentType] = useState<PaymentType>('cash')
  const [termsId, setTermsId] = useState('')
  const [deliveryFee, setDeliveryFee] = useState('')
  const [rider, setRider] = useState('')
  const [vehicle, setVehicle] = useState('')

  const customers = useAsyncData(() => listCustomers())
  const products = useAsyncData(() => listProducts({ status: 'active' }))
  const terms = useAsyncData(() => listPaymentTerms())
  const duePreview = useAsyncData(
    () => (paymentType === 'charge' && termsId ? previewDueDate(termsId) : Promise.resolve(null)),
    `${paymentType}:${termsId}`,
  )
  const save = useMutation(createSale)

  function updateItem(index: number, patch: Partial<ItemLine>) {
    setItems((current) => current.map((line, i) => (i === index ? { ...line, ...patch } : line)))
  }

  function addItem() {
    setItems((current) => [...current, emptyLine])
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, i) => i !== index))
  }

  const hasDelivery = Boolean(deliveryFee.trim() || rider.trim() || vehicle.trim())

  const totalMinor =
    items.reduce(
      (total, line) => total + (Number(line.quantity) || 0) * toMinor(Number(line.unitPrice) || 0),
      0,
    ) + (deliveryFee ? toMinor(Number(deliveryFee)) : 0)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const sale = await save.run({
      storeId: store,
      customerId: customerId || undefined,
      paymentType,
      lines: items
        .filter((line) => line.productId)
        .map((line) => ({
          productId: line.productId,
          quantity: Number(line.quantity),
          unitPriceMinor: toMinor(Number(line.unitPrice)),
        })),
      delivery: hasDelivery
        ? {
            feeMinor: deliveryFee ? toMinor(Number(deliveryFee)) : undefined,
            rider: rider.trim() || undefined,
            vehicle: vehicle.trim() || undefined,
          }
        : undefined,
      termsId: paymentType === 'charge' ? termsId : undefined,
    })
    if (sale) {
      navigate('/sales')
    }
  }

  const customerOptions = (customers.data ?? []).map((customer) => ({
    value: customer.id,
    label: customer.name,
  }))

  const productOptions = (products.data ?? []).map((product) => ({
    value: product.id,
    label: product.name,
  }))

  const termOptions = (terms.data ?? []).map((term) => ({
    value: term.id,
    label: term.label,
  }))

  return (
    <Stack>
      <PageHeader
        title="New sale"
        description={`Recording a sale at ${storeNames[store]}.`}
        actions={
          <Button variant="secondary" onClick={() => navigate('/sales')}>
            Cancel
          </Button>
        }
      />
      {save.error && <Alert variant="danger">{save.error}</Alert>}
      <form onSubmit={handleSubmit} noValidate>
        <Stack>
          <Section>
            <SectionTitle>Customer</SectionTitle>
            <Select
              id="sale-customer"
              label="Customer (optional)"
              options={customerOptions}
              placeholder="No customer"
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
            />
            <Button variant="subtle" onClick={() => setCustomerDialogOpen(true)}>
              Add new customer
            </Button>
          </Section>

          <Section>
            <SectionTitle>Items</SectionTitle>
            {items.map((line, index) => (
              <ItemRow key={index}>
                <Select
                  id={`sale-line-product-${index}`}
                  label="Item"
                  options={productOptions}
                  placeholder="Select an item"
                  value={line.productId}
                  onChange={(event) => updateItem(index, { productId: event.target.value })}
                  required
                />
                <TextField
                  id={`sale-line-qty-${index}`}
                  label="Qty"
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(event) => updateItem(index, { quantity: event.target.value })}
                  required
                />
                <TextField
                  id={`sale-line-price-${index}`}
                  label="Unit price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={line.unitPrice}
                  onChange={(event) => updateItem(index, { unitPrice: event.target.value })}
                  required
                />
                <RemoveButton
                  variant="danger"
                  size="sm"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                >
                  Remove
                </RemoveButton>
              </ItemRow>
            ))}
            <Button variant="secondary" onClick={addItem}>
              Add item
            </Button>
          </Section>

          <Section>
            <SectionTitle>Payment</SectionTitle>
            <Select
              id="sale-payment"
              label="Payment type"
              options={[
                { value: 'cash', label: 'Cash' },
                { value: 'charge', label: 'Charge' },
              ]}
              value={paymentType}
              onChange={(event) => setPaymentType(event.target.value as PaymentType)}
            />
            {paymentType === 'charge' && (
              <>
                <Select
                  id="sale-terms"
                  label="Payment terms"
                  options={termOptions}
                  placeholder="Select terms"
                  value={termsId}
                  onChange={(event) => setTermsId(event.target.value)}
                  required
                />
                {termsId && duePreview.data && (
                  <p>
                    Due date: <DateText value={duePreview.data} />
                  </p>
                )}
              </>
            )}
          </Section>

          <Section>
            <SectionTitle>Delivery (optional)</SectionTitle>
            <TextField
              id="sale-delivery-fee"
              label="Delivery fee (₱)"
              type="number"
              min={0}
              step="0.01"
              value={deliveryFee}
              onChange={(event) => setDeliveryFee(event.target.value)}
            />
            <TextField
              id="sale-rider"
              label="Rider"
              value={rider}
              onChange={(event) => setRider(event.target.value)}
            />
            <TextField
              id="sale-vehicle"
              label="Vehicle"
              value={vehicle}
              onChange={(event) => setVehicle(event.target.value)}
            />
          </Section>

          <Section>
            <SectionTitle>Review</SectionTitle>
            <Review>
              <p>
                Items:{' '}
                {items
                  .filter((line) => line.productId)
                  .map((line) => {
                    const product = products.data?.find((item) => item.id === line.productId)
                    return `${product?.name ?? 'Unknown'} × ${line.quantity}`
                  })
                  .join(', ') || 'None'}
              </p>
              <p>
                Payment: {paymentType === 'charge' ? 'Charge' : 'Cash'}
                {paymentType === 'charge' &&
                  termsId &&
                  ` · ${termOptions.find((t) => t.value === termsId)?.label ?? ''}`}
              </p>
              <p>
                Total: <MoneyText amountMinor={totalMinor} />
              </p>
            </Review>
            <Actions>
              <Button type="submit" disabled={save.pending}>
                {save.pending ? 'Saving…' : 'Save sale'}
              </Button>
            </Actions>
          </Section>
        </Stack>
      </form>
      <AddCustomerDialog
        open={customerDialogOpen}
        onClose={() => setCustomerDialogOpen(false)}
        onCreated={(customer) => {
          setCustomerId(customer.id)
          customers.reload()
        }}
      />
    </Stack>
  )
}
