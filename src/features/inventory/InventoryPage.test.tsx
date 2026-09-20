import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { resetDb } from '@/services/mocks/db'
import { renderWithProviders } from '@/test/render'
import type { User } from '@/domain'
import { InventoryPage } from './InventoryPage'

const staffUser: User = {
  id: 'user-1',
  name: 'Alice',
  role: 'staff',
  storeId: 'amara',
  username: 'alice',
  active: true,
}

describe('InventoryPage', () => {
  beforeEach(() => resetDb())

  it('lists stock rows with edit and delete actions', async () => {
    renderWithProviders(<InventoryPage />, { user: staffUser })

    const row = (await screen.findByText('Rice 25kg')).closest('tr') as HTMLElement
    expect(within(row).getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    expect(within(row).getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('edits a stock quantity to a new absolute value', async () => {
    const user = userEvent.setup()
    renderWithProviders(<InventoryPage />, { user: staffUser })
    const row = (await screen.findByText('Rice 25kg')).closest('tr') as HTMLElement

    await user.click(within(row).getByRole('button', { name: 'Edit' }))
    const dialog = await screen.findByRole('dialog', { name: 'Edit stock' })
    const input = within(dialog).getByLabelText(/Quantity on hand/)
    expect(input).toHaveValue(20)

    await user.clear(input)
    await user.type(input, '9')
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('Stock adjusted from 20 to 9.')).toBeInTheDocument()
    expect(await screen.findByText('Rice 25kg')).toBeInTheDocument()
  })

  it('refuses to delete a product with sales at the store', async () => {
    const user = userEvent.setup()
    renderWithProviders(<InventoryPage />, { user: staffUser })
    const row = (await screen.findByText('Rice 25kg')).closest('tr') as HTMLElement
    await user.click(within(row).getByRole('button', { name: 'Delete' }))
    const dialog = await screen.findByRole('dialog', { name: 'Delete stock' })
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

    expect(
      await screen.findByText(
        'This item already has sales at this store. Set the quantity to 0 instead.',
      ),
    ).toBeInTheDocument()
  })

  it('deletes a stock row without sales', async () => {
    const user = userEvent.setup()
    renderWithProviders(<InventoryPage />, { user: staffUser })
    const row = (await screen.findByText('Sugar 1kg')).closest('tr') as HTMLElement

    await user.click(within(row).getByRole('button', { name: 'Delete' }))
    const dialog = await screen.findByRole('dialog', { name: 'Delete stock' })
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

    expect(await screen.findByText('Stock for "Sugar 1kg" deleted.')).toBeInTheDocument()
  })
})
