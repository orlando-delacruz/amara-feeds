import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { resetDb } from '@/services/mocks/db'
import { __awaitSwal } from '@/test/swalMock'
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

const adminUser: User = {
  id: 'user-3',
  name: 'Owner',
  role: 'admin',
  username: 'owner',
  active: true,
}

describe('InventoryPage', () => {
  beforeEach(() => resetDb())

  it('shows correction actions to admins only (DEC-050)', async () => {
    renderWithProviders(<InventoryPage />, { user: staffUser })

    const row = (await screen.findByText('Rice 25kg')).closest('tr') as HTMLElement
    expect(within(row).getByText('Admin-managed')).toBeInTheDocument()
    expect(within(row).queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
    expect(within(row).queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
    expect(within(row).queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
  })

  it('keeps correction actions available to admins (DEC-050)', async () => {
    renderWithProviders(<InventoryPage />, { user: adminUser, store: 'amara' })
    const row = (await screen.findByText('Rice 25kg')).closest('tr') as HTMLElement
    expect(within(row).getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    expect(within(row).getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('lets an admin edit a stock quantity to a new absolute value', async () => {
    const user = userEvent.setup()
    renderWithProviders(<InventoryPage />, { user: adminUser, store: 'amara' })
    const row = (await screen.findByText('Rice 25kg')).closest('tr') as HTMLElement

    await user.click(within(row).getByRole('button', { name: 'Edit' }))
    const dialog = await screen.findByRole('dialog', { name: 'Edit stock' })
    const input = within(dialog).getByLabelText(/Quantity on hand/)
    expect(input).toHaveValue(20)

    await user.clear(input)
    await user.type(input, '9')
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))

    await __awaitSwal('Stock adjusted from 20 to 9.')
    expect(await screen.findByText('Rice 25kg')).toBeInTheDocument()
  })

  it('refuses an admin delete of a product with sales at the store', async () => {
    const user = userEvent.setup()
    renderWithProviders(<InventoryPage />, { user: adminUser, store: 'amara' })
    const row = (await screen.findByText('Rice 25kg')).closest('tr') as HTMLElement
    await user.click(within(row).getByRole('button', { name: 'Delete' }))

    const refused = await __awaitSwal('Could not delete the stock.')
    expect(String(refused?.text)).toMatch(/has sales at this store/)
  })

  it('lets an admin delete a stock row without sales', async () => {
    const user = userEvent.setup()
    renderWithProviders(<InventoryPage />, { user: adminUser, store: 'amara' })
    const row = (await screen.findByText('Sugar 1kg')).closest('tr') as HTMLElement

    await user.click(within(row).getByRole('button', { name: 'Delete' }))

    await __awaitSwal('Stock for "Sugar 1kg" deleted.')
  })

  it('lets an admin approve a stock row (bookkeeping indicator)', async () => {
    const user = userEvent.setup()
    renderWithProviders(<InventoryPage />, { user: adminUser, store: 'amara' })
    const row = (await screen.findByText('Rice 25kg')).closest('tr') as HTMLElement

    await user.click(within(row).getByRole('button', { name: 'Approve' }))

    // The confirm copy describes approval as the admin-verification marker.
    await __awaitSwal(/Mark inventory as approved\?/)
    await __awaitSwal('Inventory for "Rice 25kg" approved.')
    const approvedRow = (await screen.findByText('Rice 25kg')).closest('tr') as HTMLElement
    expect(within(approvedRow).getByText('Approved')).toBeInTheDocument()
    expect(within(approvedRow).getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    expect(within(approvedRow).queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
  })
})
