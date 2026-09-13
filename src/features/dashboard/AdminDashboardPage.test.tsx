import { screen } from '@testing-library/react'
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

  it('shows business-wide summaries for both stores', async () => {
    renderWithProviders(<AdminDashboardPage />, { user: adminUser })
    expect(await screen.findByText('Overall daily sales')).toBeInTheDocument()
    expect(screen.getByText('₱2,590.00')).toBeInTheDocument()
    expect(screen.getAllByText('Amara').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Zeann').length).toBeGreaterThan(0)
  })
})
