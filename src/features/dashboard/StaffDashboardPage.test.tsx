import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { resetDb } from '@/services/mocks/db'
import { renderWithProviders } from '@/test/render'
import type { User } from '@/domain'
import { StaffDashboardPage } from './StaffDashboardPage'

const staffUser: User = {
  id: 'user-1',
  name: 'Alice',
  role: 'staff',
  storeId: 'amara',
  username: 'alice',
  active: true,
}

describe('StaffDashboardPage', () => {
  beforeEach(() => resetDb())

  it('shows today summary for the current store', async () => {
    renderWithProviders(<StaffDashboardPage />, { user: staffUser })
    expect(await screen.findByText("Today's sales")).toBeInTheDocument()
    expect(screen.getAllByText('₱2,395.00').length).toBeGreaterThan(0)
  })

  it('hides the outstanding credit card from staff (DEC-058)', async () => {
    renderWithProviders(<StaffDashboardPage />, { user: staffUser })
    await screen.findByText("Today's sales")

    expect(screen.queryByText(/Outstanding credit/)).not.toBeInTheDocument()
  })

  it('shows weekly sales for the current store', async () => {
    renderWithProviders(<StaffDashboardPage />, { user: staffUser })
    expect(await screen.findByRole('heading', { name: 'Weekly sales' })).toBeInTheDocument()
    expect(screen.getByText(/Sunday–Saturday/)).toBeInTheDocument()
  })

  it('splits today sales into cash, GCash, and bank buckets (DEC-059)', async () => {
    renderWithProviders(<StaffDashboardPage />, { user: staffUser })
    await screen.findByText("Today's sales")

    expect(await screen.findByText('Total Cash Sales')).toBeInTheDocument()
    expect(screen.getByText('GCash Paid')).toBeInTheDocument()
    expect(screen.getByText('Bank Payment')).toBeInTheDocument()
    // Amara cash sales today: sale-1 + sale-3.
    expect(screen.getAllByText('₱2,395.00').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('2 cash sales today')).toBeInTheDocument()
  })
})
