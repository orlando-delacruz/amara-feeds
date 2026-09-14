import { useState } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import {
  createSale,
  listCustomers,
  listPaymentTerms,
  listProducts,
  listRiders,
  listVehicles,
  previewDueDate,
} from '@/services'
import { PAYMENT_METHOD_PRESETS } from '@/domain'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { DatePicker } from '@/components/ui/DatePicker'
import { DateText } from '@/components/ui/DateText'
import { EmptyState } from '@/components/ui/EmptyState'
import { MoneyText } from '@/components/ui/MoneyText'
import { PageHeader } from '@/components/ui/PageHeader'
import { Section } from '@/components/ui/Section'
import { Select } from '@/components/ui/Select'
import { Stack } from '@/components/ui/Stack'
import { TextField } from '@/components/ui/TextField'
import { AddCustomerDialog } from '@/features/customers/AddCustomerDialog'
import { useAsyncData, useMutation } from '@/features/shared'
import { useSession } from '@/features/session/useSession'
import { useCart } from '@/features/sales/useCart'
import { toMinor } from '@/lib/money'
import { todayIso } from '@/lib/dates'
import { storeNames } from '@/store/stores'
import { useStore } from '@/store/useStore'
import type { PaymentType } from '@/domain'

const CartItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
  padding: ${({ theme }) => theme.space.md};
  border: 1px solid ${({ theme }) => theme.color.border.default};
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ theme }) => theme.color.surface.card};
`

const CartItemHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space.sm};
`

const CartItemName = styled.span`
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.color.text.secondary};
`

const CartItemDetails = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.color.text.muted};
`

const RemoveButton = styled(Button)`
  min-height: ${({ theme }) => theme.touch.minTarget};
  flex-shrink: 0;
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

interface SaleCartPageProps {
  basePath?: string
}

