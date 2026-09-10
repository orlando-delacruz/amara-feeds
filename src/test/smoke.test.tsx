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
}

const adminUser: User = { id: 'user-3', name: 'Owner (admin)', role: 'admin' }

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
    expect(await screen.findByText('Mock sign-in')).toBeInTheDocument()
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

  it('lets an admin switch the store context', async () => {
    const user = userEvent.setup()
    renderAt('/admin', adminUser)
    await user.selectOptions(screen.getByLabelText('Store'), 'zeann')
    expect(screen.getByLabelText('Current store: Zeann')).toBeInTheDocument()
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
