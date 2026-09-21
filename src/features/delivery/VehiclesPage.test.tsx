import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '@/app/router'
import { resetDb } from '@/services/mocks/db'
import { __awaitSwal } from '@/test/swalMock'
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

    await __awaitSwal('E-bike added.')
  })

  it('renames a vehicle type from its row', async () => {
    const actor = userEvent.setup()
    renderVehicles()
    const row = (await screen.findByText('Van')).closest('tr') as HTMLElement

    await actor.click(within(row).getByRole('button', { name: 'Edit' }))
    const dialog = await screen.findByRole('dialog', { name: 'Edit vehicle' })
    const labelInput = within(dialog).getByLabelText(/^Vehicle type/)
    await actor.clear(labelInput)
    await actor.type(labelInput, 'Delivery Van')
    await actor.click(within(dialog).getByRole('button', { name: 'Save changes' }))

    await __awaitSwal('Delivery Van updated.')
    expect(await screen.findByText('Delivery Van')).toBeInTheDocument()
  })

  it('deletes a vehicle type that is not referenced by records', async () => {
    const actor = userEvent.setup()
    renderVehicles()
    await screen.findByText('Van')

    await actor.type(screen.getByLabelText(/^Vehicle type/), 'Pedicab')
    await actor.click(screen.getByRole('button', { name: 'Add vehicle' }))
    await __awaitSwal('Pedicab added.')

    const row = (await screen.findByText('Pedicab')).closest('tr') as HTMLElement
    await actor.click(within(row).getByRole('button', { name: 'Delete' }))

    await __awaitSwal('Pedicab deleted.')
    expect(screen.queryByText('Pedicab')).not.toBeInTheDocument()
  })

  it('refuses to delete a vehicle type referenced by records', async () => {
    const actor = userEvent.setup()
    renderVehicles()
    const row = (await screen.findByText('Motorcycle')).closest('tr') as HTMLElement

    await actor.click(within(row).getByRole('button', { name: 'Delete' }))

    const refused = await __awaitSwal('Could not delete the vehicle.')
    expect(String(refused?.text)).toMatch(/used by existing sales, receiving, or expenses/)
    expect(screen.getByText('Motorcycle')).toBeInTheDocument()
  })
})
