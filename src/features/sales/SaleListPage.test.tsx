import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '@/app/router'
import { resetDb } from '@/services/mocks/db'
import { renderWithProviders } from '@/test/render'
import type { StoreContextId } from '@/store/stores'
import type { User } from '@/domain'

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

function renderAt(path: string, user: User = staffUser, initialStore?: StoreContextId) {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
    { user, store: initialStore },
  )
}

describe('SaleListPage', () => {
  beforeEach(() => resetDb())

  it('lists today sales for the current store', async () => {
    renderAt('/sales')
    expect(await screen.findByText('Maria Santos')).toBeInTheDocument()
    expect(screen.getAllByText('Cash').length).toBeGreaterThan(0)
  })

  it('shows who recorded each sale', async () => {
    renderAt('/sales')
    await screen.findByText('Maria Santos')
    expect(screen.getByText('Recorded by')).toBeInTheDocument()
    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0)
  })

  it('shows an empty state for a date with no sales', async () => {
    const user = userEvent.setup()
    renderAt('/sales', undefined, 'amara')
    await screen.findByText('Maria Santos')

    const dateInput = screen.getByLabelText('Date')
    await user.clear(dateInput)
    await user.type(dateInput, '2000-01-01')

    expect(await screen.findByText('No sales on this date')).toBeInTheDocument()
  })

  it('lets an admin open the new-sale form instead of landing on the dashboard', async () => {
    const user = userEvent.setup()
    renderAt('/admin/sales', adminUser)
    await screen.findByRole('heading', { name: 'Sales' })
    await user.click(screen.getByRole('button', { name: 'New sale' }))
    expect(await screen.findByRole('heading', { name: 'New sale' })).toBeInTheDocument()
  })
})
