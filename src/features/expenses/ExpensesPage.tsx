import { useMemo, useState } from 'react'
import styled from 'styled-components'
import {
  createExpense,
  deleteExpense,
  getDeliveryNetSummary,
  listExpenses,
  listRiders,
  listUsers,
  listVehicles,
  updateExpense,
} from '@/services'
import { Alert } from '@/components/ui/Alert'
import { AsyncBoundary } from '@/components/ui/AsyncBoundary'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DateText } from '@/components/ui/DateText'
import { Dialog } from '@/components/ui/Dialog'
import { MoneyText } from '@/components/ui/MoneyText'
import { PageHeader } from '@/components/ui/PageHeader'
import { RecordList } from '@/components/ui/RecordList'
import { Section } from '@/components/ui/Section'
import { Select } from '@/components/ui/Select'
import { ListSkeleton } from '@/components/ui/Skeletons'
import { Stack } from '@/components/ui/Stack'
import { TextField } from '@/components/ui/TextField'
import { useAsyncData, useAlertMutation } from '@/features/shared'
import { confirmAction, notifySuccess } from '@/lib/swal'
import { buildExpenseDateSummary } from './expenseSummary'
import { getDisplayName } from '@/features/session/displayName'
import { useSession } from '@/features/session/useSession'
import { formatPeso, toMinor } from '@/lib/money'
import { concreteStoreId, isAllStores, storeLabel } from '@/store/stores'
import { useStore } from '@/store/useStore'
import type { Expense, ExpenseType, Rider, Vehicle } from '@/domain'

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

const RowActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space.sm};
  justify-content: flex-end;
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

function EditExpenseDialog({
  record,
  riders,
  vehicles,
  onSaved,
}: {
  record: Expense | null
  riders: Rider[]
  vehicles: Vehicle[]
  onSaved: () => void
}) {
  const [targetKind, setTargetKind] = useState<'rider' | 'vehicle'>(
    record?.riderId ? 'rider' : 'vehicle',
  )
  const [targetId, setTargetId] = useState(record?.riderId ?? record?.vehicleId ?? '')
  const [type, setType] = useState<ExpenseType>(record?.type ?? 'fuel')
  const [amount, setAmount] = useState(record ? String(record.amountMinor / 100) : '')
  const [note, setNote] = useState(record?.note ?? '')
  const [formError, setFormError] = useState<string | null>(null)
  const { run, pending } = useAlertMutation(
    (input: { targetId: string; type: ExpenseType; amount: string; note: string }) =>
      updateExpense(record!.id, {
        type: input.type,
        amountMinor: toMinor(Number(input.amount)),
        note: input.note || undefined,
        ...(targetKind === 'rider' ? { riderId: input.targetId } : { vehicleId: input.targetId }),
      }),
    'Could not update the expense.',
  )

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!record || !targetId || Number(amount) <= 0) {
      setFormError('Select a target and enter an amount greater than zero.')
      return
    }
    setFormError(null)
    const saved = await run({ targetId, type, amount, note })
    if (saved) {
      onSaved()
    }
  }

  const targetOptions =
    targetKind === 'rider'
      ? riders.map((rider) => ({ value: rider.id, label: rider.name }))
      : vehicles.map((vehicle) => ({ value: vehicle.id, label: vehicle.label }))

  return (
    <Dialog open={record !== null} title="Edit expense" onClose={onSaved}>
      <form
        onSubmit={handleSubmit}
        noValidate
        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        {formError && <Alert variant="danger">{formError}</Alert>}
        <Select
          id="edit-expense-target-kind"
          label="Assign to"
          options={[
            { value: 'rider', label: 'Rider' },
            { value: 'vehicle', label: 'Vehicle' },
          ]}
          value={targetKind}
          onChange={(event) => {
            setTargetKind(event.target.value as 'rider' | 'vehicle')
            setTargetId('')
          }}
        />
        <Select
          id="edit-expense-target"
          label={targetKind === 'rider' ? 'Rider' : 'Vehicle'}
          options={targetOptions}
          placeholder={targetKind === 'rider' ? 'Select a rider' : 'Select a vehicle'}
          value={targetId}
          onChange={(event) => setTargetId(event.target.value)}
          required
        />
        <Select
          id="edit-expense-type"
          label="Expense type"
          options={expenseTypeOptions}
          value={type}
          onChange={(event) => setType(event.target.value as ExpenseType)}
        />
        <TextField
          id="edit-expense-amount"
          label="Amount (₱)"
          type="number"
          min={0}
          step="0.01"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          required
        />
        <TextField
          id="edit-expense-note"
          label="Note (optional)"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save changes'}
        </Button>
      </form>
    </Dialog>
  )
}

