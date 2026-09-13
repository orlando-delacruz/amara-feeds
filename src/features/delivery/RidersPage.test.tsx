import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '@/app/router'
import { resetDb } from '@/services/mocks/db'
import { renderWithProviders } from '@/test/render'
import type { User } from '@/domain'

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

function renderRiders(path = '/riders', user: User = staffUser) {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
    { user },
  )
}

describe('RidersPage', () => {
  beforeEach(() => resetDb())

  it('lists the current store riders only', async () => {
    renderRiders()

    expect(await screen.findByText('Jojo Ramos', {}, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.getByText('Ramon Cruz')).toBeInTheDocument()
    expect(screen.queryByText('Paolo Lim')).not.toBeInTheDocument()
  })

  it('adds a rider to the current store', async () => {
    const actor = userEvent.setup()
    renderRiders()
    await screen.findByText('Jojo Ramos')

    await actor.type(screen.getByLabelText(/^Rider name/), 'Nadia Santos')
    await actor.click(screen.getByRole('button', { name: 'Add rider' }))

    expect(await screen.findByText('Nadia Santos added.')).toBeInTheDocument()
  })

  it('lets an admin review riders per store', async () => {
    const actor = userEvent.setup()
    renderRiders('/admin/riders', adminUser)
    await screen.findByText('Jojo Ramos')

    await actor.click(screen.getByRole('radio', { name: 'Zeann' }))
    expect(await screen.findByText('Paolo Lim')).toBeInTheDocument()
    expect(screen.queryByText('Jojo Ramos')).not.toBeInTheDocument()
  })
})
