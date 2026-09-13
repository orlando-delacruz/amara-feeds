import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '@/app/router'
import { resetDb } from '@/services/mocks/db'
import { renderWithProviders } from '@/test/render'
import type { User } from '@/domain'

const staffUser: User = {
  id: 'user-2',
  name: 'Ben',
  role: 'staff',
  storeId: 'zeann',
  username: 'ben',
  active: true,
}

function renderVehicles() {
  return renderWithProviders(
    <MemoryRouter initialEntries={['/vehicles']}>
      <AppRoutes />
    </MemoryRouter>,
    { user: staffUser },
  )
}

describe('VehiclesPage', () => {
  beforeEach(() => resetDb())

  it('lists the current store vehicle types only', async () => {
    renderVehicles()

    expect(await screen.findByText('Van')).toBeInTheDocument()
    expect(screen.getByText('Motorcycle')).toBeInTheDocument()
    expect(screen.queryByText('Tricycle')).not.toBeInTheDocument()
  })

  it('adds a vehicle type to the current store', async () => {
    const actor = userEvent.setup()
    renderVehicles()
    await screen.findByText('Van')

    await actor.type(screen.getByLabelText(/^Vehicle type/), 'E-bike')
    await actor.click(screen.getByRole('button', { name: 'Add vehicle' }))

    expect(await screen.findByText('E-bike added.')).toBeInTheDocument()
  })
})
