import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '@/app/router'
import { resetDb } from '@/services/mocks/db'
import { approveProduct, createProduct } from '@/services/productService'
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
const adminUser: User = {
  id: 'user-3',
  name: 'Owner',
  role: 'admin',
  username: 'owner',
  active: true,
}

function renderNewSale(path = '/sales/new', user: User = staffUser) {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
    { user },
  )
}

async function productCard(name: string) {
  const heading = await screen.findByRole('heading', { name })
  return heading.closest('div') as HTMLElement
}

describe('NewSalePage', () => {
  beforeEach(() => resetDb())

  it('shows active products with their store prices', async () => {
    renderNewSale()

    expect(await screen.findByText('Rice 25kg')).toBeInTheDocument()
    expect(screen.getByText('Sugar 1kg')).toBeInTheDocument()
    expect(screen.getByText('Instant Coffee')).toBeInTheDocument()
    expect(screen.getByText('₱1,150.00')).toBeInTheDocument()
    expect(screen.getByText('₱65.00')).toBeInTheDocument()
    expect(screen.getByText('₱95.00')).toBeInTheDocument()
  })

  it('does not show pending products', async () => {
    renderNewSale()

    await screen.findByText('Rice 25kg')
    expect(screen.queryByText('Cooking Oil 1L')).not.toBeInTheDocument()
  })

  it('adds to the cart and updates the basket badge without leaving the page', async () => {
    const user = userEvent.setup()
    renderNewSale()

    const rice = await productCard('Rice 25kg')
    await user.click(within(rice).getByRole('button', { name: 'Add to cart' }))

    expect(within(screen.getByRole('button', { name: 'Open cart' })).getByText('1')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'New sale' })).toBeInTheDocument()
  })

  it('merges quantities when the same product is added again', async () => {
    const user = userEvent.setup()
    renderNewSale()

    const rice = await productCard('Rice 25kg')
    await user.click(within(rice).getByRole('button', { name: 'Add to cart' }))
    await user.click(within(rice).getByRole('button', { name: 'Increase Rice 25kg quantity' }))
    await user.click(within(rice).getByRole('button', { name: 'Add to cart' }))

    expect(within(screen.getByRole('button', { name: 'Open cart' })).getByText('3')).toBeInTheDocument()
  })

  it('opens the cart page when the basket is clicked', async () => {
    const user = userEvent.setup()
    renderNewSale()

    const rice = await productCard('Rice 25kg')
    await user.click(within(rice).getByRole('button', { name: 'Add to cart' }))
    await user.click(screen.getByRole('button', { name: 'Open cart' }))

    expect(await screen.findByRole('button', { name: 'Save sale' })).toBeInTheDocument()
  })

  it('shows a disabled add button for products without a store receipt', async () => {
    const product = await createProduct({ name: 'Unpriced Item', createdByUserId: 'user-1' })
    await approveProduct(product.id)

    renderNewSale()
    const card = await screen.findByRole('heading', { name: 'Unpriced Item' })
    const container = card.closest('div') as HTMLElement
    expect(await screen.findByText('No price')).toBeInTheDocument()
    expect(within(container).getByRole('button', { name: 'Add to cart' })).toBeDisabled()
  })

  it('lets an admin add to the cart and open it in the admin area', async () => {
    const user = userEvent.setup()
    renderNewSale('/admin/sales/new', adminUser)

    const rice = await productCard('Rice 25kg')
    await user.click(within(rice).getByRole('button', { name: 'Add to cart' }))
    await user.click(screen.getByRole('button', { name: 'Open cart' }))

    expect(await screen.findByRole('button', { name: 'Save sale' })).toBeInTheDocument()
  })
})