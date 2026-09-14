import { useCallback, useEffect, useState } from 'react'
import { listAuditEventsForUser } from '@/services/auditService'
import { getHistoryLastSeen } from './historySeen'
import type { User } from '@/domain'

export function useHistoryUnread(user: User | undefined): boolean {
  const [hasUnread, setHasUnread] = useState(false)

  const checkUnread = useCallback(async () => {
    if (!user) {
      setHasUnread(false)
      return
    }
    const lastSeen = getHistoryLastSeen()
    const events = await listAuditEventsForUser(user)
    if (!lastSeen) {
      setHasUnread(events.length > 0)
      return
    }
    setHasUnread(events.some((event) => event.createdAt > lastSeen))
  }, [user])

  useEffect(() => {
    const timer = setTimeout(() => void checkUnread(), 0)
    const interval = setInterval(() => void checkUnread(), 30_000)
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [checkUnread])

  return hasUnread
}
