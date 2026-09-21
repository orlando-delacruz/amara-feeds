import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { getDb, resetDb } from '@/services/mocks/db'
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
    renderWithProviders(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>,
      { user: adminUser },
    )
    expect(await screen.findByText('Overall daily sales')).toBeInTheDocument()
    expect(screen.getByText('₱2,590.00')).toBeInTheDocument()
    expect(screen.getAllByText('Amara').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Zeann').length).toBeGreaterThan(0)
    expect(screen.queryByText('Overall weekly sales')).not.toBeInTheDocument()
    expect(screen.queryByText('Overall monthly sales')).not.toBeInTheDocument()
  })

  it('switches between Today, Weekly, and Monthly sales tabs', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>,
      { user: adminUser },
    )
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

  it('caps stock lists at five rows with View all shortcuts (DEC-046)', async () => {
    // Inflate both lists past the five-row preview limit.
    const db = getDb()
    for (let i = 0; i < 7; i++) {
      db.stock.push({ storeId: 'amara', productId: `prod-x${i}`, quantity: 9 })
      db.receiving.push({
        id: `recv-x${i}`,
        storeId: 'amara',
        productId: `prod-x${i}`,
        quantity: 3,
        supplier: 'Bulk Co',
        costPriceMinor: 1000,
        sellingPriceMinor: 1200,
        recordedByUserId: 'user-1',
        receivedAt: new Date().toISOString(),
      })
    }

    renderWithProviders(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>,
      { user: adminUser },
    )
    await screen.findByText('Overall daily sales')

    const currentSection = screen
      .getByRole('heading', { name: 'Current stock' })
      .closest('section') as HTMLElement
    // jsdom renders the wide DataTable: a header row plus the five preview rows.
    expect(within(currentSection).getAllByRole('row')).toHaveLength(6)
    expect(within(currentSection).getByRole('button', { name: 'View all' })).toBeInTheDocument()

    const receivedSection = screen
      .getByRole('heading', { name: 'Received stock' })
      .closest('section') as HTMLElement
    expect(within(receivedSection).getAllByRole('row')).toHaveLength(6)
    expect(within(receivedSection).getByRole('button', { name: 'View all' })).toBeInTheDocument()
  })
})
