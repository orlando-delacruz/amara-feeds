import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { AppRoutes } from '@/app/router'
import { renderWithProviders } from '@/test/render'
import {
  SESSION_STORAGE_KEY,
  clearStoredSession,
  readStoredSession,
  writeStoredSession,
} from './sessionStorage'
import type { User } from '@/domain'

const staffUser: User = {
  id: 'user-1',
  name: 'Alice (Amara staff)',
  role: 'staff',
  storeId: 'amara',
  username: 'alice',
  active: true,
}

function renderAppAt(path: string) {
  // No initialUser: exercises the reload-restore path exactly like the real app.
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </AppProviders>,
  )
}

describe('mock session persistence', () => {
  beforeEach(() => {
    clearStoredSession()
  })

  it('keeps the user on a protected page across a reload', async () => {
    writeStoredSession(staffUser)
    renderAppAt('/dashboard')
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  })

  it('starts signed out when explicitly given no user, ignoring storage', async () => {
    writeStoredSession(staffUser)
    renderWithProviders(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppRoutes />
      </MemoryRouter>,
      { user: null },
    )
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('signing out clears the stored session', async () => {
    writeStoredSession(staffUser)
    renderAppAt('/more')
    expect(await screen.findByRole('heading', { name: 'More' })).toBeInTheDocument()
    const main = screen.getByRole('main')
    await userEvent.setup().click(within(main).getByRole('button', { name: 'Sign out' }))
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    expect(readStoredSession()).toBeNull()
  })

  it('ignores a corrupt stored session', async () => {
    window.localStorage.setItem(SESSION_STORAGE_KEY, 'not-json{{{')
    renderAppAt('/dashboard')
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
  })
})
