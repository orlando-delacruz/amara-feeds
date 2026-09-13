import { screen } from '@testing-library/react'
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

  it('shows only the current store stock', async () => {
    renderWithProviders(<InventoryPage />, { user: staffUser })
    expect(await screen.findByText('Rice 25kg')).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
    expect(screen.queryByText('12')).not.toBeInTheDocument()
  })
})
