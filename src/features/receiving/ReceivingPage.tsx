import { useState } from 'react'
import styled from 'styled-components'
import {
  approveProduct,
  createProduct,
  createReceiving,
  listProducts,
  listReceiving,
  listUsers,
  logAuditEvent,
  rejectProduct,
} from '@/services'
import { Alert } from '@/components/ui/Alert'
import { AsyncBoundary } from '@/components/ui/AsyncBoundary'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DateText } from '@/components/ui/DateText'
import { Dialog } from '@/components/ui/Dialog'
import { FilterBar } from '@/components/ui/FilterBar'
import { MoneyText } from '@/components/ui/MoneyText'
import { PageHeader } from '@/components/ui/PageHeader'
import { RecordList } from '@/components/ui/RecordList'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Select } from '@/components/ui/Select'
import { ListSkeleton } from '@/components/ui/Skeletons'
import { Stack } from '@/components/ui/Stack'
import { StatusBadge } from '@/components/ui/StatusBadge'
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
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space.sm};
  margin-top: ${({ theme }) => theme.space.md};
`

const RowActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space.sm};
  justify-content: flex-end;
`

const PendingCardHeader = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space.sm};
`

const PendingCardName = styled.span`
  min-width: 0;
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  overflow-wrap: break-word;
`

const PendingCardMeta = styled.span`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.color.text.muted};
`

const FilterBarEnd = styled.div`
  margin-left: auto;
