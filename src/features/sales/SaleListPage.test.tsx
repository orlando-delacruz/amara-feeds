import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '@/app/router'
import { resetDb } from '@/services/mocks/db'
import { renderWithProviders } from '@/test/render'
import type { User } from '@/domain'

const staffUser: User = { id: 'user-1', name: 'Alice', role: 'staff', storeId: 'amara' }

function renderAt(path: string) {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
    { user: staffUser },
  )
}

describe('SaleListPage', () => {
  beforeEach(() => resetDb())

  it('lists today sales for the current store', async () => {
    renderAt('/sales')
    expect(await screen.findByText('Maria Santos')).toBeInTheDocument()
    expect(screen.getAllByText('Cash').length).toBeGreaterThan(0)
  })

  it('shows an empty state for a date with no sales', async () => {
    const user = userEvent.setup()
    renderAt('/sales')
    await screen.findByText('Maria Santos')

    const dateInput = screen.getByLabelText('Date')
    await user.clear(dateInput)
    await user.type(dateInput, '2000-01-01')

    expect(await screen.findByText('No sales on this date')).toBeInTheDocument()
  })
})
