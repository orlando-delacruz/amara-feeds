import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '@/app/router'
import { getDb, resetDb } from '@/services/mocks/db'
import { recordPayment } from '@/services/paymentService'
import { __awaitSwal, __swalCalls } from '@/test/swalMock'
import { renderWithProviders } from '@/test/render'
import type { CartLine } from '@/features/sales/CartContext'
import type { StoreContextId } from '@/store/stores'
import type { User } from '@/domain'

vi.mock('@/services/paymentService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/paymentService')>()
  return { ...actual, recordPayment: vi.fn(actual.recordPayment) }
})

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

function renderCart(
  path = '/sales/cart',
  user: User = staffUser,
  cart: CartLine[] = cartLines,
  initialStore?: StoreContextId,
) {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
    { user, cart, store: initialStore },
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

  it('auto-shows the address of an existing selected customer', async () => {
    const user = userEvent.setup()
    renderCart()

    await user.selectOptions(await screen.findByLabelText(/Customer \(optional\)/), 'cust-1')

    expect(await screen.findByLabelText('Address')).toHaveValue(
      '123 Mabini Street, Barangay Poblacion',
    )
  })

  it('surfaces the charge-without-customer validation', async () => {
    const user = userEvent.setup()
    renderCart()

    await user.selectOptions(await screen.findByLabelText('Payment type'), 'charge')
    await user.selectOptions(screen.getByLabelText(/^Payment terms/), 'terms-7')
    await user.click(screen.getByRole('button', { name: 'Save sale' }))

    const waled = await __awaitSwal('Could not record the sale.')
    expect(String(waled?.text)).toMatch(/requires a customer/)
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
    renderCart('/admin/sales/cart', adminUser, cartLines, 'amara')

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

  it('shows the selected customer address from the add-customer flow', async () => {
    const user = userEvent.setup()
    renderCart()

    await user.click(await screen.findByRole('button', { name: 'Add new customer' }))
    const dialog = await screen.findByRole('dialog', { name: 'Add customer' })
    await user.type(within(dialog).getByLabelText(/^Name/), 'Rosa Abad')
    await user.type(within(dialog).getByLabelText(/^Address/), '45 Rizal Ave.')
    await user.click(within(dialog).getByRole('button', { name: 'Add customer' }))

    expect(await screen.findByText('Rosa Abad')).toBeInTheDocument()
    expect(screen.getByLabelText('Address')).toHaveValue('45 Rizal Ave.')
  })

  it('confirms the add-customer flow with a popup and returns to the cart (DEC-046)', async () => {
    const user = userEvent.setup()
    renderCart()

    await user.click(await screen.findByRole('button', { name: 'Add new customer' }))
    const dialog = await screen.findByRole('dialog', { name: 'Add customer' })
    await user.type(within(dialog).getByLabelText(/^Name/), 'Rosa Abad')
    await user.click(within(dialog).getByRole('button', { name: 'Add customer' }))

    await __awaitSwal('Customer added.')
    // The dialog closed; the cart form (not a dialog) holds the new customer.
    expect(screen.queryByRole('dialog', { name: 'Add customer' })).not.toBeInTheDocument()
    expect(await screen.findByText('Rosa Abad')).toBeInTheDocument()
  })

  it('hides mode of payment for charge sales and restores it for cash (DEC-045)', async () => {
    const user = userEvent.setup()
    renderCart()

    await user.selectOptions(await screen.findByLabelText('Payment type'), 'charge')
    expect(screen.queryByLabelText(/Mode of payment/)).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Payment type'), 'cash')
    expect(screen.getByLabelText(/Mode of payment/)).toBeInTheDocument()
  })

  it('reveals mode of payment only when a charge down payment is entered (DEC-045)', async () => {
    const user = userEvent.setup()
    renderCart()

    await user.selectOptions(await screen.findByLabelText('Payment type'), 'charge')
    expect(screen.queryByLabelText(/Mode of payment/)).not.toBeInTheDocument()

    await user.type(screen.getByLabelText(/Down payment/), '100')
    expect(screen.getByLabelText(/Mode of payment/)).toBeInTheDocument()
  })

  it('blocks a down payment larger than the net total (DEC-045)', async () => {
    const user = userEvent.setup()
    renderCart()

    await user.selectOptions(await screen.findByLabelText('Payment type'), 'charge')
    await user.type(screen.getByLabelText(/Down payment/), '99999')
    await user.click(screen.getByRole('button', { name: 'Save sale' }))

    expect(
      await screen.findByText('Down payment cannot be more than the net total.'),
    ).toBeInTheDocument()
  })

  it('records a charge sale with a down payment through the payment flow (DEC-045)', async () => {
    const user = userEvent.setup()
    renderCart()

    await user.selectOptions(await screen.findByLabelText('Payment type'), 'charge')
    await user.selectOptions(screen.getByLabelText(/Customer \(optional\)/), 'cust-1')
    await user.selectOptions(screen.getByLabelText(/^Payment terms/), 'terms-15')
    await user.type(screen.getByLabelText(/Down payment/), '100')
    await user.click(screen.getByRole('button', { name: 'Save sale' }))

    // swal calls accumulate across the file: take this test's popup, not an
    // earlier cash sale's.
    await __awaitSwal('Sale recorded.')
    const popup = __swalCalls()
      .filter((call) => call.title === 'Sale recorded.')
      .at(-1)
    expect(String(popup?.text)).toMatch(/down payment was recorded/)

    // The payment landed on the obligation with a reduced balance.
    const db = getDb()
    const obligation = db.credits.find((credit) => credit.saleId === db.sales.at(-1)?.id)
    expect(obligation).toBeDefined()
    const payment = db.payments.find((entry) => entry.creditId === obligation?.id)
    expect(payment?.amountMinor).toBe(10000)
    expect(obligation?.balanceMinor).toBe(249500 - 10000)
  })

  it('keeps the sale and surfaces a retry path when the down payment fails (DEC-045)', async () => {
    vi.mocked(recordPayment).mockRejectedValueOnce(new Error('network gone'))
    const user = userEvent.setup()
    renderCart()

    await user.selectOptions(await screen.findByLabelText('Payment type'), 'charge')
    await user.selectOptions(screen.getByLabelText(/Customer \(optional\)/), 'cust-1')
    await user.selectOptions(screen.getByLabelText(/^Payment terms/), 'terms-15')
    await user.type(screen.getByLabelText(/Down payment/), '100')
    await user.click(screen.getByRole('button', { name: 'Save sale' }))

    const popup = await __awaitSwal('Sale recorded, but the down payment was not saved.')
    expect(String(popup?.text)).toMatch(/credit page/)
    expect(
      await screen.findByRole('heading', { name: 'Sales' }, { timeout: 5000 }),
    ).toBeInTheDocument()
    // The sale itself was recorded (seed has four).
    expect(getDb().sales).toHaveLength(5)
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
