import { useState } from 'react'
import styled from 'styled-components'
import {
  createReceiving,
  listProducts,
  listReceiving,
  listRiders,
  listUsers,
  listVehicles,
} from '@/services'
import { Alert } from '@/components/ui/Alert'
import { AsyncBoundary } from '@/components/ui/AsyncBoundary'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DateText } from '@/components/ui/DateText'
import { FilterBar } from '@/components/ui/FilterBar'
import { MoneyText } from '@/components/ui/MoneyText'
import { PageHeader } from '@/components/ui/PageHeader'
import { RecordList } from '@/components/ui/RecordList'
import { Select } from '@/components/ui/Select'
import { ListSkeleton } from '@/components/ui/Skeletons'
import { Stack } from '@/components/ui/Stack'
import { TextField } from '@/components/ui/TextField'
import { StoreControl, useAsyncData, useMutation } from '@/features/shared'
import { getDisplayName } from '@/features/session/displayName'
import { useSession } from '@/features/session/useSession'
import { toMinor } from '@/lib/money'
import { storeNames } from '@/store/stores'
import { useStore } from '@/store/useStore'
import type { Product, Rider, Vehicle } from '@/domain'

const Fields = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.space.md};

  @media (min-width: ${({ theme }) => theme.breakpoint.tablet}) {
    grid-template-columns: 1fr 1fr;
  }
`

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: ${({ theme }) => theme.space.md};
`

interface ReceivingFormState {
  productId: string
  quantity: string
  supplier: string
  costPrice: string
  riderId: string
  vehicleId: string
}

const emptyForm: ReceivingFormState = {
  productId: '',
  quantity: '',
  supplier: '',
  costPrice: '',
  riderId: '',
  vehicleId: '',
}

export function ReceivingPage() {
  const { store, canSwitchStore } = useStore()
  const { user } = useSession()
  const [form, setForm] = useState<ReceivingFormState>(emptyForm)
  const [notice, setNotice] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const list = useAsyncData(() => listReceiving({ storeId: store }), store)
  const products = useAsyncData(() => listProducts({ status: 'active' }))
  const riders = useAsyncData(() => listRiders({ storeId: store, active: true }), store)
  const vehicles = useAsyncData(() => listVehicles({ storeId: store, active: true }), store)
  const users = useAsyncData(() => listUsers())
  const receive = useMutation(createReceiving)

  function updateForm<K extends keyof ReceivingFormState>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.productId) {
      setFormError('Choose an item before recording the receipt.')
      setNotice(null)
      return
    }
    if (!form.riderId) {
      setFormError('Select the delivery rider.')
      setNotice(null)
      return
    }
    if (!form.vehicleId) {
      setFormError('Select the delivery vehicle.')
      setNotice(null)
      return
    }
    setFormError(null)
    const record = await receive.run({
      storeId: store,
      productId: form.productId,
      quantity: Number(form.quantity),
      supplier: form.supplier,
      costPriceMinor: toMinor(Number(form.costPrice)),
      riderId: form.riderId,
      vehicleId: form.vehicleId,
      recordedByUserId: user?.id ?? '',
    })
    if (record) {
      setForm(emptyForm)
      setNotice('Receiving recorded.')
      list.reload()
    }
  }

  const productOptions = (products.data ?? []).map((product: Product) => ({
    value: product.id,
    label: product.name,
  }))

  const riderOptions = (riders.data ?? []).map((rider: Rider) => ({
    value: rider.id,
    label: rider.name,
  }))

  const vehicleOptions = (vehicles.data ?? []).map((vehicle: Vehicle) => ({
    value: vehicle.id,
    label: vehicle.label,
  }))

  const productNames = new Map(
    (products.data ?? []).map((product: Product) => [product.id, product.name]),
  )
  const riderNames = new Map((riders.data ?? []).map((rider: Rider) => [rider.id, rider.name]))
  const vehicleNames = new Map(
    (vehicles.data ?? []).map((vehicle: Vehicle) => [vehicle.id, vehicle.label]),
  )
  const userNames = new Map((users.data ?? []).map((item) => [item.id, getDisplayName(item.name)]))

  return (
    <Stack>
      <PageHeader
        title="Receiving Stock"
        description={`Record stock received at ${storeNames[store]}.`}
        size="compact"
      />
      {notice && <Alert variant="success">{notice}</Alert>}
      {formError && <Alert variant="danger">{formError}</Alert>}
      {receive.error && <Alert variant="danger">{receive.error}</Alert>}
      {canSwitchStore && (
        <FilterBar>
          <StoreControl />
        </FilterBar>
      )}
      <Card>
        <form onSubmit={handleSubmit} noValidate>
          <Fields>
            <Select
              id="receiving-product"
              label="Item"
              options={productOptions}
              placeholder="Select an item"
              value={form.productId}
              onChange={(event) => updateForm('productId', event.target.value)}
              required
            />
            <TextField
              id="receiving-quantity"
              label="Quantity"
              type="number"
              min={1}
              value={form.quantity}
              onChange={(event) => updateForm('quantity', event.target.value)}
              required
            />
            <TextField
              id="receiving-supplier"
              label="Supplier"
              value={form.supplier}
              onChange={(event) => updateForm('supplier', event.target.value)}
              required
            />
            <TextField
              id="receiving-cost"
              label="Cost price (₱)"
              type="number"
              min={0}
              step="0.01"
              value={form.costPrice}
              onChange={(event) => updateForm('costPrice', event.target.value)}
              required
            />
            <Select
              id="receiving-rider"
              label="Rider (delivered this stock)"
              options={riderOptions}
              placeholder="Select a rider"
              value={form.riderId}
              onChange={(event) => updateForm('riderId', event.target.value)}
              required
            />
            <Select
              id="receiving-vehicle"
              label="Vehicle"
              options={vehicleOptions}
              placeholder="Select a vehicle"
              value={form.vehicleId}
              onChange={(event) => updateForm('vehicleId', event.target.value)}
              required
            />
          </Fields>
          <Actions>
            <Button type="submit" disabled={receive.pending}>
              {receive.pending ? 'Recording…' : 'Record receiving'}
            </Button>
          </Actions>
        </form>
      </Card>
      <AsyncBoundary
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        skeleton={<ListSkeleton rows={3} />}
        empty={
          list.data && list.data.length === 0
            ? {
                title: 'No receipts yet',
                description: 'Record the first stock receipt above.',
              }
            : null
        }
      >
        {list.data && list.data.length > 0 && (
          <RecordList
            caption={`Receiving history at ${storeNames[store]}`}
            columns={[
              { key: 'product', header: 'Item' },
              { key: 'quantity', header: 'Quantity' },
              { key: 'supplier', header: 'Supplier' },
              { key: 'cost', header: 'Cost price' },
              { key: 'rider', header: 'Rider' },
              { key: 'vehicle', header: 'Vehicle' },
              { key: 'recordedBy', header: 'Recorded by' },
              { key: 'receivedAt', header: 'Received' },
            ]}
            rows={list.data.map((record) => ({
              product: productNames.get(record.productId) ?? 'Not available',
              quantity: String(record.quantity),
              supplier: record.supplier,
              cost: <MoneyText amountMinor={record.costPriceMinor} />,
              rider: riderNames.get(record.riderId) ?? 'Not available',
              vehicle: vehicleNames.get(record.vehicleId) ?? 'Not available',
              recordedBy: userNames.get(record.recordedByUserId) ?? 'Not available',
              receivedAt: <DateText value={record.receivedAt} />,
            }))}
          />
        )}
      </AsyncBoundary>
    </Stack>
  )
}
