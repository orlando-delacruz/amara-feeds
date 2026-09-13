import { beforeEach, describe, expect, it } from 'vitest'
import { clearStoredSession, readStoredSession, writeStoredSession } from './sessionStorage'
import type { User } from '@/domain'

const userWithPassword: User = {
  id: 'user-1',
  name: 'Alice',
  role: 'staff',
  storeId: 'amara',
  username: 'alice',
  password: 'alice123',
  active: true,
}

describe('sessionStorage', () => {
  beforeEach(() => {
    clearStoredSession()
  })

  it('persists the session without the credential', () => {
    writeStoredSession(userWithPassword)
    const stored = readStoredSession()
    expect(stored?.id).toBe('user-1')
    expect(stored).not.toHaveProperty('password')
  })

  it('returns null when nothing is stored', () => {
    expect(readStoredSession()).toBeNull()
  })
})
