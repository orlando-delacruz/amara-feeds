import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '@/app/router'
import { resetDb } from '@/services/mocks/db'
import { renderWithProviders } from '@/test/render'
import type { User } from '@/domain'

const adminUser: User = {
  id: 'user-3',
  name: 'Owner',
  role: 'admin',
  username: 'owner',
  active: true,
}
const staffUser: User = {
  id: 'user-1',
  name: 'Alice',
  role: 'staff',
  storeId: 'amara',
  username: 'alice',
  active: true,
}

function renderReports(path = '/admin/reports', user: User = adminUser) {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
    { user },
  )
}

describe('ReportsPage', () => {
  beforeEach(() => resetDb())

  it('shows the agreed summaries for the selected date', async () => {
    renderReports()

    expect((await screen.findAllByText(/Daily sales by store/)).length).toBeGreaterThan(0)
    expect(screen.getByText(/Overall daily sales/)).toBeInTheDocument()
    expect(screen.getByText(/Outstanding credit/)).toBeInTheDocument()
    expect(screen.getByText(/Payments/)).toBeInTheDocument()
    expect(screen.getAllByText(/Current stock/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Received stock/).length).toBeGreaterThan(0)
  })

  it('provides a print action', async () => {
    renderReports()
    await screen.findAllByText(/Daily sales by store/)
    expect(screen.getByRole('button', { name: 'Print' })).toBeInTheDocument()
  })

  it('scopes staff reports to the assigned store only', async () => {
    renderReports('/reports', staffUser)
    await screen.findAllByText(/Daily sales by store/)

    expect(screen.getAllByText('Amara').length).toBeGreaterThan(0)
    expect(screen.queryByText('Zeann')).not.toBeInTheDocument()
  })
})
