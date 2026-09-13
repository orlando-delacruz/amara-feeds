import { useState } from 'react'
import styled from 'styled-components'
import { useParams } from 'react-router-dom'
import {
  getCreditHistory,
  listCustomers,
  listPaymentTerms,
  listUsers,
  recordPayment,
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
  const { store } = useStore()
  const { user } = useSession()
  const [amount, setAmount] = useState('')
  const [notice, setNotice] = useState<string | null>(null)

  const history = useAsyncData(
    () => (creditId ? getCreditHistory(creditId) : Promise.resolve(null)),
    creditId ?? '',
  )
  const customers = useAsyncData(() => listCustomers())
  const terms = useAsyncData(() => listPaymentTerms())
  const users = useAsyncData(() => listUsers())
  const pay = useMutation(recordPayment)

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
    const result = await pay.run({
      creditId: credit.id,
      storeId: store,
      amountMinor: toMinor(Number(amount)),
      recordedByUserId: user?.id ?? '',
    })
    if (result) {
      setAmount('')
      setNotice('Payment recorded.')
      history.reload()
    }
  }

  return (
    <Stack>
      <PageHeader
        title="Credit detail"
        description={
          credit ? `${customerNames.get(credit.customerId) ?? 'Credit record'}'s credit` : undefined
        }
        actions={<BackLink to={basePath}>Back to credit</BackLink>}
        size="compact"
      />
      {notice && <Alert variant="success">{notice}</Alert>}
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
                  <DetailValue>{termLabels.get(credit.termsId) ?? 'Not available'}</DetailValue>
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

            {settled ? (
              <Alert variant="success">This credit is fully paid and settled.</Alert>
            ) : (
              <>
                <StoreControl />
                <Card>
                  <form onSubmit={handlePay} noValidate>
                    <PaymentFields>
                      {pay.error && <Alert variant="danger">{pay.error}</Alert>}
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
                      <PaymentNote>Payment will be recorded at {storeNames[store]}.</PaymentNote>
                    </PaymentFields>
                    <PaymentActions>
                      <Button type="submit" disabled={pay.pending}>
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
                { key: 'recordedBy', header: 'Recorded by' },
                { key: 'paidAt', header: 'Date' },
              ]}
              rows={(history.data?.payments ?? []).map((payment) => ({
                store: storeNames[payment.storeId],
                amount: <MoneyText amountMinor={payment.amountMinor} />,
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
