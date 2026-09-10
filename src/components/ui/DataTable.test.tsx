import { screen } from '@testing-library/react'
import { DataTable } from '@/components/ui/DataTable'
import { renderWithProviders } from '../../test/render'

const columns = [
  { key: 'item', header: 'Item' },
  { key: 'quantity', header: 'Quantity' },
]

describe('DataTable', () => {
  it('renders the caption, headers, and row values', () => {
    renderWithProviders(
      <DataTable
        caption="Current stock"
        columns={columns}
        rows={[
          { item: 'Rice 25kg', quantity: '10' },
          { item: 'Sugar 1kg', quantity: '4' },
        ]}
      />,
    )
    expect(screen.getByText('Current stock')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Item' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Rice 25kg' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: '4' })).toBeInTheDocument()
  })

  it('renders an empty state when there are no rows', () => {
    renderWithProviders(
      <DataTable
        caption="Current stock"
        columns={columns}
        rows={[]}
        emptyMessage="No stock yet."
      />,
    )
    expect(screen.getByText('No stock yet.')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
