import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { getDb, resetDb } from '@/services/mocks/db'
import { createSale } from '@/services/saleService'
import { renderWithProviders } from '@/test/render'
import type { User } from '@/domain'
import { AdminDashboardPage } from './AdminDashboardPage'

const adminUser: User = {
  id: 'user-3',
  name: 'Owner',
  role: 'admin',
  username: 'owner',
  active: true,
}

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    // A fixed mid-week date (Thursday 2026-10-08) keeps the Sunday–Saturday
    // week and the seed's relative dates deterministic (DEC-066).
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 9, 8, 10, 0, 0))
    resetDb()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows today sales by default across both stores', async () => {
    renderWithProviders(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>,
      { user: adminUser },
    )
    expect(await screen.findByText('Overall daily sales')).toBeInTheDocument()
    expect(screen.getByText('₱2,590.00')).toBeInTheDocument()
    // Today's cash sales (sale-1 + sale-3) repeat in the payment split.
    expect(screen.getAllByText('₱2,395.00').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Amara').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Zeann').length).toBeGreaterThan(0)
    expect(screen.queryByText('Overall weekly sales')).not.toBeInTheDocument()
    expect(screen.queryByText('Overall monthly sales')).not.toBeInTheDocument()
  })

  it('switches between Today, Weekly, and Monthly sales tabs', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>,
      { user: adminUser },
    )
    await screen.findByText('Overall daily sales')

    await user.click(screen.getByRole('radio', { name: 'Weekly' }))
    expect(await screen.findByText('Overall weekly sales')).toBeInTheDocument()
    expect(screen.getAllByText(/Sunday–Saturday/).length).toBeGreaterThan(0)
    // Week-to-date (Sun Oct 4 → Thu Oct 8) includes yesterday's Zeann sale
    // (today 259000 + yesterday 120000).
    expect(screen.getAllByText('₱3,790.00').length).toBeGreaterThan(0)

    await user.click(screen.getByRole('radio', { name: 'Monthly' }))
    expect(await screen.findByText('Overall monthly sales')).toBeInTheDocument()
    expect(screen.getAllByText(/this month/).length).toBeGreaterThan(0)

    await user.click(screen.getByRole('radio', { name: 'Today' }))
    expect(await screen.findByText('Overall daily sales')).toBeInTheDocument()
  })

  it('counts the current Sunday week only, not a trailing 7 days', async () => {
    const db = getDb()
    // Monday of the current week (included) and the previous Saturday (excluded).
    db.sales.push({
      id: 'sale-week-mon',
      storeId: 'amara',
      saleDate: '2026-10-05',
      paymentType: 'cash',
      paymentMethod: 'Cash',
      lines: [],
      totalMinor: 50000,
      recordedByUserId: 'user-1',
      createdAt: '2026-10-05T08:00:00.000Z',
    })
    db.sales.push({
      id: 'sale-prev-sat',
      storeId: 'amara',
      saleDate: '2026-10-03',
      paymentType: 'cash',
      paymentMethod: 'Cash',
      lines: [],
      totalMinor: 70000,
      recordedByUserId: 'user-1',
      createdAt: '2026-10-03T08:00:00.000Z',
    })

    const user = userEvent.setup()
    renderWithProviders(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>,
      { user: adminUser },
    )
    await screen.findByText('Overall daily sales')
    await user.click(screen.getByRole('radio', { name: 'Weekly' }))

    expect(await screen.findByText('Overall weekly sales')).toBeInTheDocument()
    // Today 259000 + yesterday 120000 + Monday Oct 5 50000; the previous
    // Saturday (Oct 3, within a trailing 7 days) is excluded.
    expect(screen.getAllByText('₱4,290.00').length).toBeGreaterThan(0)
    expect(screen.queryByText('₱4,990.00')).not.toBeInTheDocument()
  })

  it('caps stock lists at five rows with View all shortcuts (DEC-046)', async () => {
    // Inflate both lists past the five-row preview limit.
    const db = getDb()
    for (let i = 0; i < 7; i++) {
      db.stock.push({ storeId: 'amara', productId: `prod-x${i}`, quantity: 9 })
      db.receiving.push({
        id: `recv-x${i}`,
        storeId: 'amara',
        productId: `prod-x${i}`,
        quantity: 3,
        supplier: 'Bulk Co',
        costPriceMinor: 1000,
        sellingPriceMinor: 1200,
        recordedByUserId: 'user-1',
        receivedAt: new Date().toISOString(),
        status: 'approved',
      })
    }

    renderWithProviders(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>,
      { user: adminUser },
    )
    await screen.findByText('Overall daily sales')

    const currentSection = screen
      .getByRole('heading', { name: 'Current stock' })
      .closest('section') as HTMLElement
    // jsdom renders the wide DataTable: a header row plus the five preview rows.
    expect(within(currentSection).getAllByRole('row')).toHaveLength(6)
    expect(within(currentSection).getByRole('button', { name: 'View all' })).toBeInTheDocument()

    const receivedSection = screen
      .getByRole('heading', { name: 'Received stock' })
      .closest('section') as HTMLElement
    expect(within(receivedSection).getAllByRole('row')).toHaveLength(6)
    expect(within(receivedSection).getByRole('button', { name: 'View all' })).toBeInTheDocument()
  })

  it('keeps charge sales out of Total Cash Sales (cash/charge regression)', async () => {
    await createSale({
      storeId: 'amara',
      paymentType: 'charge',
      customerId: 'cust-1',
      termsId: 'terms-15',
      lines: [{ productId: 'prod-1', quantity: 1, unitPriceMinor: 115000 }],
      recordedByUserId: 'user-1',
    })
    renderWithProviders(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>,
      { user: adminUser },
    )
    await screen.findByText('Overall daily sales')

    expect(screen.getByText('Total Cash Sales')).toBeInTheDocument()
    // Seed cash sales today (sale-1 + sale-3); the new charge sale adds no cash.
    expect(screen.getAllByText('₱2,395.00').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('2 cash sales')).toBeInTheDocument()
  })

  it('splits sales into cash, GCash, and bank buckets per period (DEC-059)', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>,
      { user: adminUser },
    )
    await screen.findByText('Overall daily sales')

    expect(screen.getByText('Total Cash Sales')).toBeInTheDocument()
    expect(screen.getByText('GCash Paid')).toBeInTheDocument()
    expect(screen.getByText('Bank Payment')).toBeInTheDocument()
    // Seed cash sales today: sale-1 + sale-3 (charge sale-2 excluded).
    expect(screen.getAllByText('₱2,395.00').length).toBeGreaterThanOrEqual(1)

    await user.click(screen.getByRole('radio', { name: 'Weekly' }))
    expect(await screen.findByText('Overall weekly sales')).toBeInTheDocument()
    // Weekly cash adds yesterday's Zeann sale; weekly collections add the
    // seeded GCash and bank payments.
    expect(screen.getAllByText('₱3,595.00').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('₱200.00').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('₱120.00').length).toBeGreaterThanOrEqual(1)
  })
})
