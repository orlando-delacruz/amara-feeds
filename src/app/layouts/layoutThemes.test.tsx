import { screen } from '@testing-library/react'
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

  it('paints the shell with the selected store: Zeann blue, Amara brown (DEC-044)', async () => {
    renderAdminAt('/admin/sales', 'zeann')
    expect(await screen.findByRole('heading', { name: 'Sales' })).toBeInTheDocument()
    expect(brandPillBackground()).toBe('rgb(1, 60, 104)')
  })

  it('wears the Amara brown paint when Amara is the store context', async () => {
    renderAdminAt('/admin/sales', 'amara')
    expect(await screen.findByRole('heading', { name: 'Sales' })).toBeInTheDocument()
    expect(brandPillBackground()).toBe('rgb(170, 136, 90)')
  })

  it('keeps the fixed navy combined paint for the all-stores context', async () => {
    renderAdminAt('/admin/sales')
    expect(await screen.findByRole('heading', { name: 'Sales' })).toBeInTheDocument()
    // Admin never renders a single-store badge in the header.
    expect(screen.queryByLabelText('Current store: Zeann')).not.toBeInTheDocument()
    expect(brandPillBackground()).toBe('rgb(1, 60, 104)')
  })

  it('shows both store logos in the admin header', async () => {
    renderAdminAt('/admin/sales', 'zeann')

    expect(await screen.findByRole('heading', { name: 'Sales' })).toBeInTheDocument()
    expect(screen.getByAltText('Amara logo')).toBeInTheDocument()
    expect(screen.getByAltText('Zeann logo')).toBeInTheDocument()
  })
})
