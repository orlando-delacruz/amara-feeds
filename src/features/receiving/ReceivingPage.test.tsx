import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { resetDb } from '@/services/mocks/db'
import { renderWithProviders } from '@/test/render'
import type { User } from '@/domain'
import { ReceivingPage } from './ReceivingPage'

const staffUser: User = {
  id: 'user-1',
  name: 'Alice',
  role: 'staff',
  storeId: 'amara',
  username: 'alice',
  active: true,
}

describe('ReceivingPage', () => {
  beforeEach(() => resetDb())

  it('lists the current store receipts', async () => {
    renderWithProviders(<ReceivingPage />, { user: staffUser })
    expect(await screen.findByText('Central Supply')).toBeInTheDocument()
  })

  it('records a stock receipt for the current store', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ReceivingPage />, { user: staffUser })
    await screen.findByText('Central Supply')

    await user.selectOptions(screen.getByLabelText(/^Item/), 'prod-1')
    await user.type(screen.getByLabelText(/^Quantity/), '5')
    await user.type(screen.getByLabelText(/^Supplier/), 'New Supplier Co')
    await user.type(screen.getByLabelText(/Cost price/), '1150')
    await user.click(screen.getByRole('button', { name: 'Record receiving' }))

    expect(await screen.findByText('Receiving recorded.')).toBeInTheDocument()
    expect(await screen.findByText('New Supplier Co')).toBeInTheDocument()
  })

  it('records a receipt with a custom new item', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ReceivingPage />, { user: staffUser })
    await screen.findByText('Central Supply')

    await user.selectOptions(screen.getByLabelText(/^Item/), '__new__')
    await user.type(screen.getByLabelText(/New item name/), 'Hog Pellets 50kg')
    await user.type(screen.getByLabelText(/^Quantity/), '4')
    await user.type(screen.getByLabelText(/^Supplier/), 'Custom Mill')
    await user.type(screen.getByLabelText(/Cost price/), '2200')
    await user.click(screen.getByRole('button', { name: 'Record receiving' }))

    expect(await screen.findByText('Receiving recorded.')).toBeInTheDocument()
    expect(await screen.findByText('Hog Pellets 50kg')).toBeInTheDocument()
  })

  it('surfaces a rejected quantity', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ReceivingPage />, { user: staffUser })
    await screen.findByText('Central Supply')

    await user.selectOptions(screen.getByLabelText(/^Item/), 'prod-1')
    await user.type(screen.getByLabelText(/^Quantity/), '0')
    await user.type(screen.getByLabelText(/^Supplier/), 'Acme')
    await user.type(screen.getByLabelText(/Cost price/), '100')
    await user.click(screen.getByRole('button', { name: 'Record receiving' }))

    expect(
      await screen.findByText('Received quantity must be greater than zero.'),
    ).toBeInTheDocument()
  })

  it('surfaces a missing custom item name', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ReceivingPage />, { user: staffUser })
    await screen.findByText('Central Supply')

    await user.selectOptions(screen.getByLabelText(/^Item/), '__new__')
    await user.type(screen.getByLabelText(/^Quantity/), '5')
    await user.type(screen.getByLabelText(/^Supplier/), 'Acme')
    await user.type(screen.getByLabelText(/Cost price/), '100')
    await user.click(screen.getByRole('button', { name: 'Record receiving' }))

    expect(await screen.findByText('Enter a name for the new item.')).toBeInTheDocument()
  })
})
