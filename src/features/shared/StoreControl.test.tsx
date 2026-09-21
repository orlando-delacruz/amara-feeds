import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StoreControl } from './StoreControl'
import { renderWithProviders } from '@/test/render'
import type { User } from '@/domain'

const staffUser: User = {
  id: 'user-1',
  name: 'Alice (Amara staff)',
  role: 'staff',
  storeId: 'amara',
  username: 'alice',
  active: true,
}
const adminUser: User = {
  id: 'user-3',
  name: 'Owner (admin)',
  role: 'admin',
  username: 'owner',
  active: true,
}

describe('StoreControl', () => {
  it('renders nothing for staff (store locked to assignment)', () => {
    renderWithProviders(<StoreControl />, { user: staffUser })
    expect(screen.queryByRole('radiogroup', { name: 'Store' })).not.toBeInTheDocument()
  })

  it('lets an admin switch the store context (no All stores option, DEC-048)', async () => {
    const actor = userEvent.setup()
    renderWithProviders(<StoreControl />, { user: adminUser })
    expect(screen.getByRole('radiogroup', { name: 'Store' })).toBeInTheDocument()
    // Zeann is the default store context; the combined option is gone.
    expect(screen.queryByRole('radio', { name: 'All stores' })).not.toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Zeann' })).toHaveAttribute('aria-checked', 'true')
    await actor.click(screen.getByRole('radio', { name: 'Amara' }))
    expect(screen.getByRole('radio', { name: 'Amara' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Zeann' })).toHaveAttribute('aria-checked', 'false')
  })
})
