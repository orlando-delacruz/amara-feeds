import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '@/app/router'
import { resetDb } from '@/services/mocks/db'
import { renderWithProviders } from '@/test/render'
import type { CartLine } from '@/features/sales/CartContext'
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

const cartLines: CartLine[] = [
  { productId: 'prod-1', quantity: 2, unitPriceMinor: 115000 },
  { productId: 'prod-2', quantity: 3, unitPriceMinor: 6500 },
]

function renderCart(path = '/sales/cart', user: User = staffUser, cart: CartLine[] = cartLines) {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
    { user, cart },
  )
}

describe('SaleCartPage', () => {
  beforeEach(() => resetDb())

  it('records a cash sale and returns to the sales list', async () => {
    const user = userEvent.setup()
    renderCart()

    expect(await screen.findByText('Rice 25kg')).toBeInTheDocument()
    expect(screen.getByText('Sugar 1kg')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Save sale' }))

    expect(
      await screen.findByRole('heading', { name: 'Sales' }, { timeout: 5000 }),
    ).toBeInTheDocument()
  })

  it('records a charge sale with a due date preview', async () => {
    const user = userEvent.setup()
    renderCart()

    await user.selectOptions(await screen.findByLabelText('Payment type'), 'charge')
    await user.selectOptions(screen.getByLabelText(/Customer \(optional\)/), 'cust-1')
    await user.selectOptions(screen.getByLabelText(/^Payment terms/), 'terms-15')

    expect(await screen.findByText(/Due date:/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Save sale' }))
    expect(
      await screen.findByRole('heading', { name: 'Sales' }, { timeout: 5000 }),
    ).toBeInTheDocument()
  })

  it('surfaces the charge-without-customer validation', async () => {
    const user = userEvent.setup()
    renderCart()

    await user.selectOptions(await screen.findByLabelText('Payment type'), 'charge')
    await user.selectOptions(screen.getByLabelText(/^Payment terms/), 'terms-7')
    await user.click(screen.getByRole('button', { name: 'Save sale' }))

    expect(await screen.findByText('A charge sale requires a customer.')).toBeInTheDocument()
  })

  it('records a sale with a rider and vehicle from the store lists', async () => {
    const user = userEvent.setup()
    renderCart()

    await user.selectOptions(await screen.findByLabelText(/Rider/), 'rider-1')
    await user.selectOptions(screen.getByLabelText(/Vehicle/), 'vehicle-1')
    await user.click(screen.getByRole('button', { name: 'Save sale' }))

    expect(
      await screen.findByRole('heading', { name: 'Sales' }, { timeout: 5000 }),
    ).toBeInTheDocument()
  })

  it('records a sale as admin and returns to the admin sales list', async () => {
    const user = userEvent.setup()
    renderCart('/admin/sales/cart', adminUser)

    await user.click(screen.getByRole('button', { name: 'Save sale' }))

    expect(
      await screen.findByRole('heading', { name: 'Sales' }, { timeout: 5000 }),
    ).toBeInTheDocument()
  })

  it('shows a merged cart line after adding the same product twice from the catalog', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <MemoryRouter initialEntries={['/sales/new']}>
        <AppRoutes />
      </MemoryRouter>,
      { user: staffUser },
    )

    const rice = (await screen.findByRole('heading', { name: 'Rice 25kg' })).closest(
      'div',
    ) as HTMLElement
    const qtyField = within(rice).getByRole('spinbutton', { name: 'Quantity' })
    await user.clear(qtyField)
    await user.type(qtyField, '2')
    await user.click(within(rice).getByRole('button', { name: 'Add to cart' }))
    await user.click(screen.getByRole('button', { name: 'Open cart' }))

    expect(await screen.findByText('Rice 25kg')).toBeInTheDocument()
    expect(screen.getByText(/2 ×/)).toBeInTheDocument()
    expect(screen.getAllByText('Rice 25kg')).toHaveLength(1)
  })

  it('removes an item from the cart', async () => {
    const user = userEvent.setup()
    renderCart()

    await user.click(await screen.findByRole('button', { name: 'Remove Sugar 1kg' }))

    expect(screen.queryByText('Sugar 1kg')).not.toBeInTheDocument()
    expect(screen.getByText('Rice 25kg')).toBeInTheDocument()
  })

  it('shows an empty state with a new-item call to action when the cart is empty', async () => {
    const user = userEvent.setup()
    renderCart('/sales/cart', staffUser, [])

    expect(await screen.findByText('No items in the cart')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'New item' }))

    expect(await screen.findByRole('heading', { name: 'New sale' })).toBeInTheDocument()
  })
})
