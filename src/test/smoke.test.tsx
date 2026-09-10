import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '@/app/router'
import { renderWithProviders } from './render'

function renderAt(path: string) {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  )
}

describe('application shell', () => {
  it('redirects the root path to the dashboard', () => {
    renderAt('/')
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  })

  it('renders a staff area with visible store context', () => {
    renderAt('/sales')
    expect(screen.getByRole('heading', { name: 'Sales' })).toBeInTheDocument()
    expect(screen.getByLabelText('Current store: Amara')).toBeInTheDocument()
  })

  it('switches the visible store context', async () => {
    const user = userEvent.setup()
    renderAt('/sales')
    await user.selectOptions(screen.getByLabelText('Store'), 'zeann')
    expect(screen.getByLabelText('Current store: Zeann')).toBeInTheDocument()
  })

  it('renders the admin shell', () => {
    renderAt('/admin')
    expect(screen.getByRole('heading', { name: 'Admin Dashboard' })).toBeInTheDocument()
    expect(screen.getByText('Admin', { selector: 'span' })).toBeInTheDocument()
  })

  it('renders a recoverable page for unknown routes', () => {
    renderAt('/no-such-area')
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Back to dashboard' })).toBeInTheDocument()
  })
})
