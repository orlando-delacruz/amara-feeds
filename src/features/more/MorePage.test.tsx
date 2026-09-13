import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '@/app/router'
import { renderWithProviders } from '@/test/render'
import type { User } from '@/domain'

const staffUser: User = {
  id: 'user-1',
  name: 'Alice',
  role: 'staff',
  storeId: 'amara',
  username: 'alice',
  active: true,
}
const adminUser: User = {
  id: 'user-3',
  name: 'Owner',
  role: 'admin',
  username: 'owner',
  active: true,
}

function renderMore(path: string, user: User) {
  renderWithProviders(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
    { user },
  )
}

describe('MorePage', () => {
  it('lists overflow destinations for staff with descriptions', async () => {
    renderMore('/more', staffUser)
    expect(await screen.findByRole('heading', { name: 'More' })).toBeInTheDocument()
    const moreNav = screen.getByRole('navigation', { name: 'More destinations' })
    expect(within(moreNav).getByRole('link', { name: /Inventory/ })).toHaveAttribute(
      'href',
      '/inventory',
    )
    expect(within(moreNav).getByText('Record incoming stock')).toBeInTheDocument()
    expect(within(moreNav).queryByRole('link', { name: /Users/ })).not.toBeInTheDocument()
    expect(within(moreNav).queryByRole('link', { name: /^Dashboard$/ })).not.toBeInTheDocument()
  })

  it('lists the Users destination for admins', async () => {
    renderMore('/admin/more', adminUser)
    expect(await screen.findByRole('heading', { name: 'More' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Users/ })).toHaveAttribute('href', '/admin/users')
  })

  it('exposes More as a tab-bar link', async () => {
    renderMore('/dashboard', staffUser)
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /More/ })).toHaveAttribute('href', '/more')
  })

  it('signs out from the More page and returns to sign-in', async () => {
    renderMore('/more', staffUser)
    expect(await screen.findByRole('heading', { name: 'More' })).toBeInTheDocument()
    // Scoped to main: the header keeps its own (CSS-hidden on phones) Sign out button.
    const main = screen.getByRole('main')
    await userEvent.setup().click(within(main).getByRole('button', { name: 'Sign out' }))
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
  })
})
