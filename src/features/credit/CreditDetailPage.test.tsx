import { screen } from '@testing-library/react'
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

function renderCredit(path: string) {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
    { user: staffUser },
  )
}

describe('CreditDetailPage', () => {
  beforeEach(() => resetDb())

  it('shows balance, origin store, and a shared cross-store payment history', async () => {
    renderCredit('/credit/cred-2')
    expect(await screen.findByText('Maria Santos')).toBeInTheDocument()
    expect(screen.getAllByText('₱200.00').length).toBeGreaterThan(0)
    expect(screen.getByText('Zeann')).toBeInTheDocument()
  })

  it('records a partial payment and updates the balance', async () => {
    const user = userEvent.setup()
    renderCredit('/credit/cred-2')

    await user.type(await screen.findByLabelText(/Payment amount/), '50')
    await user.click(screen.getByRole('button', { name: 'Record payment' }))

    await __awaitSwal('Payment recorded.')
    expect(await screen.findByText('₱150.00')).toBeInTheDocument()
  })

  it('records a cross-store payment against a credit from the other store', async () => {
    const user = userEvent.setup()
    renderCredit('/credit/cred-1')

    await user.type(await screen.findByLabelText(/Payment amount/), '50')
    await user.click(screen.getByRole('button', { name: 'Record payment' }))

    await __awaitSwal('Payment recorded.')
    expect(await screen.findByText('₱145.00')).toBeInTheDocument()
  })
})
