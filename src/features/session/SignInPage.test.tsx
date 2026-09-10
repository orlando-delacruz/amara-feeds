import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '@/app/router'
import { renderWithProviders } from '@/test/render'

function renderSignIn() {
  renderWithProviders(
    <MemoryRouter initialEntries={['/sign-in']}>
      <AppRoutes />
    </MemoryRouter>,
    { user: null },
  )
}

describe('SignInPage', () => {
  it('lists seeded accounts and signs a staff user in to the dashboard', async () => {
    const user = userEvent.setup()
    renderSignIn()

    const staffButton = await screen.findByRole('button', { name: /Alice/ })
    await user.click(staffButton)

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  })

  it('signs an admin in to the admin area', async () => {
    const user = userEvent.setup()
    renderSignIn()

    const adminButton = await screen.findByRole('button', { name: /Owner/ })
    await user.click(adminButton)

    expect(await screen.findByRole('heading', { name: 'Admin Dashboard' })).toBeInTheDocument()
  })

  it('renders the brand inside a main landmark', async () => {
    renderSignIn()

    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Amara Feeds' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Choose your account' }),
    ).toBeInTheDocument()
  })

  it('shows each account with its store or admin context', async () => {
    renderSignIn()

    const staffButton = await screen.findByRole('button', { name: /Alice/ })
    expect(within(staffButton).getByText('Amara')).toBeInTheDocument()
    expect(within(staffButton).getByText('Staff')).toBeInTheDocument()

    const adminButton = await screen.findByRole('button', { name: /Owner/ })
    expect(within(adminButton).getByText('Admin')).toBeInTheDocument()
    expect(within(adminButton).getByText('Both stores')).toBeInTheDocument()
  })
})
