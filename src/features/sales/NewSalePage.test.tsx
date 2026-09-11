import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '@/app/router'
import { resetDb } from '@/services/mocks/db'
import { renderWithProviders } from '@/test/render'
import type { User } from '@/domain'

const staffUser: User = { id: 'user-1', name: 'Alice', role: 'staff', storeId: 'amara' }
const adminUser: User = { id: 'user-3', name: 'Owner', role: 'admin' }

function renderNewSale(path = '/sales/new', user: User = staffUser) {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
    { user },
  )
}

describe('NewSalePage', () => {
  beforeEach(() => resetDb())

  it('records a cash sale and returns to the sales list', async () => {
    const user = userEvent.setup()
    renderNewSale()

    await user.selectOptions(await screen.findByLabelText(/^Item/), 'prod-1')
    await user.type(screen.getByLabelText(/^Qty/), '2')
    await user.type(screen.getByLabelText(/^Unit price/), '1150')
    await user.click(screen.getByRole('button', { name: 'Save sale' }))

    expect(
      await screen.findByRole('heading', { name: 'Sales' }, { timeout: 5000 }),
    ).toBeInTheDocument()
  })

  it('records a charge sale with a due date preview', async () => {
    const user = userEvent.setup()
    renderNewSale()

    await user.selectOptions(await screen.findByLabelText('Payment type'), 'charge')
    await user.selectOptions(screen.getByLabelText(/Customer \(optional\)/), 'cust-1')
    await user.selectOptions(await screen.findByLabelText(/^Item/), 'prod-2')
    await user.type(screen.getByLabelText(/^Qty/), '3')
    await user.type(screen.getByLabelText(/^Unit price/), '65')
    await user.selectOptions(screen.getByLabelText(/^Payment terms/), 'terms-15')

    expect(await screen.findByText(/Due date:/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Save sale' }))
    expect(
      await screen.findByRole('heading', { name: 'Sales' }, { timeout: 5000 }),
    ).toBeInTheDocument()
  })

  it('surfaces the charge-without-customer validation', async () => {
    const user = userEvent.setup()
    renderNewSale()

    await user.selectOptions(await screen.findByLabelText('Payment type'), 'charge')
    await user.selectOptions(await screen.findByLabelText(/^Item/), 'prod-1')
    await user.type(screen.getByLabelText(/^Qty/), '1')
    await user.type(screen.getByLabelText(/^Unit price/), '50')
    await user.selectOptions(screen.getByLabelText(/^Payment terms/), 'terms-7')
    await user.click(screen.getByRole('button', { name: 'Save sale' }))

    expect(await screen.findByText('A charge sale requires a customer.')).toBeInTheDocument()
  })

  it('records a sale as admin and returns to the admin sales list', async () => {
    const user = userEvent.setup()
    renderNewSale('/admin/sales/new', adminUser)

    await user.selectOptions(await screen.findByLabelText(/^Item/), 'prod-1')
    await user.type(screen.getByLabelText(/^Qty/), '2')
    await user.type(screen.getByLabelText(/^Unit price/), '1150')
    await user.click(screen.getByRole('button', { name: 'Save sale' }))

    expect(
      await screen.findByRole('heading', { name: 'Sales' }, { timeout: 5000 }),
    ).toBeInTheDocument()
  })
})