`

interface ReceivingFormState {
  productId: string
  customItemName: string
  quantity: string
  supplier: string
  costPrice: string
  sellingPrice: string
}

const emptyForm: ReceivingFormState = {
  productId: '',
  customItemName: '',
  quantity: '',
  supplier: '',
  costPrice: '',
  sellingPrice: '',
}

export function ReceivingPage() {
  const { store } = useStore()
  const { user } = useSession()
  const [form, setForm] = useState<ReceivingFormState>(emptyForm)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [tab, setTab] = useState<'pending' | 'received'>('pending')
  const [notice, setNotice] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [decision, setDecision] = useState<{
    product: Product
    action: 'approve' | 'reject'
  } | null>(null)
  const list = useAsyncData(() => listReceiving({ storeId: store }), store)
  const products = useAsyncData(() => listProducts())
  const users = useAsyncData(() => listUsers())
  const receive = useMutation(createReceiving)
  const review = useMutation((input: { id: string; action: 'approve' | 'reject' }) =>
    input.action === 'approve' ? approveProduct(input.id) : rejectProduct(input.id),
  )
  const isAdmin = user?.role === 'admin'

  function updateForm<K extends keyof ReceivingFormState>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function closeDialog() {
    setDialogOpen(false)
    setForm(emptyForm)
    setFormError(null)
  }

  const isCustomItem = form.productId === NEW_RECEIVING_ITEM_VALUE

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    let productId = form.productId
    let submittedNewItem = false
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
          submittedNewItem = true
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
      ...(form.sellingPrice.trim()
        ? { sellingPriceMinor: toMinor(Number(form.sellingPrice)) }
        : {}),
      recordedByUserId: user?.id ?? '',
    })
    if (record) {
      setDialogOpen(false)
      setForm(emptyForm)
      setNotice(
        submittedNewItem
          ? 'New item submitted for admin approval. Receiving recorded.'
          : 'Receiving recorded.',
      )
      list.reload()
    }
  }

  async function handleDecision() {
    if (!decision || !user) {
      return
    }
    const saved = await review.run({ id: decision.product.id, action: decision.action })
    if (saved) {
      await logAuditEvent({
        action: decision.action === 'approve' ? 'product.approved' : 'product.rejected',
        actorUserId: user.id,
        actorRole: user.role,
        relatedUserId: decision.product.createdByUserId,
        subject: saved.name,
      })
      setNotice(
        decision.action === 'approve'
          ? `${saved.name} is now active.`
          : `${saved.name} was rejected and removed.`,
      )
      setDecision(null)
      products.reload()
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
  const pendingProducts = (products.data ?? []).filter(
    (product: Product) => product.status === 'pending',
  )
  const myPendingProducts = pendingProducts.filter(
    (product: Product) => product.createdByUserId === user?.id,
  )

  return (
    <Stack>
      <PageHeader
        title="Receiving Stock"
        description={
          isAdmin
            ? `Record stock received at ${storeNames[store]}. Review staff-submitted items below.`
            : `Record stock received at ${storeNames[store]}. New items stay pending until an admin approves them.`
        }
        size="compact"
      />
      {notice && <Alert variant="success">{notice}</Alert>}
      <FilterBar>
        <StoreControl />
        <FilterBarEnd>
          <Button onClick={() => setDialogOpen(true)}>Add stock</Button>
        </FilterBarEnd>
      </FilterBar>
      <SegmentedControl
        label="Receiving view"
        options={[
          { value: 'pending', label: 'Pending items' },
          { value: 'received', label: 'List items' },
        ]}
        value={tab}
        onChange={(value) => setTab(value as 'pending' | 'received')}
      />
      <Dialog open={dialogOpen} title="Add stock" onClose={closeDialog}>
        <form onSubmit={handleSubmit} noValidate>
          {formError && <Alert variant="danger">{formError}</Alert>}
          {receive.error && <Alert variant="danger">{receive.error}</Alert>}
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
            <TextField
              id="receiving-selling-price"
              label="Selling price (₱)"
              type="number"
              min={0}
              step="0.01"
              value={form.sellingPrice}
              onChange={(event) => updateForm('sellingPrice', event.target.value)}
            />
          </Fields>
          <Actions>
            <Button type="button" variant="secondary" onClick={closeDialog}>
              Cancel
            </Button>
            <Button type="submit" disabled={receive.pending}>
              {receive.pending ? 'Saving…' : 'Save'}
            </Button>
          </Actions>
        </form>
      </Dialog>
      {tab === 'pending' ? (
        isAdmin ? (
          <>
            {review.error && <Alert variant="danger">{review.error}</Alert>}
            {pendingProducts.length === 0 ? (
              <Alert variant="success">No items awaiting approval.</Alert>
            ) : (
              <RecordList
                caption="Items awaiting approval"
                columns={[
                  { key: 'name', header: 'Item' },
                  { key: 'submittedBy', header: 'Submitted by' },
                  { key: 'status', header: 'Status' },
                  { key: 'actions', header: 'Actions' },
                ]}
                rows={pendingProducts.map((product) => ({
                  name: product.name,
                  submittedBy: product.createdByUserId
                    ? (userNames.get(product.createdByUserId) ?? 'Not available')
                    : 'Not available',
                  status: <StatusBadge status={product.status} />,
                  actions: (
                    <RowActions>
                      <Button
                        size="sm"
                        disabled={review.pending}
                        onClick={() => setDecision({ product, action: 'approve' })}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={review.pending}
                        onClick={() => setDecision({ product, action: 'reject' })}
                      >
                        Reject
                      </Button>
                    </RowActions>
                  ),
                }))}
                renderCard={(row) => (
                  <>
                    <PendingCardHeader>
                      <PendingCardName>{row.name}</PendingCardName>
                      {row.status}
                    </PendingCardHeader>
                    <PendingCardMeta>Submitted by {row.submittedBy}</PendingCardMeta>
                    {row.actions}
                  </>
                )}
              />
            )}
          </>
        ) : myPendingProducts.length === 0 ? (
          <Alert variant="success">No pending items.</Alert>
        ) : (
          <RecordList
            caption="Your pending items"
            columns={[
              { key: 'name', header: 'Item' },
              { key: 'status', header: 'Status' },
            ]}
            rows={myPendingProducts.map((product) => ({
              name: product.name,
              status: <StatusBadge status={product.status} />,
            }))}
            renderCard={(row) => (
              <PendingCardHeader>
                <PendingCardName>{row.name}</PendingCardName>
                {row.status}
              </PendingCardHeader>
            )}
          />
        )
      ) : (
        <AsyncBoundary
          loading={list.loading}
          error={list.error}
          onRetry={list.reload}
          skeleton={<ListSkeleton rows={3} />}
          empty={
            list.data && list.data.length === 0
              ? {
                  title: 'No receipts yet',
                  description: 'Add the first stock receipt to see it here.',
                  action: <Button onClick={() => setDialogOpen(true)}>Add stock</Button>,
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
                { key: 'selling', header: 'Selling price' },
                { key: 'recordedBy', header: 'Recorded by' },
                { key: 'receivedAt', header: 'Received' },
              ]}
              rows={list.data.map((record) => ({
                product: productNames.get(record.productId) ?? 'Not available',
                quantity: String(record.quantity),
                supplier: record.supplier,
                cost: <MoneyText amountMinor={record.costPriceMinor} />,
                selling:
                  record.sellingPriceMinor !== undefined ? (
                    <MoneyText amountMinor={record.sellingPriceMinor} />
                  ) : (
                    'Not available'
                  ),
                recordedBy: userNames.get(record.recordedByUserId) ?? 'Not available',
                receivedAt: <DateText value={record.receivedAt} />,
              }))}
            />
          )}
        </AsyncBoundary>
      )}
      <ConfirmDialog
        open={decision !== null}
        title={decision?.action === 'reject' ? 'Reject item' : 'Approve item'}
        message={
          decision
            ? decision.action === 'reject'
              ? `Reject "${decision.product.name}"? It will be removed.`
              : `Approve "${decision.product.name}"? It will become active.`
            : ''
        }
        confirmLabel={decision?.action === 'reject' ? 'Reject' : 'Approve'}
        pending={review.pending}
        onConfirm={handleDecision}
        onCancel={() => setDecision(null)}
      />
    </Stack>
  )
}