export function ExpensesPage() {
  const { store } = useStore()
  const { user } = useSession()
  const isAdmin = user?.role === 'admin'
  const [form, setForm] = useState<ExpenseFormState>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  // 'All stores' reviews both stores; expenses are recorded per concrete store.
  const allMode = isAllStores(store)
  const contextStoreId = concreteStoreId(store)
  const expenses = useAsyncData(
    () => listExpenses(allMode ? {} : { storeId: contextStoreId }),
    store,
  )
  const riders = useAsyncData(() => listRiders({ storeId: contextStoreId, active: true }), store)
  const vehicles = useAsyncData(
    () => listVehicles({ storeId: contextStoreId, active: true }),
    store,
  )
  const users = useAsyncData(() => listUsers())
  const netSummary = useAsyncData(() => getDeliveryNetSummary(contextStoreId), store)
  const add = useAlertMutation(createExpense, 'Could not record the expense.')
  const [editing, setEditing] = useState<Expense | null>(null)
  const remove = useAlertMutation(
    (expenseId: string) => deleteExpense(expenseId),
    'Could not delete the expense.',
  )

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
      storeId: contextStoreId,
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

  async function requestDelete(record: Expense) {
    const confirmed = await confirmAction({
      title: 'Delete this expense?',
      text: `Permanently delete the ${record.type} expense of ${formatPeso(record.amountMinor)}? Net summaries update accordingly.`,
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!confirmed) {
      return
    }
    const deleted = await remove.run(record.id)
    if (deleted) {
      void notifySuccess('Expense deleted.')
      expenses.reload()
      netSummary.reload()
    }
  }

  function handleSaved() {
    setEditing(null)
    void notifySuccess('Expense updated.')
    expenses.reload()
    netSummary.reload()
  }

  // By-date summary of the recorded expenses in view (DEC-054). Expenses carry
  // no expense-date field, so each record counts on its recording date.
  const dateSummary = useMemo(() => buildExpenseDateSummary(expenses.data ?? []), [expenses.data])

  const riderNames = new Map((riders.data ?? []).map((rider: Rider) => [rider.id, rider.name]))
  const vehicleNames = new Map(
    (vehicles.data ?? []).map((vehicle: Vehicle) => [vehicle.id, vehicle.label]),
  )

  return (
    <Stack>
      <PageHeader
        title="Expenses"
        description={`Fuel and repair expenses at ${storeLabel(store)}.`}
        size="compact"
      />
      {dateSummary.length > 0 && (
        <Section title="Summary by date">
          <RecordList
            caption="Recorded expenses summarized by date"
            columns={[
              { key: 'date', header: 'Date' },
              { key: 'fuel', header: 'Fuel' },
              { key: 'repair', header: 'Repair' },
              { key: 'total', header: 'Total' },
            ]}
            rows={dateSummary.map((entry) => ({
              date: <DateText value={`${entry.date}T00:00:00`} />,
              fuel: <MoneyText amountMinor={entry.fuelMinor} />,
              repair: <MoneyText amountMinor={entry.repairMinor} />,
              total: <MoneyText amountMinor={entry.totalMinor} />,
            }))}
          />
        </Section>
      )}
      {formError && <Alert variant="danger">{formError}</Alert>}
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
            caption={`Expense history — ${storeLabel(store)}`}
            columns={[
              { key: 'target', header: 'Rider / Vehicle' },
              { key: 'type', header: 'Type' },
              { key: 'amount', header: 'Amount' },
              { key: 'note', header: 'Note' },
              { key: 'recordedBy', header: 'Recorded by' },
              { key: 'createdAt', header: 'Date' },
              ...(isAdmin ? [{ key: 'actions', header: 'Actions' }] : []),
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
              ...(isAdmin
                ? {
                    actions: (
                      <RowActions>
                        <Button size="sm" variant="secondary" onClick={() => setEditing(record)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={remove.pending}
                          onClick={() => void requestDelete(record)}
                        >
                          Delete
                        </Button>
                      </RowActions>
                    ),
                  }
                : {}),
            }))}
          />
        )}
      </AsyncBoundary>
      <EditExpenseDialog
        key={editing?.id ?? 'none'}
        record={editing}
        riders={riders.data ?? []}
        vehicles={vehicles.data ?? []}
        onSaved={handleSaved}
      />
    </Stack>
  )
}
