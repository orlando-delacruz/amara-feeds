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
})
