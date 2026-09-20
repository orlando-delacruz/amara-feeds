import type { NewUserInput, UpdateUserInput, User, UserId, UserRole } from '@/domain'
import type { StoreId } from '@/domain'
import { getDb } from './mocks/db'
import { nextId } from './mocks/ids'
import { isSupabaseConfigured, supabase, usernameEmail } from './supabaseClient'
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

interface ProfileRow {
  id: string
  username: string
  name: string
  role: UserRole
  store_id: StoreId | null
  active: boolean
}

function profileToUser(profile: ProfileRow): User {
  return {
    id: profile.id,
    name: profile.name,
    role: profile.role,
    storeId: profile.store_id ?? undefined,
    username: profile.username,
    active: profile.active,
  }
}

/**
 * Sign-in. With Supabase configured, resolves the username to its email
 * convention, authenticates against Supabase Auth, and reads the caller's
 * profile row for role/store. Otherwise uses the mock credential check for
 * the localStorage login form (never real passwords).
 */
export async function signIn(input: { username: string; password: string }): Promise<User> {
  const username = input.username.trim().toLowerCase()
  if (isSupabaseConfigured && supabase) {
    const email = usernameEmail(username)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: input.password,
    })
    if (error || !data.user) {
      throw new ServiceError('validation', 'Incorrect username or password.')
    }
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, name, role, store_id, active')
      .eq('id', data.user.id)
      .single()
    if (profileError || !profile) {
      throw new ServiceError('validation', 'This account is disabled. Contact the admin.')
    }
    if (!profile.active) {
      throw new ServiceError('validation', 'This account is disabled. Contact the admin.')
    }
    return profileToUser(profile)
  }

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

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc('create_staff', {
      p_username: username,
      p_name: name,
      p_role: input.role,
      p_store_id: input.role === 'staff' ? (input.storeId ?? null) : null,
      p_password: input.password,
    })
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    const userId = data?.user_id as string | undefined
    return {
      id: userId ?? '',
      name,
      role: input.role,
      storeId: input.role === 'staff' ? input.storeId : undefined,
      username,
      active: true,
    }
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

export function serviceErrorFromSupabase(error: { message: string; code?: string }): ServiceError {
  const message = error.message ?? 'Something went wrong.'
  const code = error.code
  if (code === 'P0001' || message.includes('already taken') || message.includes('duplicate')) {
    return new ServiceError('conflict', message)
  }
  if (code === '42501' || message.toLowerCase().includes('not found')) {
    return new ServiceError('not_found', message)
  }
  return new ServiceError('validation', message)
}
