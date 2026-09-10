import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '@/app/router'
import { resetDb } from '@/services/mocks/db'
import { renderWithProviders } from '@/test/render'
import type { User } from '@/domain'

const staffUser: User = { id: 'user-1', name: 'Alice', role: 'staff', storeId: 'amara' }

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

    await user.selectOptions(screen.getByLabelText('Status'), 'settled')

    expect(await screen.findByText('Ana Reyes')).toBeInTheDocument()
    expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument()
  })
})
