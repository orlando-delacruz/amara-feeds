import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { resetDb } from '@/services/mocks/db'
import { renderWithProviders } from '@/test/render'
import { __awaitSwal } from '@/test/swalMock'
import type { User } from '@/domain'
import { ExpensesPage } from './ExpensesPage'

const staffUser: User = {
  id: 'user-1',
  name: 'Alice',
  role: 'staff',
  storeId: 'amara',
  username: 'alice',
  active: true,
}

describe('ExpensesPage', () => {
  beforeEach(() => resetDb())

  it('shows the net summary with seeded data', async () => {
    renderWithProviders(<ExpensesPage />, { user: staffUser })
    expect(await screen.findByText('Riders net')).toBeInTheDocument()
    expect(screen.getAllByText('Jojo Ramos').length).toBeGreaterThanOrEqual(1)
  })

  it('records an expense for a rider', async () => {
    const user = userEvent.setup()
    const { container } = renderWithProviders(<ExpensesPage />, { user: staffUser })
    await screen.findByText('Riders net')

    await user.selectOptions(screen.getByLabelText(/Assign to/), 'rider')
    const targetSelect = container.querySelector('#expense-target') as HTMLSelectElement
    await user.selectOptions(targetSelect, 'rider-2')
    await user.selectOptions(screen.getByLabelText(/Expense type/), 'fuel')
    await user.type(screen.getByLabelText(/Amount/), '750')
    await user.click(screen.getByRole('button', { name: 'Record expense' }))

    await __awaitSwal('Expense recorded.')
  })

  it('shows expense history from seeded data', async () => {
    renderWithProviders(<ExpensesPage />, { user: staffUser })
    expect(await screen.findByText('Expense history — Amara')).toBeInTheDocument()
    expect(screen.getByText('Weekly fuel for Amara deliveries')).toBeInTheDocument()
  })

  it('shows the recorded expenses summarized by date (DEC-054)', async () => {
    renderWithProviders(<ExpensesPage />, { user: staffUser })
    await screen.findByText('Riders net')

    expect(await screen.findByText('Summary by date')).toBeInTheDocument()
    expect(screen.getByText('Recorded expenses summarized by date')).toBeInTheDocument()
  })

  it('offers no import action — the summary exports from Reports (DEC-054)', async () => {
    renderWithProviders(<ExpensesPage />, { user: staffUser })
    await screen.findByText('Riders net')

    expect(screen.queryByRole('button', { name: 'Import Excel' })).not.toBeInTheDocument()
  })
})
