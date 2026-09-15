import type { User } from '@/domain'

// Mock-session persistence only. Keeps the signed-in mock account across page
// reloads; real authentication (Supabase Auth) replaces this in a later phase.
export const SESSION_STORAGE_KEY = 'zaf-one.session.v1'

function isStoredUser(value: unknown): value is User {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const record = value as Record<string, unknown>
  return (
    typeof record.id === 'string' &&
    record.id !== '' &&
    (record.role === 'staff' || record.role === 'admin')
  )
}

export function readStoredSession(): User | null {
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed: unknown = JSON.parse(raw)
    return isStoredUser(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function writeStoredSession(user: User): void {
  try {
    // Mock-only hygiene: the session never persists the credential,
    // even though the mock user carries one for the login form.
    const sessionUser = { ...user }
    delete sessionUser.password
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionUser))
  } catch {
    // Storage unavailable (e.g. private mode) — the session simply won't persist.
  }
}

export function clearStoredSession(): void {
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY)
  } catch {
    // Storage unavailable — nothing to clear.
  }
}
