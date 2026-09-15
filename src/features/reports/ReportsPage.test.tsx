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

  it('shows the agreed summaries for the selected range', async () => {
    renderReports()

    expect((await screen.findAllByText(/Sales by store/)).length).toBeGreaterThan(0)
    expect(screen.getByText(/Overall sales/)).toBeInTheDocument()
    expect(screen.getByText(/Outstanding credit/)).toBeInTheDocument()
    expect(screen.getByText(/Payments/)).toBeInTheDocument()
    expect(screen.getAllByText('Sales by mode of payment').length).toBeGreaterThan(0)
    expect(screen.getByText('Cash')).toBeInTheDocument()
    expect(screen.getAllByText(/Current stock/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Received stock/).length).toBeGreaterThan(0)
  })

  it('offers From and To date pickers for the report range', async () => {
    renderReports()
    await screen.findAllByText(/Sales by store/)

    expect(screen.getByRole('button', { name: 'From' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'To' })).toBeInTheDocument()
  })

  it('provides an Export Excel action', async () => {
    renderReports()
    await screen.findAllByText(/Sales by store/)
    expect(screen.getByRole('button', { name: 'Export Excel' })).toBeInTheDocument()
  })

  it('redirects staff away from admin reports', async () => {
    renderReports('/admin/reports', staffUser)
    expect(
      await screen.findByRole('heading', { name: 'Dashboard' }, { timeout: 5000 }),
    ).toBeInTheDocument()
  })
})
