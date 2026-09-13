import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { resetDb } from '@/services/mocks/db'
import { renderWithProviders } from '@/test/render'
import type { User } from '@/domain'
import { ProductListPage } from './ProductListPage'

const staffUser: User = {
  id: 'user-1',
  name: 'Alice',
  role: 'staff',
  storeId: 'amara',
  username: 'alice',
  active: true,
}

describe('ProductListPage', () => {
  beforeEach(() => resetDb())

  it('lists products with their approval status', async () => {
    renderWithProviders(<ProductListPage />, { user: staffUser })
    expect(await screen.findByText('Cooking Oil 1L')).toBeInTheDocument()
    expect(screen.getByText('Pending approval')).toBeInTheDocument()
  })

  it('submits a new product that stays pending', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ProductListPage />, { user: staffUser })
    await screen.findByText('Cooking Oil 1L')

    await user.click(screen.getByRole('button', { name: 'Add product' }))
    const dialog = await screen.findByRole('dialog', { name: 'Add product' })
    await user.type(within(dialog).getByLabelText(/^Product name/), 'Biscuits')
    await user.click(within(dialog).getByRole('button', { name: 'Submit product' }))

    expect(await screen.findByText('Biscuits')).toBeInTheDocument()
    expect(await screen.findByText('Product submitted for admin approval.')).toBeInTheDocument()
  })
})
