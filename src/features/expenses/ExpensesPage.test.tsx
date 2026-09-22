import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { resetDb } from '@/services/mocks/db'
import { renderWithProviders } from '@/test/render'
import { __awaitSwal } from '@/test/swalMock'
import type { User } from '@/domain'
import { ExpensesPage } from './ExpensesPage'

const staffUser: User = {
  id: 'user-1',
  name: 'Alice',
  role: 'staff',
  storeId: 'amara',
  username: 'alice',
  active: true,
}

describe('ExpensesPage', () => {
  beforeEach(() => resetDb())

  it('shows the net summary with seeded data', async () => {
    renderWithProviders(<ExpensesPage />, { user: staffUser })
    expect(await screen.findByText('Riders net')).toBeInTheDocument()
    expect(screen.getAllByText('Jojo Ramos').length).toBeGreaterThanOrEqual(1)
  })

  it('records an expense for a rider', async () => {
    const user = userEvent.setup()
    const { container } = renderWithProviders(<ExpensesPage />, { user: staffUser })
    await screen.findByText('Riders net')

    await user.selectOptions(screen.getByLabelText(/Assign to/), 'rider')
    const targetSelect = container.querySelector('#expense-target') as HTMLSelectElement
    await user.selectOptions(targetSelect, 'rider-2')
    await user.selectOptions(screen.getByLabelText(/Expense type/), 'fuel')
    await user.type(screen.getByLabelText(/Amount/), '750')
    await user.click(screen.getByRole('button', { name: 'Record expense' }))

    await __awaitSwal('Expense recorded.')
  })

  it('shows expense history from seeded data', async () => {
    renderWithProviders(<ExpensesPage />, { user: staffUser })
    expect(await screen.findByText('Expense history — Amara')).toBeInTheDocument()
    expect(screen.getByText('Weekly fuel for Amara deliveries')).toBeInTheDocument()
  })

  it('opens the import dialog with a template download (DEC-054)', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExpensesPage />, { user: staffUser })
    await screen.findByText('Riders net')

    await user.click(screen.getByRole('button', { name: 'Import Excel' }))
    const dialog = await screen.findByRole('dialog', { name: 'Import expenses' })
    expect(dialog).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download template' })).toBeInTheDocument()
    expect(screen.getByLabelText('Expense Excel file')).toBeInTheDocument()
  })

  it('rejects a non-Excel file without breaking the page (DEC-054)', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExpensesPage />, { user: staffUser })
    await screen.findByText('Riders net')

    await user.click(screen.getByRole('button', { name: 'Import Excel' }))
    await screen.findByRole('dialog', { name: 'Import expenses' })
    const input = screen.getByLabelText('Expense Excel file')
    // A corrupt payload wearing an .xlsx name (browsers only filter by name).
    await user.upload(input, new File(['hello'], 'broken.xlsx'))

    expect(
      await screen.findByText('This file could not be read as an Excel (.xlsx) file.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Imported summary by date')).not.toBeInTheDocument()
  })

  it('imports, summarizes by date, and exports the summary (DEC-054)', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExpensesPage />, { user: staffUser })
    await screen.findByText('Riders net')

    const writeExcelFile = (await import('write-excel-file/browser')).default
    const blob = await writeExcelFile([
      {
        data: [
          ['Date', 'Type', 'Amount', 'Rider', 'Vehicle', 'Note'].map((value) => ({ value })),
          [
            { value: new Date(2026, 2, 4), type: Date, format: 'yyyy-mm-dd' },
            { value: 'Fuel' },
            { value: 750 },
            { value: 'Jojo Ramos' },
            { value: '' },
            { value: '' },
          ],
          [
            { value: '2026-03-05' },
            { value: 'Repair' },
            { value: 1200 },
            { value: '' },
            { value: 'Tricycle' },
            { value: '' },
          ],
        ],
        sheet: 'Expenses',
        columns: Array.from({ length: 6 }, () => ({ width: 16 })),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    ]).toBlob()

    await user.click(screen.getByRole('button', { name: 'Import Excel' }))
    await screen.findByRole('dialog', { name: 'Import expenses' })
    await user.upload(
      screen.getByLabelText('Expense Excel file'),
      new File([blob], 'expenses.xlsx'),
    )

    expect(await screen.findByText('Imported summary by date')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Export summary' }))
    await __awaitSwal('Summary exported.')
  })
})
