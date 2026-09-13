import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '@/app/router'
import { resetDb } from '@/services/mocks/db'
import { renderWithProviders } from '@/test/render'
import type { User } from '@/domain'

const adminUser: User = {
  id: 'user-3',
  name: 'Owner',
  role: 'admin',
  username: 'owner',
  active: true,
}

function renderStaffPage() {
  return renderWithProviders(
    <MemoryRouter initialEntries={['/admin/users']}>
      <AppRoutes />
    </MemoryRouter>,
    { user: adminUser },
  )
}

describe('StaffListPage', () => {
  beforeEach(() => resetDb())

  it('lists staff with their assigned store and status', async () => {
    renderStaffPage()

    expect(await screen.findByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Ben')).toBeInTheDocument()
    expect(screen.getByText('alice')).toBeInTheDocument()
    expect(screen.getAllByText('Amara').length).toBeGreaterThan(0)
    expect(screen.getByText('Zeann')).toBeInTheDocument()
    expect(screen.getAllByText('Active').length).toBeGreaterThan(0)
  })

  it('adds a staff account with a store assignment', async () => {
    const actor = userEvent.setup()
    renderStaffPage()
    await screen.findByText('Alice')

    await actor.click(screen.getByRole('button', { name: 'Add staff' }))
    const dialog = await screen.findByRole('dialog', { name: 'Add staff' })
    await actor.type(within(dialog).getByLabelText(/^Name/), 'Cora Staff')
    await actor.type(within(dialog).getByLabelText(/^Username/), 'cora')
    await actor.type(within(dialog).getByLabelText(/^Password/), 'cora1234')
    await actor.selectOptions(within(dialog).getByLabelText(/^Assigned store/), 'zeann')
    await actor.click(within(dialog).getByRole('button', { name: 'Add staff' }))

    expect(await screen.findByText('Cora Staff added.')).toBeInTheDocument()
    expect(screen.getByText('cora')).toBeInTheDocument()
  })

  it('rejects a taken username', async () => {
    const actor = userEvent.setup()
    renderStaffPage()
    await screen.findByText('Alice')

    await actor.click(screen.getByRole('button', { name: 'Add staff' }))
    const dialog = await screen.findByRole('dialog', { name: 'Add staff' })
    await actor.type(within(dialog).getByLabelText(/^Name/), 'Copy Cat')
    await actor.type(within(dialog).getByLabelText(/^Username/), 'alice')
    await actor.type(within(dialog).getByLabelText(/^Password/), 'copy1234')
    await actor.click(within(dialog).getByRole('button', { name: 'Add staff' }))

    expect(await within(dialog).findByText('That username is already taken.')).toBeInTheDocument()
  })

  it('disables a staff account through a confirmation', async () => {
    const actor = userEvent.setup()
    renderStaffPage()
    await screen.findByText('Alice')

    const disableButtons = screen.getAllByRole('button', { name: 'Disable' })
    await actor.click(disableButtons[0])
    const dialog = await screen.findByRole('dialog', { name: 'Disable staff' })
    await actor.click(within(dialog).getByRole('button', { name: 'Disable' }))

    expect(await screen.findByText(/is disabled and can no longer sign in/)).toBeInTheDocument()
    expect(screen.getByText('Disabled')).toBeInTheDocument()
  })
})
