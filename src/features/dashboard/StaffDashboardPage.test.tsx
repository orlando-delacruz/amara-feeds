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
    expect(screen.getByText('₱2,395.00')).toBeInTheDocument()
    expect(screen.getByText(/Outstanding credit/)).toBeInTheDocument()
  })
})
