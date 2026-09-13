import { useState } from 'react'
import styled from 'styled-components'
import { createProduct, createReceiving, listProducts, listReceiving, listUsers } from '@/services'
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
import type { Product } from '@/domain'

export const NEW_RECEIVING_ITEM_VALUE = '__new__'

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
  customItemName: string
  quantity: string
  supplier: string
  costPrice: string
}

const emptyForm: ReceivingFormState = {
  productId: '',
  customItemName: '',
  quantity: '',
  supplier: '',
  costPrice: '',
}

export function ReceivingPage() {
  const { store, canSwitchStore } = useStore()
  const { user } = useSession()
  const [form, setForm] = useState<ReceivingFormState>(emptyForm)
  const [notice, setNotice] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const list = useAsyncData(() => listReceiving({ storeId: store }), store)
  const products = useAsyncData(() => listProducts())
  const users = useAsyncData(() => listUsers())
  const receive = useMutation(createReceiving)

  function updateForm<K extends keyof ReceivingFormState>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const isCustomItem = form.productId === NEW_RECEIVING_ITEM_VALUE

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    let productId = form.productId
    if (!productId) {
      setFormError('Choose an item before recording the receipt.')
      setNotice(null)
      return
    }
    if (isCustomItem) {
      const name = form.customItemName.trim()
      if (!name) {
        setFormError('Enter a name for the new item.')
        setNotice(null)
        return
      }
      // Reuse an existing product (any status) on a case-insensitive match so
      // repeat custom entries do not create duplicates.
      const existing = (products.data ?? []).find(
        (product: Product) => product.name.toLowerCase() === name.toLowerCase(),
      )
      if (existing) {
        productId = existing.id
      } else {
        try {
          const created = await createProduct({
            name,
            createdByUserId: user?.id,
          })
          productId = created.id
          products.reload()
        } catch (error) {
          setFormError(error instanceof Error ? error.message : 'Could not add the new item.')
          setNotice(null)
          return
        }
      }
    }
    setFormError(null)
    const record = await receive.run({
      storeId: store,
      productId,
      quantity: Number(form.quantity),
      supplier: form.supplier,
      costPriceMinor: toMinor(Number(form.costPrice)),
      recordedByUserId: user?.id ?? '',
    })
    if (record) {
      setForm(emptyForm)
      setNotice('Receiving recorded.')
      list.reload()
    }
  }

  const activeProducts = (products.data ?? []).filter(
    (product: Product) => product.status === 'active',
  )
  const productOptions = [
    ...activeProducts.map((product: Product) => ({
      value: product.id,
      label: product.name,
    })),
    { value: NEW_RECEIVING_ITEM_VALUE, label: 'Add new item…' },
  ]

  const productNames = new Map(
    (products.data ?? []).map((product: Product) => [product.id, product.name]),
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
            {isCustomItem && (
              <TextField
                id="receiving-product-custom"
                label="New item name"
                placeholder="e.g. Hog Pellets 50kg"
                value={form.customItemName}
                onChange={(event) => updateForm('customItemName', event.target.value)}
                maxLength={80}
                required
              />
            )}
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
              { key: 'recordedBy', header: 'Recorded by' },
              { key: 'receivedAt', header: 'Received' },
            ]}
            rows={list.data.map((record) => ({
              product: productNames.get(record.productId) ?? 'Not available',
              quantity: String(record.quantity),
              supplier: record.supplier,
              cost: <MoneyText amountMinor={record.costPriceMinor} />,
              recordedBy: userNames.get(record.recordedByUserId) ?? 'Not available',
              receivedAt: <DateText value={record.receivedAt} />,
            }))}
          />
        )}
      </AsyncBoundary>
    </Stack>
  )
}
