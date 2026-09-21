import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '@/app/router'
import { renderWithProviders } from './render'
import type { User } from '@/domain'

const staffUser: User = {
  id: 'user-1',
  name: 'Alice (Amara staff)',
  role: 'staff',
  storeId: 'amara',
  username: 'alice',
  active: true,
}

const adminUser: User = {
  id: 'user-3',
  name: 'Owner (admin)',
  role: 'admin',
  username: 'owner',
  active: true,
}

function renderAt(path: string, user: User | null = staffUser) {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
    { user },
  )
}

describe('application shell', () => {
  it('sends unauthenticated users to sign-in', async () => {
    renderAt('/dashboard', null)
    expect(await screen.findByRole('heading', { level: 1, name: 'ZAF ONE' })).toBeInTheDocument()
  })

  it('redirects the root path to the staff dashboard', () => {
    renderAt('/')
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  })

  it('renders a staff area with visible store context', () => {
    renderAt('/sales')
    expect(screen.getByRole('heading', { name: 'Sales' })).toBeInTheDocument()
    expect(screen.getByLabelText('Current store: Amara')).toBeInTheDocument()
  })

  it('does not offer store switching to staff', () => {
    renderAt('/sales')
    expect(screen.queryByLabelText('Store')).not.toBeInTheDocument()
  })

  it('lets an admin set the store context from the More page', async () => {
    const user = userEvent.setup()
    renderAt('/admin/more', adminUser)
    expect(await screen.findByText('Store context')).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'Zeann' }))
    expect(screen.getByRole('radio', { name: 'Zeann' })).toHaveAttribute('aria-checked', 'true')
  })

  it('redirects a staff user away from admin routes', () => {
    renderAt('/admin')
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  })

  it('renders a recoverable page for unknown staff routes', () => {
    renderAt('/no-such-area')
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Back to dashboard' })).toBeInTheDocument()
  })
})
