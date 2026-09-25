import { useState } from 'react'
import styled from 'styled-components'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getCreditHistory,
  listCustomers,
  listPaymentTerms,
  listUsers,
  recordPayment,
  voidCredit,
} from '@/services'
import { Alert } from '@/components/ui/Alert'
import { AsyncBoundary } from '@/components/ui/AsyncBoundary'
import { BackLink } from '@/components/ui/BackLink'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DateText } from '@/components/ui/DateText'
import { MoneyText } from '@/components/ui/MoneyText'
import { PageHeader } from '@/components/ui/PageHeader'
import { RecordList } from '@/components/ui/RecordList'
import { Select } from '@/components/ui/Select'
import { ListSkeleton } from '@/components/ui/Skeletons'
import { Stack } from '@/components/ui/Stack'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { TextField } from '@/components/ui/TextField'
import { useAsyncData, useAlertMutation } from '@/features/shared'
import { confirmAction, notifySuccess } from '@/lib/swal'
import { getDisplayName } from '@/features/session/displayName'
import { useSession } from '@/features/session/useSession'
import { PAYMENT_METHOD_PRESETS } from '@/domain'
import { toMinor } from '@/lib/money'
import { concreteStoreId, isAllStores, storeNames } from '@/store/stores'
import { useStore } from '@/store/useStore'

interface CreditDetailPageProps {
  basePath?: string
}

const DetailGrid = styled.dl`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: ${({ theme }) => theme.space.md};
  margin: 0;
`

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
`

const DetailLabel = styled.dt`
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.color.text.secondary};
`

const DetailValue = styled.dd`
  margin: 0;
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  font-variant-numeric: tabular-nums;
`

const PaymentFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};
`

