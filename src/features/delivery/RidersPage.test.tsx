import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '@/app/router'
import { resetDb } from '@/services/mocks/db'
import { __awaitSwal } from '@/test/swalMock'
import { renderWithProviders } from '@/test/render'
import type { User } from '@/domain'
import type { StoreContextId } from '@/store/stores'

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

function renderRiders(path = '/riders', user: User = staffUser, initialStore?: StoreContextId) {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
    { user, store: initialStore },
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

    await __awaitSwal('Nadia Santos added.')
  })

  it('lets an admin review riders per store', async () => {
    // The store context is chosen once (More page or page-level switches);
    // per-store review is exercised through the store context.
    renderRiders('/admin/riders', adminUser, 'amara')
    expect(await screen.findByText('Jojo Ramos')).toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: 'Zeann' })).not.toBeInTheDocument()
  })

  it('renames a rider from its row', async () => {
    const actor = userEvent.setup()
    renderRiders()
    const row = (await screen.findByText('Jojo Ramos')).closest('tr') as HTMLElement

    await actor.click(within(row).getByRole('button', { name: 'Edit' }))
    const dialog = await screen.findByRole('dialog', { name: 'Edit rider' })
    const nameInput = within(dialog).getByLabelText(/^Rider name/)
    await actor.clear(nameInput)
    await actor.type(nameInput, 'Jojo Dela Cruz')
    await actor.click(within(dialog).getByRole('button', { name: 'Save changes' }))

    await __awaitSwal('Jojo Dela Cruz updated.')
    expect(await screen.findByText('Jojo Dela Cruz')).toBeInTheDocument()
  })

  it('deletes a rider that is not referenced by records', async () => {
    const actor = userEvent.setup()
    renderRiders()
    await screen.findByText('Jojo Ramos')

    await actor.type(screen.getByLabelText(/^Rider name/), 'Standby Rider')
    await actor.click(screen.getByRole('button', { name: 'Add rider' }))
    await __awaitSwal('Standby Rider added.')

    const row = (await screen.findByText('Standby Rider')).closest('tr') as HTMLElement
    await actor.click(within(row).getByRole('button', { name: 'Delete' }))

    await __awaitSwal('Standby Rider deleted.')
    expect(screen.queryByText('Standby Rider')).not.toBeInTheDocument()
  })

  it('refuses to delete a rider referenced by records', async () => {
    const actor = userEvent.setup()
    renderRiders()
    const row = (await screen.findByText('Jojo Ramos')).closest('tr') as HTMLElement

    await actor.click(within(row).getByRole('button', { name: 'Delete' }))

    const refused = await __awaitSwal('Could not delete the rider.')
    expect(String(refused?.text)).toMatch(/used by existing sales, receiving, or expenses/)
    expect(screen.getByText('Jojo Ramos')).toBeInTheDocument()
  })
})
