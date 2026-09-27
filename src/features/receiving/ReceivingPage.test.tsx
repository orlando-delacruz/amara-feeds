import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { resetDb } from '@/services/mocks/db'
import { createReceiving } from '@/services/receivingService'
import { getStock } from '@/services/inventoryService'
import { __awaitSwal } from '@/test/swalMock'
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

const adminUser: User = {
  id: 'user-3',
  name: 'Owner',
  role: 'admin',
  username: 'owner',
  active: true,
}

describe('ReceivingPage', () => {
  beforeEach(() => resetDb())

  async function openAddStockDialog(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: 'Add stock' }))
    expect(await screen.findByRole('dialog', { name: 'Add stock' })).toBeInTheDocument()
  }

  async function showListItems(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('radio', { name: 'List items' }))
  }

  it('filters between pending items and received items with tabs', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ReceivingPage />, { user: staffUser })

    expect(await screen.findByText('Your pending items')).toBeInTheDocument()
    expect(screen.queryByText('Central Supply')).not.toBeInTheDocument()

    await showListItems(user)
    expect(await screen.findByText('Central Supply')).toBeInTheDocument()
    expect(screen.queryByText('Your pending items')).not.toBeInTheDocument()
  })

  it('lists the current store receipts', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ReceivingPage />, { user: staffUser })
    await showListItems(user)
    expect(await screen.findByText('Central Supply')).toBeInTheDocument()
  })

  it('opens an Add stock dialog with the requested fields and actions', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ReceivingPage />, { user: staffUser })
    await screen.findByText('Your pending items')

    await openAddStockDialog(user)

    expect(screen.getByLabelText(/^Item/)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Quantity/)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Supplier/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Cost price/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Selling price/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('discards the form when Cancel is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ReceivingPage />, { user: staffUser })
    await screen.findByText('Your pending items')

    await openAddStockDialog(user)
    await user.type(screen.getByLabelText(/^Supplier/), 'Discarded Supplier')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog', { name: 'Add stock' })).not.toBeInTheDocument()

    await openAddStockDialog(user)
    expect(screen.getByLabelText(/^Supplier/)).toHaveValue('')
    expect(screen.queryByText('Discarded Supplier')).not.toBeInTheDocument()
  })

  it('records a stock receipt for the current store', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ReceivingPage />, { user: staffUser })
    await screen.findByText('Your pending items')

    await openAddStockDialog(user)
    await user.selectOptions(screen.getByLabelText(/^Item/), 'prod-1')
    await user.type(screen.getByLabelText(/^Quantity/), '5')
    await user.type(screen.getByLabelText(/^Supplier/), 'New Supplier Co')
    await user.type(screen.getByLabelText(/Cost price/), '1150')
    await user.type(screen.getByLabelText(/Selling price/), '1500')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await __awaitSwal('Receiving recorded.')
    await showListItems(user)
    expect(await screen.findByText('New Supplier Co')).toBeInTheDocument()
  })

  it('records a receipt with a custom new item', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ReceivingPage />, { user: staffUser })
    await screen.findByText('Your pending items')

    await openAddStockDialog(user)
    await user.selectOptions(screen.getByLabelText(/^Item/), '__new__')
    await user.type(screen.getByLabelText(/New item name/), 'Hog Pellets 50kg')
    await user.type(screen.getByLabelText(/^Quantity/), '4')
    await user.type(screen.getByLabelText(/^Supplier/), 'Custom Mill')
    await user.type(screen.getByLabelText(/Cost price/), '2200')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await __awaitSwal('New item submitted for admin approval. Receiving recorded.')
    expect(await screen.findByText('Hog Pellets 50kg')).toBeInTheDocument()
  })

  it('surfaces a rejected quantity', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ReceivingPage />, { user: staffUser })
    await screen.findByText('Your pending items')

    await openAddStockDialog(user)
    await user.selectOptions(screen.getByLabelText(/^Item/), 'prod-1')
    await user.type(screen.getByLabelText(/^Quantity/), '0')
    await user.type(screen.getByLabelText(/^Supplier/), 'Acme')
    await user.type(screen.getByLabelText(/Cost price/), '100')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    const refused = await __awaitSwal('Could not record the receipt.')
    expect(String(refused?.text)).toMatch(/greater than zero/)
  })

  it('surfaces a missing custom item name', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ReceivingPage />, { user: staffUser })
    await screen.findByText('Your pending items')

    await openAddStockDialog(user)
    await user.selectOptions(screen.getByLabelText(/^Item/), '__new__')
    await user.type(screen.getByLabelText(/^Quantity/), '5')
    await user.type(screen.getByLabelText(/^Supplier/), 'Acme')
    await user.type(screen.getByLabelText(/Cost price/), '100')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Enter a name for the new item.')).toBeInTheDocument()
  })

  it('shows staff their own pending items with a Pending badge', async () => {
    renderWithProviders(<ReceivingPage />, { user: staffUser })
    expect(await screen.findByText('Your pending items')).toBeInTheDocument()
    expect(screen.getByText('Cooking Oil 1L')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('shows the Pending badge beside the item name on narrow viewports', async () => {
    const matchMedia = window.matchMedia
    window.matchMedia = (() => ({
      matches: false,
      media: '',
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia
    try {
      renderWithProviders(<ReceivingPage />, { user: staffUser })
      const card = (await screen.findByText('Cooking Oil 1L')).closest('li')
      expect(card).not.toBeNull()
      expect(within(card as HTMLElement).getByText('Pending')).toBeInTheDocument()
    } finally {
      window.matchMedia = matchMedia
    }
  })

  it('lets admins approve pending items from receiving', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ReceivingPage />, { user: adminUser })
    expect(await screen.findByText('Items awaiting approval')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Approve' }))

    await __awaitSwal('Cooking Oil 1L is now active.')
  })

  it('lets admins reject pending items from receiving', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ReceivingPage />, { user: adminUser })
    expect(await screen.findByText('Items awaiting approval')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reject' }))

    await __awaitSwal('Cooking Oil 1L was rejected and removed.')
  })

  it('exports the store inventory history as Excel (DEC-060)', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ReceivingPage />, { user: staffUser })
    await screen.findByText('Your pending items')

    await user.click(screen.getByRole('button', { name: 'Export Excel' }))

    await __awaitSwal('Inventory exported.')
  })

  it('marks a new staff submission as Pending with no admin actions (DEC-061)', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ReceivingPage />, { user: staffUser })
    await screen.findByText('Your pending items')

    await openAddStockDialog(user)
    await user.selectOptions(screen.getByLabelText(/^Item/), 'prod-1')
    await user.type(screen.getByLabelText(/^Quantity/), '5')
    await user.type(screen.getByLabelText(/^Supplier/), 'Pending Mill Co')
    await user.type(screen.getByLabelText(/Cost price/), '1150')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await __awaitSwal('Receiving recorded.')
    await showListItems(user)
    expect(await screen.findByText('Pending Mill Co')).toBeInTheDocument()
    expect(screen.getAllByText('Pending').length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeInTheDocument()
  })

  it('lets an admin approve a pending receipt into inventory (DEC-061)', async () => {
    const user = userEvent.setup()
    await createReceiving({
      storeId: 'amara',
      productId: 'prod-1',
      quantity: 5,
      supplier: 'Approval Mill Co',
      costPriceMinor: 100000,
      recordedByUserId: 'user-1',
    })
    renderWithProviders(<ReceivingPage />, { user: adminUser, store: 'amara' })
    await showListItems(user)
    const note = await screen.findByText('Approval Mill Co')
    const row = note.closest('tr, [role="row"], article, li')
    expect(row).not.toBeNull()
    await user.click(within(row as HTMLElement).getByRole('button', { name: 'Approve' }))

    await __awaitSwal('Receipt approved. Inventory updated.')
    const approvedNote = await screen.findByText('Approval Mill Co')
    const approvedRow = approvedNote.closest('tr, [role="row"], article, li')
    expect(approvedRow).not.toBeNull()
    expect(within(approvedRow as HTMLElement).getByText('Approved')).toBeInTheDocument()
    expect((await getStock('amara', 'prod-1')).quantity).toBe(20 + 5)
  })

  it('lets an admin reject a pending receipt without touching inventory (DEC-061)', async () => {
    const user = userEvent.setup()
    await createReceiving({
      storeId: 'amara',
      productId: 'prod-1',
      quantity: 5,
      supplier: 'Rejection Mill Co',
      costPriceMinor: 100000,
      recordedByUserId: 'user-1',
    })
    renderWithProviders(<ReceivingPage />, { user: adminUser, store: 'amara' })
    await showListItems(user)
    const note = await screen.findByText('Rejection Mill Co')
    const row = note.closest('tr, [role="row"], article, li')
    expect(row).not.toBeNull()
    await user.click(within(row as HTMLElement).getByRole('button', { name: 'Reject' }))

    await __awaitSwal('Receipt rejected.')
    expect((await getStock('amara', 'prod-1')).quantity).toBe(20)
  })
})
