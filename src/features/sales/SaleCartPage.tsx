import { useState } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import {
  createSale,
  listCredits,
  listCustomers,
  listPaymentTerms,
  listProducts,
  listRiders,
  listVehicles,
  previewDueDate,
  recordPayment,
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
import { useAsyncData, useAlertMutation } from '@/features/shared'
import { notifyError, notifySuccess } from '@/lib/swal'
import { useSession } from '@/features/session/useSession'
import { useCart } from '@/features/sales/useCart'
import { toMinor } from '@/lib/money'
import { todayIso } from '@/lib/dates'
import { concreteStoreId, isAllStores, storeNames } from '@/store/stores'
import { useStore } from '@/store/useStore'
import type { PaymentType, StoreId } from '@/domain'

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
  const [downPayment, setDownPayment] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [discount, setDiscount] = useState('')
  const [termsId, setTermsId] = useState('')
  const [deliveryFee, setDeliveryFee] = useState('')
  const [riderId, setRiderId] = useState('')
  const [vehicleId, setVehicleId] = useState('')

  const customers = useAsyncData(() => listCustomers())
  const products = useAsyncData(() => listProducts())
  const terms = useAsyncData(() => listPaymentTerms())
  const allMode = isAllStores(store)
  const contextStoreId = concreteStoreId(store)
  const riders = useAsyncData(() => listRiders({ storeId: contextStoreId, active: true }), store)
  const vehicles = useAsyncData(
    () => listVehicles({ storeId: contextStoreId, active: true }),
    store,
  )
  const duePreview = useAsyncData(
    () =>
      paymentType === 'charge' && termsId
        ? previewDueDate(termsId, saleDate)
        : Promise.resolve(null),
    `${paymentType}:${termsId}:${saleDate}`,
  )
  const save = useAlertMutation(createSale, 'Could not record the sale.')

  const hasDelivery = Boolean(deliveryFee.trim() || riderId || vehicleId)

  const itemsTotalMinor = cart.lines.reduce(
    (total, line) => total + line.quantity * line.unitPriceMinor,
    0,
  )
  const deliveryFeeMinor = deliveryFee ? toMinor(Number(deliveryFee)) : 0
  const discountMinor = discount ? toMinor(Number(discount)) : 0
  const totalMinor = itemsTotalMinor + deliveryFeeMinor - discountMinor
  const downPaymentMinor = downPayment ? toMinor(Number(downPayment)) : 0
  const resolvedPaymentMethod =
    paymentMethod === 'Other' ? customPaymentMethod.trim() : paymentMethod
  // Charge sales carry no payment method — the customer buys on credit. One
  // appears only when a down payment is taken (that IS a payment, DEC-045).
  const showPaymentMethod = paymentType === 'cash' || downPaymentMinor > 0

  function validateChargeDownPayment(): string | null {
    if (paymentType !== 'charge' || downPaymentMinor === 0) {
      return null
    }
    if (downPaymentMinor < 0 || Number.isNaN(downPaymentMinor)) {
      return 'Down payment cannot be negative.'
    }
    if (downPaymentMinor > totalMinor) {
      return 'Down payment cannot be more than the net total.'
    }
    if (!resolvedPaymentMethod) {
      return 'Select the mode of payment for the down payment.'
    }
    return null
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationError = validateChargeDownPayment()
    if (validationError) {
      setFormError(validationError)
      return
    }
    setFormError(null)
    const sale = await save.run({
      storeId: contextStoreId,
      saleDate,
      customerId: customerId || undefined,
      paymentType,
      paymentMethod: paymentType === 'charge' ? undefined : resolvedPaymentMethod,
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
    if (!sale) {
      return
    }
    if (paymentType === 'charge' && downPaymentMinor > 0) {
      const recorded = await recordDownPayment(sale.id, sale.customerId, sale.storeId)
      if (!recorded) {
        cart.clear()
        navigate(basePath)
        return
      }
    }
    cart.clear()
    const successText =
      paymentType === 'charge' && downPaymentMinor > 0
        ? 'Stock updated. The down payment was recorded against the customer’s credit.'
        : 'The stock has been updated for this store.'
    await notifySuccess('Sale recorded.', successText)
    navigate(basePath)
  }

  /**
   * Records a charge-sale down payment through the normal payment flow
   * (DEC-045): the obligation created for the sale is found by its sale id,
   * and the payment lands in the shared payment history with store
   * attribution. Failure never loses the sale — the payment stays retryable
   * from the credit page.
   */
  async function recordDownPayment(
    saleId: string,
    saleCustomerId: string | undefined,
    saleStoreId: StoreId,
  ): Promise<boolean> {
    try {
      if (!saleCustomerId) {
        throw new Error('A charge sale requires a customer.')
      }
      const credits = await listCredits({
        customerId: saleCustomerId,
        originStoreId: saleStoreId,
      })
      const obligation = credits.find((credit) => credit.saleId === saleId)
      if (!obligation) {
        throw new Error('Credit obligation not found.')
      }
      await recordPayment({
        creditId: obligation.id,
        storeId: saleStoreId,
        amountMinor: downPaymentMinor,
        method: resolvedPaymentMethod,
        recordedByUserId: user?.id ?? '',
      })
      return true
    } catch (cause) {
      console.error('[cart] down payment failed:', cause)
      await notifyError(
        'Sale recorded, but the down payment was not saved.',
        'Record it from the customer’s credit page.',
      )
      return false
    }
  }

  const customerOptions = (customers.data ?? []).map((customer) => ({
    value: customer.id,
    label: customer.name,
  }))

  const selectedCustomer = customerId
    ? (customers.data ?? []).find((customer) => customer.id === customerId)
    : undefined

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
          description={`Reviewing a sale at ${storeNames[concreteStoreId(store)]}.`}
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
        description={`Reviewing a sale at ${storeNames[concreteStoreId(store)]}.`}
        actions={
          <Button variant="secondary" onClick={() => navigate(basePath)}>
            Cancel
          </Button>
        }
        size="compact"
      />
      {save.error && <Alert variant="danger">{save.error}</Alert>}
      {formError && <Alert variant="danger">{formError}</Alert>}
      {allMode && (
        <Alert variant="warning" title="Pick a store to record the sale">
          Select Amara or Zeann on the sales page, or return to the catalog to add items for that
          store's sale.
        </Alert>
      )}
      {(customers.error || products.error || terms.error) && (
        <Alert variant="warning">
          Some checkout details could not load. Retry or try again from the sales list.
        </Alert>
      )}
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
            <p>Location: {storeNames[concreteStoreId(store)]}</p>
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
            <TextField
              id="sale-customer-address"
              label="Address"
              value={selectedCustomer?.address ?? ''}
              readOnly
              placeholder="Select a customer to show their address"
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
                <TextField
                  id="sale-down-payment"
                  label="Down payment (₱, optional)"
                  type="number"
                  min={0}
                  step="0.01"
                  value={downPayment}
                  onChange={(event) => setDownPayment(event.target.value)}
                  hint="Anything the customer pays now is recorded against their credit."
                />
              </>
            )}
            {showPaymentMethod && (
              <>
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
              </>
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
              <p>Location: {storeNames[concreteStoreId(store)]}</p>
              <p>
                Payment: {paymentType === 'charge' ? 'Charge' : 'Cash'}
                {showPaymentMethod && ` · ${resolvedPaymentMethod || 'No payment method'}`}
                {paymentType === 'charge' &&
                  termsId &&
                  ` · ${termOptions.find((t) => t.value === termsId)?.label ?? ''}`}
                {paymentType === 'charge' && downPaymentMinor > 0 && (
                  <>
                    {' · Down payment: '}
                    <MoneyText amountMinor={downPaymentMinor} />
                  </>
                )}
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
              <Button type="submit" disabled={save.pending || allMode}>
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
          // Select the new customer, close the dialog, and confirm with a
          // popup — after OK the user is back on the cart (DEC-046).
          setCustomerId(customer.id)
          setCustomerDialogOpen(false)
          customers.reload()
          void notifySuccess('Customer added.')
        }}
        createdByUserId={user?.id}
      />
    </Stack>
  )
}