export function SaleCartPage({ basePath = '/sales' }: SaleCartPageProps) {
  const navigate = useNavigate()
  const { store } = useStore()
  const { user } = useSession()
  const cart = useCart()
  const [saleDate, setSaleDate] = useState(todayIso())
  const [customerId, setCustomerId] = useState('')
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false)
  const [paymentType, setPaymentType] = useState<PaymentType>('cash')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [customPaymentMethod, setCustomPaymentMethod] = useState('')
  const [discount, setDiscount] = useState('')
  const [termsId, setTermsId] = useState('')
  const [deliveryFee, setDeliveryFee] = useState('')
  const [riderId, setRiderId] = useState('')
  const [vehicleId, setVehicleId] = useState('')

  const customers = useAsyncData(() => listCustomers())
  const products = useAsyncData(() => listProducts())
  const terms = useAsyncData(() => listPaymentTerms())
  const riders = useAsyncData(() => listRiders({ storeId: store, active: true }), store)
  const vehicles = useAsyncData(() => listVehicles({ storeId: store, active: true }), store)
  const duePreview = useAsyncData(
    () =>
      paymentType === 'charge' && termsId
        ? previewDueDate(termsId, saleDate)
        : Promise.resolve(null),
    `${paymentType}:${termsId}:${saleDate}`,
  )
  const save = useMutation(createSale)

  const hasDelivery = Boolean(deliveryFee.trim() || riderId || vehicleId)

  const itemsTotalMinor = cart.lines.reduce(
    (total, line) => total + line.quantity * line.unitPriceMinor,
    0,
  )
  const deliveryFeeMinor = deliveryFee ? toMinor(Number(deliveryFee)) : 0
  const discountMinor = discount ? toMinor(Number(discount)) : 0
  const totalMinor = itemsTotalMinor + deliveryFeeMinor - discountMinor
  const resolvedPaymentMethod =
    paymentMethod === 'Other' ? customPaymentMethod.trim() : paymentMethod

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const sale = await save.run({
      storeId: store,
      saleDate,
      customerId: customerId || undefined,
      paymentType,
      paymentMethod: resolvedPaymentMethod,
      lines: cart.lines.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
        unitPriceMinor: line.unitPriceMinor,
      })),
      delivery: hasDelivery
        ? {
            feeMinor: deliveryFee ? toMinor(Number(deliveryFee)) : undefined,
            riderId: riderId || undefined,
            vehicleId: vehicleId || undefined,
          }
        : undefined,
      discountMinor,
      termsId: paymentType === 'charge' ? termsId : undefined,
      recordedByUserId: user?.id ?? '',
    })
    if (sale) {
      cart.clear()
      navigate(basePath)
    }
  }

  const customerOptions = (customers.data ?? []).map((customer) => ({
    value: customer.id,
    label: customer.name,
  }))

  const paymentMethodOptions = PAYMENT_METHOD_PRESETS.map((method) => ({
    value: method,
    label: method,
  }))

  const productNames = new Map((products.data ?? []).map((product) => [product.id, product.name]))

  const termOptions = (terms.data ?? []).map((term) => ({
    value: term.id,
    label: term.label,
  }))

  const riderOptions = (riders.data ?? []).map((rider) => ({
    value: rider.id,
    label: rider.name,
  }))

  const vehicleOptions = (vehicles.data ?? []).map((vehicle) => ({
    value: vehicle.id,
    label: vehicle.label,
  }))

  if (cart.lines.length === 0) {
    return (
      <Stack>
        <PageHeader
          title="Cart"
          description={`Reviewing a sale at ${storeNames[store]}.`}
          actions={
            <Button variant="secondary" onClick={() => navigate(basePath)}>
              Cancel
            </Button>
          }
          size="compact"
        />
        <EmptyState
          title="No items in the cart"
          description="Add an item to start building the sale."
          action={<Button onClick={() => navigate(`${basePath}/new`)}>New item</Button>}
        />
      </Stack>
    )
  }

  return (
    <Stack>
      <PageHeader
        title="Cart"
        description={`Reviewing a sale at ${storeNames[store]}.`}
        actions={
          <Button variant="secondary" onClick={() => navigate(basePath)}>
            Cancel
          </Button>
        }
        size="compact"
      />
      {save.error && <Alert variant="danger">{save.error}</Alert>}
      <form onSubmit={handleSubmit} noValidate>
        <Stack>
          <Section
            title="Cart"
            action={
              <Button variant="subtle" onClick={() => navigate(`${basePath}/new`)}>
                New item
              </Button>
            }
          >
            {cart.lines.map((line) => {
              const name = productNames.get(line.productId) ?? 'Not available'
              return (
                <CartItem key={line.productId}>
                  <CartItemHeader>
                    <CartItemName>{name}</CartItemName>
                    <RemoveButton
                      variant="danger"
                      size="sm"
                      onClick={() => cart.removeLine(line.productId)}
                      aria-label={`Remove ${name}`}
                    >
                      Remove
                    </RemoveButton>
                  </CartItemHeader>
                  <CartItemDetails>
                    {line.quantity} × <MoneyText amountMinor={line.unitPriceMinor} /> ={' '}
                    <MoneyText amountMinor={line.quantity * line.unitPriceMinor} />
                  </CartItemDetails>
                </CartItem>
              )
            })}
          </Section>

          <Section title="Sale details">
            <DatePicker
              id="sale-date"
              label="Date"
              value={saleDate}
              onChange={setSaleDate}
              hint="Defaults to today. Change it for a backdated sale."
              required
            />
            <p>Location: {storeNames[store]}</p>
            <TextField
              id="sale-discount"
              label="Discount (₱)"
              type="number"
              min={0}
              step="0.01"
              value={discount}
              onChange={(event) => setDiscount(event.target.value)}
            />
          </Section>

          <Section title="Customer">
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

          <Section title="Payment">
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
            <Select
              id="sale-payment-method"
              label="Mode of payment"
              options={paymentMethodOptions}
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
              required
            />
            {paymentMethod === 'Other' && (
              <TextField
                id="sale-payment-method-custom"
                label="Specify payment method"
                value={customPaymentMethod}
                onChange={(event) => setCustomPaymentMethod(event.target.value)}
                required
              />
            )}
          </Section>

          <Section title="Delivery (optional)">
            <TextField
              id="sale-delivery-fee"
              label="Delivery fee (₱)"
              type="number"
              min={0}
              step="0.01"
              value={deliveryFee}
              onChange={(event) => setDeliveryFee(event.target.value)}
            />
            <Select
              id="sale-rider"
              label="Rider (optional)"
              options={riderOptions}
              placeholder="No rider"
              value={riderId}
              onChange={(event) => setRiderId(event.target.value)}
            />
            <Select
              id="sale-vehicle"
              label="Vehicle (optional)"
              options={vehicleOptions}
              placeholder="No vehicle"
              value={vehicleId}
              onChange={(event) => setVehicleId(event.target.value)}
            />
          </Section>

          <Section title="Review">
            <Review>
              <p>
                Items:{' '}
                {cart.lines
                  .map(
                    (line) =>
                      `${productNames.get(line.productId) ?? 'Not available'} × ${line.quantity}`,
                  )
                  .join(', ') || 'None'}
              </p>
              <p>
                Date: <DateText value={saleDate} />
              </p>
              <p>Location: {storeNames[store]}</p>
              <p>
                Payment: {paymentType === 'charge' ? 'Charge' : 'Cash'}
                {` · ${resolvedPaymentMethod || 'No payment method'}`}
                {paymentType === 'charge' &&
                  termsId &&
                  ` · ${termOptions.find((t) => t.value === termsId)?.label ?? ''}`}
              </p>
              <p>
                Items total: <MoneyText amountMinor={itemsTotalMinor} />
              </p>
              <p>
                Delivery fee: <MoneyText amountMinor={deliveryFeeMinor} />
              </p>
              <p>
                Discount: <MoneyText amountMinor={discountMinor} />
              </p>
              <p>
                Net total: <MoneyText amountMinor={totalMinor} />
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
        createdByUserId={user?.id}
      />
    </Stack>
  )
}
