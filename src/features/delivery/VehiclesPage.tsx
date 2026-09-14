import { useState } from 'react'
import styled from 'styled-components'
import { createVehicle, deleteVehicle, listUsers, listVehicles, setVehicleActive } from '@/services'
import { Alert } from '@/components/ui/Alert'
import { AsyncBoundary } from '@/components/ui/AsyncBoundary'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DateText } from '@/components/ui/DateText'
import { FilterBar } from '@/components/ui/FilterBar'
import { PageHeader } from '@/components/ui/PageHeader'
import { RecordList } from '@/components/ui/RecordList'
import { ListSkeleton } from '@/components/ui/Skeletons'
import { Stack } from '@/components/ui/Stack'
import { TextField } from '@/components/ui/TextField'
import { StoreControl, useAsyncData, useMutation } from '@/features/shared'
import { getDisplayName } from '@/features/session/displayName'
import { useSession } from '@/features/session/useSession'
import { storeNames } from '@/store/stores'
import { useStore } from '@/store/useStore'
import { EditVehicleDialog } from './EditVehicleDialog'
import type { Vehicle } from '@/domain'

const Fields = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.space.md};

  @media (min-width: ${({ theme }) => theme.breakpoint.tablet}) {
    grid-template-columns: 1fr auto;
    align-items: end;
  }
`

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: ${({ theme }) => theme.space.md};

  @media (min-width: ${({ theme }) => theme.breakpoint.tablet}) {
    margin-top: 0;
  }
`

const RowActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space.sm};
  justify-content: flex-end;
`

export function VehiclesPage() {
  const { store, canSwitchStore } = useStore()
  const { user } = useSession()
  const [label, setLabel] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [editing, setEditing] = useState<Vehicle | null>(null)
  const [deleting, setDeleting] = useState<Vehicle | null>(null)
  const list = useAsyncData(() => listVehicles({ storeId: store }), store)
  const users = useAsyncData(() => listUsers())
  const add = useMutation(createVehicle)
  const toggle = useMutation((input: { id: string; active: boolean }) =>
    setVehicleActive(input.id, input.active),
  )
  const remove = useMutation(deleteVehicle)

  const userNames = new Map((users.data ?? []).map((item) => [item.id, getDisplayName(item.name)]))

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const created = await add.run({ label, storeId: store, createdByUserId: user?.id })
    if (created) {
      setLabel('')
      setNotice(`${created.label} added.`)
      list.reload()
    }
  }

  async function handleToggle(id: string, active: boolean) {
    const saved = await toggle.run({ id, active })
    if (saved) {
      setNotice(active ? `${saved.label} is active.` : `${saved.label} is inactive.`)
      list.reload()
    }
  }

  async function handleDelete() {
    if (!deleting) {
      return
    }
    const removed = await remove.run(deleting.id)
    if (removed) {
      setNotice(`${removed.label} deleted.`)
      setDeleting(null)
      list.reload()
    }
  }

  return (
    <Stack>
      <PageHeader
        title="Vehicles"
        description={`Vehicle types used for deliveries at ${storeNames[store]}.`}
        size="compact"
      />
      {notice && <Alert variant="success">{notice}</Alert>}
      {canSwitchStore && (
        <FilterBar>
          <StoreControl />
        </FilterBar>
      )}
      <Card>
        <form onSubmit={handleSubmit} noValidate>
          <Fields>
            <TextField
              id="vehicle-label"
              label="Vehicle type"
              placeholder="Motorcycle, Tricycle, Van…"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              required
            />
            <Actions>
              <Button type="submit" disabled={add.pending}>
                {add.pending ? 'Adding…' : 'Add vehicle'}
              </Button>
            </Actions>
          </Fields>
          {add.error && <Alert variant="danger">{add.error}</Alert>}
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
                title: 'No vehicles yet',
                description: 'Add the first vehicle type above.',
              }
            : null
        }
      >
        {toggle.error && <Alert variant="danger">{toggle.error}</Alert>}
        {remove.error && <Alert variant="danger">{remove.error}</Alert>}
        {list.data && list.data.length > 0 && (
          <RecordList
            caption={`Vehicles at ${storeNames[store]}`}
            columns={[
              { key: 'label', header: 'Vehicle' },
              { key: 'status', header: 'Status' },
              { key: 'addedBy', header: 'Added by' },
              { key: 'createdAt', header: 'Added' },
              { key: 'actions', header: 'Actions' },
            ]}
            rows={list.data.map((vehicle) => ({
              label: vehicle.label,
              status: vehicle.active ? 'Active' : 'Inactive',
              addedBy: vehicle.createdByUserId
                ? (userNames.get(vehicle.createdByUserId) ?? 'Not available')
                : 'Not available',
              createdAt: <DateText value={vehicle.createdAt} />,
              actions: (
                <RowActions>
                  <Button size="sm" variant="secondary" onClick={() => setEditing(vehicle)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant={vehicle.active ? 'danger' : 'secondary'}
                    disabled={toggle.pending}
                    onClick={() => handleToggle(vehicle.id, !vehicle.active)}
                  >
                    {vehicle.active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={remove.pending}
                    onClick={() => setDeleting(vehicle)}
                  >
                    Delete
                  </Button>
                </RowActions>
              ),
            }))}
          />
        )}
      </AsyncBoundary>
      <EditVehicleDialog
        key={editing?.id ?? 'none'}
        vehicle={editing}
        onClose={() => setEditing(null)}
        onSaved={(vehicle) => {
          setEditing(null)
          setNotice(`${vehicle.label} updated.`)
          list.reload()
        }}
      />
      <ConfirmDialog
        open={deleting !== null}
        title="Delete vehicle"
        message={
          deleting
            ? `Delete "${deleting.label}"? This cannot be undone. Vehicles used by sales, receiving, or expenses cannot be deleted.`
            : ''
        }
        confirmLabel="Delete"
        pending={remove.pending}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </Stack>
  )
}
