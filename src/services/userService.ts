import type { NewUserInput, UpdateUserInput, User, UserId, UserRole } from '@/domain'
import type { StoreId } from '@/domain'
import { getDb } from './mocks/db'
import { nextId } from './mocks/ids'
import { ServiceError } from './errors'

export async function listUsers(
  filter: { storeId?: StoreId; role?: UserRole; active?: boolean } = {},
): Promise<User[]> {
  return getDb()
    .users.filter(
      (user) =>
        (!filter.storeId || user.storeId === filter.storeId) &&
        (!filter.role || user.role === filter.role) &&
        (filter.active === undefined || user.active === filter.active),
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

/**
 * Mock-only credential check for the localStorage login form.
 * Never real passwords; replaced by Supabase Auth in a later phase.
 */
export async function signIn(input: { username: string; password: string }): Promise<User> {
  const username = input.username.trim().toLowerCase()
  const user = getDb().users.find((item) => item.username.toLowerCase() === username)
  if (!user || user.password !== input.password) {
    throw new ServiceError('validation', 'Incorrect username or password.')
  }
  if (!user.active) {
    throw new ServiceError('validation', 'This account is disabled. Contact the admin.')
  }
  return { ...user }
}

export async function createUser(input: NewUserInput): Promise<User> {
  const name = input.name.trim()
  if (!name) {
    throw new ServiceError('validation', 'Staff name is required.')
  }
  const username = input.username.trim()
  if (!username) {
    throw new ServiceError('validation', 'Username is required.')
  }
  if (input.password.length < 4) {
    throw new ServiceError('validation', 'Password must be at least 4 characters.')
  }
  if (input.role === 'staff' && !input.storeId) {
    throw new ServiceError('validation', 'Each staff member must be assigned to a store.')
  }
  const taken = getDb().users.some((item) => item.username.toLowerCase() === username.toLowerCase())
  if (taken) {
    throw new ServiceError('conflict', 'That username is already taken.')
  }
  const user: User = {
    id: nextId('user'),
    name,
    role: input.role,
    storeId: input.role === 'staff' ? input.storeId : undefined,
    username,
    password: input.password,
    active: true,
  }
  getDb().users.push(user)
  return { ...user }
}

export async function updateUser(id: UserId, patch: UpdateUserInput): Promise<User> {
  const user = getDb().users.find((item) => item.id === id)
  if (!user) {
    throw new ServiceError('not_found', 'User not found.')
  }
  if (patch.name !== undefined) {
    const name = patch.name.trim()
    if (!name) {
      throw new ServiceError('validation', 'Staff name is required.')
    }
    user.name = name
  }
  if (patch.username !== undefined) {
    const username = patch.username.trim()
    if (!username) {
      throw new ServiceError('validation', 'Username is required.')
    }
    const taken = getDb().users.some(
      (item) => item.id !== id && item.username.toLowerCase() === username.toLowerCase(),
    )
    if (taken) {
      throw new ServiceError('conflict', 'That username is already taken.')
    }
    user.username = username
  }
  if (patch.storeId !== undefined) {
    if (user.role === 'staff' && !patch.storeId) {
      throw new ServiceError('validation', 'Each staff member must be assigned to a store.')
    }
    user.storeId = user.role === 'staff' ? patch.storeId : undefined
  }
  if (patch.password !== undefined) {
    if (patch.password.length < 4) {
      throw new ServiceError('validation', 'Password must be at least 4 characters.')
    }
    user.password = patch.password
  }
  if (patch.active !== undefined) {
    user.active = patch.active
  }
  return { ...user }
}

/** Throws unless the id belongs to a known, active account. Used by record-creating services. */
export function assertActiveRecorder(userId: UserId): void {
  const user = getDb().users.find((item) => item.id === userId)
  if (!user) {
    throw new ServiceError('validation', 'The recording staff member is not recognized.')
  }
  if (!user.active) {
    throw new ServiceError('validation', 'This account is disabled. Contact the admin.')
  }
}
