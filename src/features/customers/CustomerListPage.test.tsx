import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { resetDb } from '@/services/mocks/db'
import { renderWithProviders } from '@/test/render'
import type { User } from '@/domain'
import { CustomerListPage } from './CustomerListPage'

const staffUser: User = {
  id: 'user-1',
  name: 'Alice',
  role: 'staff',
  storeId: 'amara',
  username: 'alice',
  active: true,
}

describe('CustomerListPage', () => {
  beforeEach(() => resetDb())

  it('lists shared customers', async () => {
    renderWithProviders(<CustomerListPage />, { user: staffUser })
    expect(await screen.findByText('Maria Santos')).toBeInTheDocument()
    expect(screen.getByText('123 Mabini Street, Barangay Poblacion')).toBeInTheDocument()
  })

  it('filters customers by search term', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CustomerListPage />, { user: staffUser })
    await screen.findByText('Maria Santos')

    await user.type(screen.getByLabelText('Search customers'), 'Ana')

    expect(await screen.findByText('Ana Reyes')).toBeInTheDocument()
    expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument()
  })

  it('adds a shared customer', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CustomerListPage />, { user: staffUser })
    await screen.findByText('Maria Santos')

    await user.click(screen.getByRole('button', { name: 'Add customer' }))
    const dialog = await screen.findByRole('dialog', { name: 'Add customer' })
    await user.type(within(dialog).getByLabelText(/^Name/), 'Pedro Penduko')
    await user.click(within(dialog).getByRole('button', { name: 'Add customer' }))

    expect(await screen.findByText('Pedro Penduko')).toBeInTheDocument()
    expect(await screen.findByText('Customer added.')).toBeInTheDocument()
  })

  it('captures an address when adding a customer', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CustomerListPage />, { user: staffUser })
    await screen.findByText('Maria Santos')

    await user.click(screen.getByRole('button', { name: 'Add customer' }))
    const dialog = await screen.findByRole('dialog', { name: 'Add customer' })
    await user.type(within(dialog).getByLabelText(/^Name/), 'Pedro Penduko')
    await user.type(within(dialog).getByLabelText(/^Address/), '123 Mabini St.')
    await user.click(within(dialog).getByRole('button', { name: 'Add customer' }))

    expect(await screen.findByText('Pedro Penduko')).toBeInTheDocument()
    expect(screen.getByText('123 Mabini St.')).toBeInTheDocument()
  })

  it('hides the add action for read-only review', async () => {
    renderWithProviders(<CustomerListPage canAdd={false} />, { user: staffUser })
    await screen.findByText('Maria Santos')
    expect(screen.queryByRole('button', { name: 'Add customer' })).not.toBeInTheDocument()
  })
})
