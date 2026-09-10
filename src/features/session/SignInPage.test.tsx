import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '@/app/router'
import { renderWithProviders } from '@/test/render'

describe('SignInPage', () => {
  it('lists seeded accounts and signs a staff user in to the dashboard', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <MemoryRouter initialEntries={['/sign-in']}>
        <AppRoutes />
      </MemoryRouter>,
      { user: null },
    )

    const staffButton = await screen.findByRole('button', { name: /Alice/ })
    await user.click(staffButton)

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  })

  it('signs an admin in to the admin area', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <MemoryRouter initialEntries={['/sign-in']}>
        <AppRoutes />
      </MemoryRouter>,
      { user: null },
    )

    const adminButton = await screen.findByRole('button', { name: /Owner/ })
    await user.click(adminButton)

    expect(await screen.findByRole('heading', { name: 'Admin Dashboard' })).toBeInTheDocument()
  })
})
