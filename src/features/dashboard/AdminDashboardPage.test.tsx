import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { resetDb } from '@/services/mocks/db'
import { renderWithProviders } from '@/test/render'
import type { User } from '@/domain'
import { AdminDashboardPage } from './AdminDashboardPage'

const adminUser: User = {
  id: 'user-3',
  name: 'Owner',
  role: 'admin',
  username: 'owner',
  active: true,
}

describe('AdminDashboardPage', () => {
  beforeEach(() => resetDb())

  it('shows today sales by default across both stores', async () => {
    renderWithProviders(<AdminDashboardPage />, { user: adminUser })
    expect(await screen.findByText('Overall daily sales')).toBeInTheDocument()
    expect(screen.getByText('₱2,590.00')).toBeInTheDocument()
    expect(screen.getAllByText('Amara').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Zeann').length).toBeGreaterThan(0)
    expect(screen.queryByText('Overall weekly sales')).not.toBeInTheDocument()
    expect(screen.queryByText('Overall monthly sales')).not.toBeInTheDocument()
  })

  it('switches between Today, Weekly, and Monthly sales tabs', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminDashboardPage />, { user: adminUser })
    await screen.findByText('Overall daily sales')

    await user.click(screen.getByRole('radio', { name: 'Weekly' }))
    expect(await screen.findByText('Overall weekly sales')).toBeInTheDocument()
    expect(screen.getAllByText(/last 7 days/).length).toBeGreaterThan(0)
    // Weekly overall includes yesterday's Zeann sale (today 259000 + yesterday 120000).
    expect(screen.getAllByText('₱3,790.00').length).toBeGreaterThan(0)

    await user.click(screen.getByRole('radio', { name: 'Monthly' }))
    expect(await screen.findByText('Overall monthly sales')).toBeInTheDocument()
    expect(screen.getAllByText(/this month/).length).toBeGreaterThan(0)

    await user.click(screen.getByRole('radio', { name: 'Today' }))
    expect(await screen.findByText('Overall daily sales')).toBeInTheDocument()
  })
})
