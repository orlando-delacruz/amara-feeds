import { useState } from 'react'
import styled from 'styled-components'
import { Link, useParams } from 'react-router-dom'
import { getCreditHistory, listCustomers, listPaymentTerms, recordPayment } from '@/services'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { DateText } from '@/components/ui/DateText'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingState } from '@/components/ui/LoadingState'
import { MoneyText } from '@/components/ui/MoneyText'
import { PageHeader } from '@/components/ui/PageHeader'
import { Stack } from '@/components/ui/Stack'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { TextField } from '@/components/ui/TextField'
import { useAsyncData, useMutation } from '@/features/shared'
import { toMinor } from '@/lib/money'
import { storeNames } from '@/store/stores'
import { useStore } from '@/store/useStore'

interface CreditDetailPageProps {
  basePath?: string
}

const DetailCard = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: ${({ theme }) => theme.space.md};
  padding: ${({ theme }) => theme.space.lg};
  background-color: ${({ theme }) => theme.color.surface.card};
  border: 1px solid ${({ theme }) => theme.color.border.default};
  border-radius: ${({ theme }) => theme.radius.lg};
`

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
`

const DetailLabel = styled.span`
  font-size: ${({ theme }) => theme.font.size.xs};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${({ theme }) => theme.color.text.secondary};
`

const DetailValue = styled.span`
  font-weight: ${({ theme }) => theme.font.weight.semibold};
`

const PaymentForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.lg};
  padding: ${({ theme }) => theme.space.lg};
  background-color: ${({ theme }) => theme.color.surface.card};
  border: 1px solid ${({ theme }) => theme.color.border.default};
  border-radius: ${({ theme }) => theme.radius.lg};
`

const PaymentActions = styled.div`
  display: flex;
  justify-content: flex-end;
`

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: ${({ theme }) => theme.touch.minTarget};
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border: 1px solid ${({ theme }) => theme.color.border.strong};
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ theme }) => theme.color.white};
  color: ${({ theme }) => theme.color.text.primary};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  text-decoration: none;
`

export function CreditDetailPage({ basePath = '/credit' }: CreditDetailPageProps) {
  const { creditId } = useParams<{ creditId: string }>()
  const { store } = useStore()
  const [amount, setAmount] = useState('')
  const [notice, setNotice] = useState<string | null>(null)

  const history = useAsyncData(
    () => (creditId ? getCreditHistory(creditId) : Promise.resolve(null)),
    creditId ?? '',
  )
  const customers = useAsyncData(() => listCustomers())
  const terms = useAsyncData(() => listPaymentTerms())
  const pay = useMutation(recordPayment)

  const credit = history.data?.credit
  const customerNames = new Map(
    (customers.data ?? []).map((customer) => [customer.id, customer.name]),
  )
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
          credit ? `${customerNames.get(credit.customerId) ?? 'Customer'}'s credit` : undefined
        }
        actions={<BackLink to={basePath}>Back to credit</BackLink>}
      />
      {notice && <Alert variant="success">{notice}</Alert>}
      {history.loading && <LoadingState text="Loading credit…" />}
      {history.error && <ErrorState description={history.error} />}
      {!history.loading && !history.error && !credit && (
        <EmptyState title="No credit found" description="This credit record does not exist." />
      )}
      {!history.loading && !history.error && credit && (
        <>
          <DetailCard>
            <DetailItem>
              <DetailLabel>Customer</DetailLabel>
              <DetailValue>{customerNames.get(credit.customerId) ?? 'Unknown'}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>Origin store</DetailLabel>
              <DetailValue>{storeNames[credit.originStoreId]}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>Terms</DetailLabel>
              <DetailValue>{termLabels.get(credit.termsId) ?? '—'}</DetailValue>
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
          </DetailCard>

          {settled ? (
            <Alert variant="success">This credit is fully paid and settled.</Alert>
          ) : (
            <PaymentForm onSubmit={handlePay} noValidate>
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
              <p>Payment will be recorded at {storeNames[store]}.</p>
              <PaymentActions>
                <Button type="submit" disabled={pay.pending}>
                  {pay.pending ? 'Recording…' : 'Record payment'}
                </Button>
              </PaymentActions>
            </PaymentForm>
          )}

          <DataTable
            caption="Payment history"
            columns={[
              { key: 'store', header: 'Payment store' },
              { key: 'amount', header: 'Amount' },
              { key: 'paidAt', header: 'Date' },
            ]}
            rows={(history.data?.payments ?? []).map((payment) => ({
              store: storeNames[payment.storeId],
              amount: <MoneyText amountMinor={payment.amountMinor} />,
              paidAt: <DateText value={payment.paidAt} />,
            }))}
          />
        </>
      )}
    </Stack>
  )
}