const PaymentActions = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: ${({ theme }) => theme.space.md};
`

const PaymentNote = styled.p`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.color.text.secondary};
`

export function CreditDetailPage({ basePath = '/credit' }: CreditDetailPageProps) {
  const { creditId } = useParams<{ creditId: string }>()
  const navigate = useNavigate()
  const { store } = useStore()
  const { user } = useSession()
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<string>('Cash')
  const [customMethod, setCustomMethod] = useState('')

  const history = useAsyncData(
    () => (creditId ? getCreditHistory(creditId) : Promise.resolve(null)),
    creditId ?? '',
  )
  const customers = useAsyncData(() => listCustomers())
  const terms = useAsyncData(() => listPaymentTerms())
  const users = useAsyncData(() => listUsers())
  const pay = useAlertMutation(recordPayment, 'Could not record the payment.')
  const undo = useAlertMutation((id: string) => voidCredit(id), 'Could not undo the credit.')

  const isAdmin = user?.role === 'admin'

  async function requestUndoCredit() {
    if (!credit) {
      return
    }
    const label = customerNames.get(credit.customerId) ?? 'this credit'
    const confirmed = await confirmAction({
      title: 'Undo this credit?',
      text: `Correct "${label}"? Its balance returns to how it was before any payments, the payment history is undone (kept for the audit trail), and any sale behind it is undone with its stock restored. Encoded existing-credit records never affect inventory. Only admins can undo credits.`,
      confirmLabel: 'Undo credit',
      danger: true,
    })
    if (!confirmed) {
      return
    }
    const undone = await undo.run(credit.id)
    if (undone) {
      void notifySuccess('Credit undone.', 'The correction was recorded in History.')
      navigate(basePath)
    }
  }

  const credit = history.data?.credit
  const customerNames = new Map(
    (customers.data ?? []).map((customer) => [customer.id, customer.name]),
  )
  const userNames = new Map((users.data ?? []).map((item) => [item.id, getDisplayName(item.name)]))
  const termLabels = new Map((terms.data ?? []).map((term) => [term.id, term.label]))
  const settled = credit?.status === 'settled'

  async function handlePay(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!credit) {
      return
    }
    const resolvedMethod = method === 'Other' ? customMethod.trim() : method
    const result = await pay.run({
      creditId: credit.id,
      storeId: concreteStoreId(store),
      amountMinor: toMinor(Number(amount)),
      method: resolvedMethod,
      recordedByUserId: user?.id ?? '',
    })
    if (result) {
      setAmount('')
      setMethod('Cash')
      setCustomMethod('')
      void notifySuccess('Payment recorded.')
      history.reload()
    }
  }

  const methodOptions = PAYMENT_METHOD_PRESETS.map((preset) => ({
    value: preset,
    label: preset === 'Other' ? 'Other (specify)' : preset,
  }))

  return (
    <Stack>
      <PageHeader
        title="Credit detail"
        description={
          credit ? `${customerNames.get(credit.customerId) ?? 'Credit record'}'s credit` : undefined
        }
        actions={
          <>
            {isAdmin && credit && (
              <Button
                variant="danger"
                size="sm"
                disabled={undo.pending}
                onClick={() => void requestUndoCredit()}
              >
                Undo credit
              </Button>
            )}
            <BackLink to={basePath}>Back to credit</BackLink>
          </>
        }
        size="compact"
      />
      <AsyncBoundary
        loading={history.loading}
        error={history.error}
        onRetry={history.reload}
        skeleton={<ListSkeleton rows={4} />}
        empty={
          !history.loading && !history.error && !credit
            ? {
                title: 'No credit found',
                description: 'This credit record does not exist.',
              }
            : null
        }
      >
        {credit && (
          <>
            <Card>
              <DetailGrid>
                <DetailItem>
                  <DetailLabel>Customer</DetailLabel>
                  <DetailValue>
                    {customerNames.get(credit.customerId) ?? 'Not available'}
                  </DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Origin store</DetailLabel>
                  <DetailValue>{storeNames[credit.originStoreId]}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Terms</DetailLabel>
                  <DetailValue>
                    {credit.termsId
                      ? (termLabels.get(credit.termsId) ?? 'Not available')
                      : 'Existing balance'}
                  </DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Transaction date</DetailLabel>
                  <DetailValue>
                    <DateText value={history.data?.transactionDate ?? credit.createdAt} />
                  </DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Due date</DetailLabel>
                  <DetailValue>
                    <DateText value={credit.dueDate} />
                  </DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Original</DetailLabel>
                  <DetailValue>
                    <MoneyText amountMinor={credit.originalAmountMinor} />
                  </DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Remaining balance</DetailLabel>
                  <DetailValue>
                    <MoneyText amountMinor={credit.balanceMinor} />
                  </DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Status</DetailLabel>
                  <DetailValue>
                    <StatusBadge status={credit.status} />
                  </DetailValue>
                </DetailItem>
              </DetailGrid>
            </Card>

            <RecordList
              caption="Items received"
              columns={[
                { key: 'item', header: 'Item' },
                { key: 'quantity', header: 'Qty' },
                { key: 'price', header: 'Price' },
                { key: 'total', header: 'Line total' },
              ]}
              rows={(history.data?.items ?? []).map((item) => ({
                item: item.productName,
                quantity: String(item.quantity),
                price: <MoneyText amountMinor={item.unitPriceMinor} />,
                total: <MoneyText amountMinor={item.quantity * item.unitPriceMinor} />,
              }))}
              emptyMessage="No item details recorded for this credit."
            />

            {settled ? (
              <Alert variant="success">This credit is fully paid and settled.</Alert>
            ) : (
              <>
                <Card>
                  <form onSubmit={handlePay} noValidate>
                    <PaymentFields>
                      <TextField
                        id="payment-amount"
                        label="Payment amount (₱)"
                        type="number"
                        min={0.01}
                        step="0.01"
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                        required
                      />
                      <Select
                        id="payment-method"
                        label="Payment method"
                        options={methodOptions}
                        value={method}
                        onChange={(event) => setMethod(event.target.value)}
                        required
                      />
                      {method === 'Other' && (
                        <TextField
                          id="payment-method-custom"
                          label="Specify payment method"
                          placeholder="e.g. Maya, Palawan, COD"
                          value={customMethod}
                          onChange={(event) => setCustomMethod(event.target.value)}
                          maxLength={40}
                          required
                        />
                      )}
                      <PaymentNote>
                        {!isAllStores(store)
                          ? `Payment will be recorded at ${storeNames[concreteStoreId(store)]}.`
                          : 'Select Amara or Zeann in More → Store context to record the payment.'}
                      </PaymentNote>
                    </PaymentFields>
                    <PaymentActions>
                      <Button type="submit" disabled={pay.pending || isAllStores(store)}>
                        {pay.pending ? 'Recording…' : 'Record payment'}
                      </Button>
                    </PaymentActions>
                  </form>
                </Card>
              </>
            )}

            <RecordList
              caption="Payment history"
              columns={[
                { key: 'store', header: 'Payment store' },
                { key: 'amount', header: 'Amount' },
                { key: 'method', header: 'Method' },
                { key: 'recordedBy', header: 'Recorded by' },
                { key: 'paidAt', header: 'Date' },
              ]}
              rows={(history.data?.payments ?? []).map((payment) => ({
                store: storeNames[payment.storeId],
                amount: <MoneyText amountMinor={payment.amountMinor} />,
                method: payment.method ?? 'Not listed',
                recordedBy: userNames.get(payment.recordedByUserId) ?? 'Not available',
                paidAt: <DateText value={payment.paidAt} />,
              }))}
              emptyMessage="No payments recorded yet."
            />
          </>
        )}
      </AsyncBoundary>
    </Stack>
  )
}
