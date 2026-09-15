import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '@/app/router'
import { resetDb } from '@/services/mocks/db'
import { listUsers, updateUser } from '@/services'
import { renderWithProviders } from '@/test/render'

function renderSignIn() {
  renderWithProviders(
    <MemoryRouter initialEntries={['/sign-in']}>
      <AppRoutes />
    </MemoryRouter>,
    { user: null },
  )
}

async function fillLogin(username: string, password: string) {
  const actor = userEvent.setup()
  await actor.type(screen.getByLabelText(/^Username/), username)
  await actor.type(screen.getByLabelText(/^Password/), password)
  await actor.click(screen.getByRole('button', { name: 'Sign in' }))
}

describe('SignInPage', () => {
  beforeEach(() => resetDb())

  it('signs a staff user in to the dashboard with a username and password', async () => {
    renderSignIn()
    await fillLogin('alice', 'alice123')

    expect(
      await screen.findByRole('heading', { name: 'Dashboard' }, { timeout: 5000 }),
    ).toBeInTheDocument()
  })

  it('signs an admin in to the admin area', async () => {
    renderSignIn()
    await fillLogin('owner', 'admin123')

    expect(
      await screen.findByRole('heading', { name: 'Admin Dashboard' }, { timeout: 5000 }),
    ).toBeInTheDocument()
  })

  it('rejects incorrect credentials with a plain message', async () => {
    renderSignIn()
    await fillLogin('alice', 'wrong-password')

    expect(await screen.findByText('Incorrect username or password.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('rejects a disabled account', async () => {
    const staff = (await listUsers({})).find((item) => item.username === 'alice')
    if (!staff) {
      throw new Error('Seed staff account is missing.')
    }
    await updateUser(staff.id, { active: false })

    renderSignIn()
    await fillLogin('alice', 'alice123')

    expect(
      await screen.findByText('This account is disabled. Contact the admin.'),
    ).toBeInTheDocument()
  })

  it('renders the brand inside a main landmark', async () => {
    renderSignIn()

    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'ZAF ONE' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Sign in' })).toBeInTheDocument()
  })
})
