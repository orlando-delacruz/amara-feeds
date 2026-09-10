import type { User, UserId, UserRole } from '@/domain'
import type { StoreId } from '@/domain'
import { getDb } from './mocks/db'
import { ServiceError } from './errors'

export async function listUsers(
  filter: { storeId?: StoreId; role?: UserRole } = {},
): Promise<User[]> {
  return getDb()
    .users.filter(
      (user) =>
        (!filter.storeId || user.storeId === filter.storeId) &&
        (!filter.role || user.role === filter.role),
    )
    .map((user) => ({ ...user }))
}

export async function getUser(id: UserId): Promise<User> {
  const user = getDb().users.find((item) => item.id === id)
  if (!user) {
    throw new ServiceError('not_found', 'User not found.')
  }
  return { ...user }
}
