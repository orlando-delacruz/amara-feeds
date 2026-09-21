import { useState } from 'react'
import styled from 'styled-components'
import {
  createExpense,
  getDeliveryNetSummary,
  listExpenses,
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
import { Section } from '@/components/ui/Section'
import { Select } from '@/components/ui/Select'
import { ListSkeleton } from '@/components/ui/Skeletons'
import { Stack } from '@/components/ui/Stack'
import { TextField } from '@/components/ui/TextField'
import { StoreControl, useAsyncData, useAlertMutation } from '@/features/shared'
import { notifySuccess } from '@/lib/swal'
import { getDisplayName } from '@/features/session/displayName'
import { useSession } from '@/features/session/useSession'
import { toMinor } from '@/lib/money'
import { storeNames } from '@/store/stores'
import { useStore } from '@/store/useStore'
import type { ExpenseType, Rider, Vehicle } from '@/domain'

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

const NetGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.space.md};

  @media (min-width: ${({ theme }) => theme.breakpoint.tablet}) {
    grid-template-columns: 1fr 1fr;
  }
`

const expenseTypeOptions = [
  { value: 'fuel', label: 'Fuel' },
  { value: 'repair', label: 'Repair' },
]

interface ExpenseFormState {
  targetKind: 'rider' | 'vehicle'
  targetId: string
  type: ExpenseType
  amount: string
  note: string
}

const emptyForm: ExpenseFormState = {
  targetKind: 'rider',
  targetId: '',
  type: 'fuel',
  amount: '',
  note: '',
}

export function ExpensesPage() {
  const { store, canSwitchStore } = useStore()
  const { user } = useSession()
  const [form, setForm] = useState<ExpenseFormState>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const expenses = useAsyncData(() => listExpenses({ storeId: store }), store)
  const riders = useAsyncData(() => listRiders({ storeId: store, active: true }), store)
  const vehicles = useAsyncData(() => listVehicles({ storeId: store, active: true }), store)
  const users = useAsyncData(() => listUsers())
  const netSummary = useAsyncData(() => getDeliveryNetSummary(store), store)
  const add = useAlertMutation(createExpense, 'Could not record the expense.')

  function updateForm<K extends keyof ExpenseFormState>(key: K, value: ExpenseFormState[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value }
      if (key === 'targetKind') {
        next.targetId = ''
      }
      return next
    })
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.targetId) {
      setFormError(
        form.targetKind === 'rider'
          ? 'Select a rider to assign the expense to.'
          : 'Select a vehicle to assign the expense to.',
      )
      return
    }
    setFormError(null)
    const record = await add.run({
      storeId: store,
      type: form.type,
      amountMinor: toMinor(Number(form.amount)),
      note: form.note || undefined,
      recordedByUserId: user?.id ?? '',
      ...(form.targetKind === 'rider' ? { riderId: form.targetId } : { vehicleId: form.targetId }),
    })
    if (record) {
      setForm(emptyForm)
      void notifySuccess('Expense recorded.')
      expenses.reload()
      netSummary.reload()
    }
  }

  const targetOptions =
    form.targetKind === 'rider'
      ? (riders.data ?? []).map((rider: Rider) => ({ value: rider.id, label: rider.name }))
      : (vehicles.data ?? []).map((vehicle: Vehicle) => ({
          value: vehicle.id,
          label: vehicle.label,
        }))

  const userNames = new Map((users.data ?? []).map((item) => [item.id, getDisplayName(item.name)]))

  const riderNames = new Map((riders.data ?? []).map((rider: Rider) => [rider.id, rider.name]))
  const vehicleNames = new Map(
    (vehicles.data ?? []).map((vehicle: Vehicle) => [vehicle.id, vehicle.label]),
  )

  return (
    <Stack>
      <PageHeader
        title="Expenses"
        description={`Fuel and repair expenses at ${storeNames[store]}.`}
        size="compact"
      />
      {formError && <Alert variant="danger">{formError}</Alert>}
      {canSwitchStore && (
        <FilterBar>
          <StoreControl />
        </FilterBar>
      )}
      <Card>
        <form onSubmit={handleSubmit} noValidate>
          <Fields>
            <Select
              id="expense-target-kind"
              label="Assign to"
              options={[
                { value: 'rider', label: 'Rider' },
                { value: 'vehicle', label: 'Vehicle' },
              ]}
              value={form.targetKind}
              onChange={(event) =>
                updateForm('targetKind', event.target.value as 'rider' | 'vehicle')
              }
            />
            <Select
              id="expense-target"
              label={form.targetKind === 'rider' ? 'Rider' : 'Vehicle'}
              options={targetOptions}
              placeholder={form.targetKind === 'rider' ? 'Select a rider' : 'Select a vehicle'}
              value={form.targetId}
              onChange={(event) => updateForm('targetId', event.target.value)}
              required
            />
            <Select
              id="expense-type"
              label="Expense type"
              options={expenseTypeOptions}
              value={form.type}
              onChange={(event) => updateForm('type', event.target.value as ExpenseType)}
            />
            <TextField
              id="expense-amount"
              label="Amount (₱)"
              type="number"
              min={0}
              step="0.01"
              value={form.amount}
              onChange={(event) => updateForm('amount', event.target.value)}
              required
            />
          </Fields>
          <TextField
            id="expense-note"
            label="Note (optional)"
            value={form.note}
            onChange={(event) => updateForm('note', event.target.value)}
          />
          <Actions>
            <Button type="submit" disabled={add.pending}>
              {add.pending ? 'Recording…' : 'Record expense'}
            </Button>
          </Actions>
        </form>
      </Card>
      <AsyncBoundary
        loading={netSummary.loading}
        error={netSummary.error}
        onRetry={netSummary.reload}
        skeleton={<ListSkeleton rows={3} />}
        empty={null}
      >
        {netSummary.data && (
          <NetGrid>
            <Section title="Riders net">
              <RecordList
                caption="Riders net summary"
                columns={[
                  { key: 'name', header: 'Rider' },
                  { key: 'sales', header: 'Delivered sales' },
                  { key: 'expenses', header: 'Expenses' },
                  { key: 'net', header: 'Net' },
                ]}
                rows={netSummary.data.riders.map((entry) => ({
                  name: entry.name,
                  sales: <MoneyText amountMinor={entry.deliveredSalesMinor} />,
                  expenses: <MoneyText amountMinor={entry.expensesMinor} />,
                  net: <MoneyText amountMinor={entry.netMinor} />,
                }))}
              />
            </Section>
            <Section title="Vehicles net">
              <RecordList
                caption="Vehicles net summary"
                columns={[
                  { key: 'name', header: 'Vehicle' },
                  { key: 'sales', header: 'Delivered sales' },
                  { key: 'expenses', header: 'Expenses' },
                  { key: 'net', header: 'Net' },
                ]}
                rows={netSummary.data.vehicles.map((entry) => ({
                  name: entry.name,
                  sales: <MoneyText amountMinor={entry.deliveredSalesMinor} />,
                  expenses: <MoneyText amountMinor={entry.expensesMinor} />,
                  net: <MoneyText amountMinor={entry.netMinor} />,
                }))}
              />
            </Section>
          </NetGrid>
        )}
      </AsyncBoundary>
      <AsyncBoundary
        loading={expenses.loading}
        error={expenses.error}
        onRetry={expenses.reload}
        skeleton={<ListSkeleton rows={3} />}
        empty={
          expenses.data && expenses.data.length === 0
            ? {
                title: 'No expenses yet',
                description: 'Record the first expense above.',
              }
            : null
        }
      >
        {expenses.data && expenses.data.length > 0 && (
          <RecordList
            caption={`Expense history at ${storeNames[store]}`}
            columns={[
              { key: 'target', header: 'Rider / Vehicle' },
              { key: 'type', header: 'Type' },
              { key: 'amount', header: 'Amount' },
              { key: 'note', header: 'Note' },
              { key: 'recordedBy', header: 'Recorded by' },
              { key: 'createdAt', header: 'Date' },
            ]}
            rows={expenses.data.map((record) => ({
              target:
                (record.riderId ? riderNames.get(record.riderId) : null) ??
                (record.vehicleId ? vehicleNames.get(record.vehicleId) : null) ??
                'Not available',
              type: record.type === 'fuel' ? 'Fuel' : 'Repair',
              amount: <MoneyText amountMinor={record.amountMinor} />,
              note: record.note ?? '—',
              recordedBy: userNames.get(record.recordedByUserId) ?? 'Not available',
              createdAt: <DateText value={record.createdAt} />,
            }))}
          />
        )}
      </AsyncBoundary>
    </Stack>
  )
}
