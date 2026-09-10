import { useState } from 'react'
import styled from 'styled-components'
import { createReceiving, listProducts, listReceiving } from '@/services'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { DateText } from '@/components/ui/DateText'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingState } from '@/components/ui/LoadingState'
import { MoneyText } from '@/components/ui/MoneyText'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import { Stack } from '@/components/ui/Stack'
import { TextField } from '@/components/ui/TextField'
import { useAsyncData, useMutation } from '@/features/shared'
import { toMinor } from '@/lib/money'
import { storeNames } from '@/store/stores'
import { useStore } from '@/store/useStore'
import type { Product } from '@/domain'

const Form = styled.form`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.space.md};
  padding: ${({ theme }) => theme.space.lg};
  background-color: ${({ theme }) => theme.color.surface.card};
  border: 1px solid ${({ theme }) => theme.color.border.default};
  border-radius: ${({ theme }) => theme.radius.lg};

  @media (min-width: ${({ theme }) => theme.breakpoint.tablet}) {
    grid-template-columns: 1fr 1fr;
  }
`

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;

  @media (min-width: ${({ theme }) => theme.breakpoint.tablet}) {
    grid-column: 1 / -1;
  }
`

interface ReceivingFormState {
  productId: string
  quantity: string
  supplier: string
  costPrice: string
}

const emptyForm: ReceivingFormState = { productId: '', quantity: '', supplier: '', costPrice: '' }

export function ReceivingPage() {
  const { store } = useStore()
  const [form, setForm] = useState<ReceivingFormState>(emptyForm)
  const [notice, setNotice] = useState<string | null>(null)
  const list = useAsyncData(() => listReceiving({ storeId: store }), store)
  const products = useAsyncData(() => listProducts({ status: 'active' }))
  const receive = useMutation(createReceiving)

  function updateForm<K extends keyof ReceivingFormState>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.productId) {
      receive.reset()
      setNotice(null)
      return
    }
    const record = await receive.run({
      storeId: store,
      productId: form.productId,
      quantity: Number(form.quantity),
      supplier: form.supplier,
      costPriceMinor: toMinor(Number(form.costPrice)),
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

  const productNames = new Map(
    (products.data ?? []).map((product: Product) => [product.id, product.name]),
  )

  return (
    <Stack>
      <PageHeader
        title="Receiving Stock"
        description={`Record stock received at ${storeNames[store]}.`}
      />
      {notice && <Alert variant="success">{notice}</Alert>}
      {receive.error && <Alert variant="danger">{receive.error}</Alert>}
      <Form onSubmit={handleSubmit} noValidate>
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
        <Actions>
          <Button type="submit" disabled={receive.pending || !form.productId}>
            {receive.pending ? 'Recording…' : 'Record receiving'}
          </Button>
        </Actions>
      </Form>
      {list.loading && <LoadingState text="Loading receipts…" />}
      {list.error && <ErrorState description={list.error} onRetry={list.reload} />}
      {!list.loading && !list.error && list.data && list.data.length === 0 && (
        <EmptyState title="No receipts yet" description="Record the first stock receipt above." />
      )}
      {!list.loading && !list.error && list.data && list.data.length > 0 && (
        <DataTable
          caption={`Receiving history — ${storeNames[store]}`}
          columns={[
            { key: 'product', header: 'Item' },
            { key: 'quantity', header: 'Quantity' },
            { key: 'supplier', header: 'Supplier' },
            { key: 'cost', header: 'Cost price' },
            { key: 'receivedAt', header: 'Received' },
          ]}
          rows={list.data.map((record) => ({
            product: productNames.get(record.productId) ?? 'Unknown',
            quantity: String(record.quantity),
            supplier: record.supplier,
            cost: <MoneyText amountMinor={record.costPriceMinor} />,
            receivedAt: <DateText value={record.receivedAt} />,
          }))}
        />
      )}
    </Stack>
  )
}
