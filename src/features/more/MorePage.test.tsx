import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '@/app/router'
import { renderWithProviders } from '@/test/render'
import type { User } from '@/domain'

const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36'
const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

function setUserAgent(ua: string) {
  Object.defineProperty(window.navigator, 'userAgent', { value: ua, configurable: true })
}

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

  it('gives admins the store-context switch on the More page', async () => {
    const user = userEvent.setup()
    renderMore('/admin/more', adminUser)
    expect(await screen.findByText('Store context')).toBeInTheDocument()

    // Switching here is the one place store context is set for admin pages.
    await user.click(screen.getByRole('radio', { name: 'Zeann' }))
    expect(screen.getByRole('radio', { name: 'Zeann' })).toHaveAttribute('aria-checked', 'true')
  })

  it('does not render the store-context switch for staff', async () => {
    renderMore('/more', staffUser)
    expect(await screen.findByRole('heading', { name: 'More' })).toBeInTheDocument()
    expect(screen.queryByText('Store context')).not.toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: 'Zeann' })).not.toBeInTheDocument()
  })

  it('exposes More as a tab-bar link', async () => {
    renderMore('/dashboard', staffUser)
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /More/ })).toHaveAttribute('href', '/more')
  })

  it('offers the install tutorial on a mobile browser via a Get-the-app entry', async () => {
    setUserAgent(ANDROID_UA)
    try {
      const user = userEvent.setup()
      renderMore('/more', staffUser)
      expect(await screen.findByText('Install ZAF ONE')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /Install ZAF ONE/ }))
      expect(await screen.findByRole('dialog', { name: 'Install ZAF ONE' })).toBeInTheDocument()
      expect(screen.getByText('On Android (Chrome)')).toBeInTheDocument()
    } finally {
      setUserAgent(DESKTOP_UA)
    }
  })

  it('hides the install entry on desktop', async () => {
    renderMore('/more', staffUser)
    expect(await screen.findByRole('heading', { name: 'More' })).toBeInTheDocument()
    expect(screen.queryByText('Install ZAF ONE')).not.toBeInTheDocument()
  })

  it('signs out from the More page and returns to sign-in', async () => {
    renderMore('/more', staffUser)
    expect(await screen.findByRole('heading', { name: 'More' })).toBeInTheDocument()
    // Scoped to main: the header keeps its own (CSS-hidden on phones) Sign out button.
    const main = screen.getByRole('main')
    await userEvent.setup().click(within(main).getByRole('button', { name: 'Sign out' }))
    // The sign-out path awaits the confirm popup, then signs out and navigates.
    expect(
      await screen.findByRole('heading', { name: 'Sign in' }, { timeout: 3000 }),
    ).toBeInTheDocument()
  })
})
