import { useState } from 'react'
import styled from 'styled-components'
import { listUsers, updateUser } from '@/services'
import { Alert } from '@/components/ui/Alert'
import { AsyncBoundary } from '@/components/ui/AsyncBoundary'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PageHeader } from '@/components/ui/PageHeader'
import { RecordList } from '@/components/ui/RecordList'
import { ListSkeleton } from '@/components/ui/Skeletons'
import { Stack } from '@/components/ui/Stack'
import { StoreBadge } from '@/components/ui/StoreBadge'
import { useAsyncData, useMutation } from '@/features/shared'
import { getDisplayName } from '@/features/session/displayName'
import { AddStaffDialog } from './AddStaffDialog'
import { EditStaffDialog } from './EditStaffDialog'
import type { UpdateUserInput, User, UserId } from '@/domain'

const RowActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space.sm};
  justify-content: flex-end;
`

const AccountBadge = styled.span<{ $tone: 'success' | 'warning' }>`
  display: inline-block;
  padding: ${({ theme }) => theme.space.xs} ${({ theme }) => theme.space.sm};
  border: 1px solid ${({ theme, $tone }) => theme.color.status[$tone].border};
  border-radius: ${({ theme }) => theme.radius.full};
  background-color: ${({ theme, $tone }) => theme.color.status[$tone].background};
  color: ${({ theme, $tone }) => theme.color.status[$tone].text};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  white-space: nowrap;
`

export function StaffListPage() {
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [toggling, setToggling] = useState<User | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const { data, loading, error, reload } = useAsyncData(() => listUsers({ role: 'staff' }))
  const toggle = useMutation((input: { id: UserId; patch: UpdateUserInput }) =>
    updateUser(input.id, input.patch),
  )

  async function handleToggle() {
    if (!toggling) {
      return
    }
    const saved = await toggle.run({ id: toggling.id, patch: { active: !toggling.active } })
    if (saved) {
      setNotice(
        saved.active
          ? `${getDisplayName(saved.name)} is enabled.`
          : `${getDisplayName(saved.name)} is disabled and can no longer sign in.`,
      )
      setToggling(null)
      reload()
    }
  }

  return (
    <Stack>
      <PageHeader
        title="Staff"
        description="Staff accounts and their assigned store."
        actions={<Button onClick={() => setAddOpen(true)}>Add staff</Button>}
        size="compact"
      />
      {notice && <Alert variant="success">{notice}</Alert>}
      {toggle.error && <Alert variant="danger">{toggle.error}</Alert>}
      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={reload}
        skeleton={<ListSkeleton rows={3} />}
        empty={
          data && data.length === 0
            ? {
                title: 'No staff yet',
                description: 'Add the first staff account to get started.',
                action: <Button onClick={() => setAddOpen(true)}>Add staff</Button>,
              }
            : null
        }
      >
        {data && data.length > 0 && (
          <RecordList
            caption="Staff accounts"
            columns={[
              { key: 'name', header: 'Name' },
              { key: 'username', header: 'Username' },
              { key: 'store', header: 'Store' },
              { key: 'status', header: 'Status' },
              { key: 'actions', header: 'Actions' },
            ]}
            rows={data.map((user) => ({
              name: getDisplayName(user.name),
              username: user.username,
              store: user.storeId ? <StoreBadge store={user.storeId} /> : 'Not assigned',
              status: (
                <AccountBadge $tone={user.active ? 'success' : 'warning'}>
                  {user.active ? 'Active' : 'Disabled'}
                </AccountBadge>
              ),
              actions: (
                <RowActions>
                  <Button size="sm" variant="secondary" onClick={() => setEditing(user)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant={user.active ? 'danger' : 'secondary'}
                    onClick={() => setToggling(user)}
                  >
                    {user.active ? 'Disable' : 'Enable'}
                  </Button>
                </RowActions>
              ),
            }))}
          />
        )}
      </AsyncBoundary>
      <AddStaffDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(user) => {
          setAddOpen(false)
          setNotice(`${getDisplayName(user.name)} added.`)
          reload()
        }}
      />
      <EditStaffDialog
        key={editing?.id ?? 'none'}
        user={editing}
        onClose={() => setEditing(null)}
        onSaved={(user) => {
          setEditing(null)
          setNotice(`${getDisplayName(user.name)} updated.`)
          reload()
        }}
      />
      <ConfirmDialog
        open={toggling !== null}
        title={toggling?.active ? 'Disable staff' : 'Enable staff'}
        message={
          toggling
            ? toggling.active
              ? `Disable "${getDisplayName(toggling.name)}"? They will no longer be able to sign in.`
              : `Enable "${getDisplayName(toggling.name)}"? They will be able to sign in again.`
            : ''
        }
        confirmLabel={toggling?.active ? 'Disable' : 'Enable'}
        pending={toggle.pending}
        onConfirm={handleToggle}
        onCancel={() => setToggling(null)}
      />
    </Stack>
  )
}
