import { Navigate, Outlet } from 'react-router-dom'
import type { UserRole } from '@/domain'
import { useSession } from './useSession'

export function RequireAuth() {
  const { user } = useSession()
  if (!user) {
    return <Navigate to="/sign-in" replace />
  }
  return <Outlet />
}

export function RequireRole({ role }: { role: UserRole }) {
  const { user } = useSession()
  if (!user) {
    return <Navigate to="/sign-in" replace />
  }
  if (user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
  }
  return <Outlet />
}
