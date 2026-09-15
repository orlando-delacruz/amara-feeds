import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '@/app/router'
import { resetDb } from '@/services/mocks/db'
import { renderWithProviders } from '@/test/render'
import type { User } from '@/domain'
import type { StoreId } from '@/store/stores'

const adminUser: User = {
  id: 'user-3',
  name: 'Owner (admin)',
  role: 'admin',
  username: 'owner',
  active: true,
}

function renderAdminAt(path: string, store?: StoreId) {
  renderWithProviders(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
    { user: adminUser, store },
  )
}

function brandPillBackground(): string {
  return getComputedStyle(screen.getByRole('link', { name: /ZAF ONE/ })).backgroundColor
}

describe('admin area theme', () => {
  beforeEach(() => resetDb())

  it('keeps the navy shell when the store filter switches', async () => {
    const actor = userEvent.setup()
    renderAdminAt('/admin/sales', 'amara')

    expect(await screen.findByRole('heading', { name: 'Sales' })).toBeInTheDocument()
    expect(brandPillBackground()).toBe('rgb(1, 60, 104)')

    await actor.click(screen.getByRole('radio', { name: 'Zeann' }))

    // Data context follows the filter…
    expect(screen.getByLabelText('Current store: Zeann')).toBeInTheDocument()
    // …but the paint does not.
    expect(brandPillBackground()).toBe('rgb(1, 60, 104)')
  })

  it('shows both store logos in the admin header', async () => {
    renderAdminAt('/admin/sales', 'zeann')

    expect(await screen.findByRole('heading', { name: 'Sales' })).toBeInTheDocument()
    expect(screen.getByAltText('Amara logo')).toBeInTheDocument()
    expect(screen.getByAltText('Zeann logo')).toBeInTheDocument()
  })
})
