import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '@/app/router'
import { resetDb } from '@/services/mocks/db'
import { renderWithProviders } from '@/test/render'
import { __awaitSwal } from '@/test/swalMock'
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

describe('CreditListPage', () => {
  beforeEach(() => resetDb())

  it('lists shared credit obligations with origin stores', async () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/credit']}>
        <AppRoutes />
      </MemoryRouter>,
      { user: staffUser },
    )
    expect(await screen.findByText('Juan Dela Cruz')).toBeInTheDocument()
    expect(screen.getByText('Zeann')).toBeInTheDocument()
  })

  it('filters by status', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <MemoryRouter initialEntries={['/credit']}>
        <AppRoutes />
      </MemoryRouter>,
      { user: staffUser },
    )
    await screen.findByText('Maria Santos')

    await user.click(screen.getByRole('radio', { name: 'Settled' }))

    expect(await screen.findByText('Ana Reyes')).toBeInTheDocument()
    expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument()
  })

  it('lists credit records alphabetically by customer name (DEC-058)', async () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/credit']}>
        <AppRoutes />
      </MemoryRouter>,
      { user: staffUser },
    )
    await screen.findByText('Maria Santos')

    const inOrder = ['Ana Reyes', 'Juan Dela Cruz', 'Maria Santos'].map(
      (name) => screen.getByText(name) as HTMLElement,
    )
    for (let index = 1; index < inOrder.length; index++) {
      const position = inOrder[index - 1].compareDocumentPosition(inOrder[index])
      expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    }
  })

  it('encodes an existing credit with manually entered interest (DEC-059)', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <MemoryRouter initialEntries={['/admin/credit']}>
        <AppRoutes />
      </MemoryRouter>,
      { user: adminUser },
    )
    await screen.findByText('Maria Santos')

    await user.click(screen.getByRole('button', { name: 'Add existing credit' }))
    const dialog = await screen.findByRole('dialog', { name: 'Add existing credit' })
    await user.selectOptions(within(dialog).getByLabelText(/Customer/), 'cust-1')
    await user.selectOptions(within(dialog).getByLabelText(/^Item/), 'prod-1')
    await user.type(within(dialog).getByLabelText(/^Qty/), '1')
    await user.type(within(dialog).getByLabelText(/Price/), '250')
    await user.type(within(dialog).getByLabelText(/Interest/), '15')
    await user.click(within(dialog).getByRole('button', { name: 'Encode credit' }))

    await __awaitSwal('Existing credit encoded.')
  })
})
