import { useEffect, useState } from 'react'
import { listUsers } from '@/services'
import { AUDIT_ACTION_LABELS, listAuditEventsForUser } from '@/services/auditService'
import { AsyncBoundary } from '@/components/ui/AsyncBoundary'
import { DatePicker } from '@/components/ui/DatePicker'
import { DateText } from '@/components/ui/DateText'
import { FilterBar } from '@/components/ui/FilterBar'
import { PageHeader } from '@/components/ui/PageHeader'
import { RecordList } from '@/components/ui/RecordList'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { ListSkeleton } from '@/components/ui/Skeletons'
import { Stack } from '@/components/ui/Stack'
import { StoreBadge } from '@/components/ui/StoreBadge'
import { useAsyncData } from '@/features/shared'
import { getDisplayName } from '@/features/session/displayName'
import { useSession } from '@/features/session/useSession'
import type { StoreId } from '@/domain'
import { setHistoryLastSeen } from './historySeen'

export function AuditTrailPage() {
  const { user } = useSession()
  const [date, setDate] = useState('')
  const [filter, setFilter] = useState<'all' | 'mine' | 'admin'>('all')
  const [storeFilter, setStoreFilter] = useState<'all' | StoreId>('all')
  const users = useAsyncData(() => listUsers())
  const trail = useAsyncData(
    () =>
      user
        ? listAuditEventsForUser(user, {
            ...(date ? { date } : {}),
            ...(storeFilter !== 'all' ? { storeId: storeFilter } : {}),
          })
        : Promise.resolve([]),
    `${user?.id}:${user?.role}:${date}:${storeFilter}`,
  )

  useEffect(() => {
    setHistoryLastSeen(new Date().toISOString())
  }, [])

  const userNames = new Map((users.data ?? []).map((item) => [item.id, getDisplayName(item.name)]))

  const visible = (trail.data ?? []).filter((event) => {
    if (!user || user.role === 'admin') {
      if (filter === 'mine') return event.actorUserId === user?.id
      return true
    }
    if (filter === 'mine') return event.actorUserId === user.id
    if (filter === 'admin') return event.actorUserId !== user.id
    return true
  })

  return (
    <Stack>
      <PageHeader
        title="History"
        description={
          user?.role === 'admin'
            ? 'Every staff and admin action across both stores.'
            : 'Your actions, plus admin decisions connected to your account.'
        }
        size="compact"
      />
      <FilterBar>
        <DatePicker
          id="history-date"
          label="Date"
          value={date}
          onChange={setDate}
          hint="Leave empty to see all dates."
        />
        <SegmentedControl
          label="Whose actions"
          value={filter}
          onChange={(next) => setFilter(next as 'all' | 'mine' | 'admin')}
          options={[
            { value: 'all', label: user?.role === 'admin' ? 'Everyone' : 'All mine' },
            { value: 'mine', label: 'My actions' },
            { value: 'admin', label: user?.role === 'admin' ? 'Admins' : 'Admin replies' },
          ]}
        />
        {user?.role === 'admin' && (
          <SegmentedControl
            label="Store"
            value={storeFilter}
            onChange={(next) => setStoreFilter(next as 'all' | StoreId)}
            options={[
              { value: 'all', label: 'All stores' },
              { value: 'amara', label: 'Amara' },
              { value: 'zeann', label: 'Zeann' },
            ]}
          />
        )}
      </FilterBar>
      <AsyncBoundary
        loading={trail.loading || users.loading}
        error={trail.error ?? users.error}
        onRetry={() => {
          trail.reload()
          users.reload()
        }}
        skeleton={<ListSkeleton rows={4} />}
        empty={
          visible.length === 0
            ? {
                title: 'No history yet',
                description:
                  user?.role === 'admin'
                    ? 'Actions across both stores will appear here.'
                    : 'Your recorded actions and connected admin decisions will appear here.',
              }
            : null
        }
      >
        {visible.length > 0 && (
          <RecordList
            caption="History"
            columns={[
              { key: 'action', header: 'Action' },
              { key: 'subject', header: 'Details' },
              { key: 'actor', header: 'By' },
              { key: 'store', header: 'Store' },
              { key: 'at', header: 'When' },
            ]}
            rows={visible.map((event) => ({
              action: AUDIT_ACTION_LABELS[event.action],
              subject: `${event.subject}${event.detail ? ` — ${event.detail}` : ''}`,
              actor: `${userNames.get(event.actorUserId) ?? 'Not available'} · ${event.actorRole === 'admin' ? 'Admin' : 'Staff'}`,
              store: event.storeId ? <StoreBadge store={event.storeId} /> : 'Both stores',
              at: <DateText value={event.createdAt} />,
            }))}
          />
        )}
      </AsyncBoundary>
    </Stack>
  )
}
