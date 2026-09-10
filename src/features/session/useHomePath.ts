import { useSession } from './useSession'

export function useHomePath(): string {
  const { user } = useSession()
  return user?.role === 'admin' ? '/admin' : '/dashboard'
}
