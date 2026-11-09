import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { RecordList } from '@/components/ui/RecordList'
import { renderWithProviders } from '@/test/render'

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'value', header: 'Value' },
]

function makeRows(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `row-${index + 1}`,
    name: `Row ${index + 1}`,
    value: String(index + 1),
  }))
}

describe('RecordList pagination', () => {
  it('shows at most ten rows with page controls', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RecordList caption="Items" columns={columns} rows={makeRows(23)} />)

    expect(screen.getByText('Row 1')).toBeInTheDocument()
    expect(screen.getByText('Row 10')).toBeInTheDocument()
    expect(screen.queryByText('Row 11')).not.toBeInTheDocument()
    expect(screen.getByText('Showing 1–10 of 23')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next page' }))
    expect(screen.getByText('Row 11')).toBeInTheDocument()
    expect(screen.queryByText('Row 1')).not.toBeInTheDocument()
    expect(screen.getByText('Showing 11–20 of 23')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next page' }))
    expect(screen.getByText('Row 23')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Previous page' }))
    expect(screen.getByText('Row 11')).toBeInTheDocument()
  })

  it('hides page controls when there are ten or fewer rows', () => {
    renderWithProviders(<RecordList caption="Items" columns={columns} rows={makeRows(10)} />)
    expect(screen.getByText('Row 10')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Items pagination' })).not.toBeInTheDocument()
  })

  it('resets to the first page when the reset key changes', async () => {
    const user = userEvent.setup()
    const { rerender } = renderWithProviders(
      <RecordList caption="Items" columns={columns} rows={makeRows(23)} resetKey="a" />,
    )
    await user.click(screen.getByRole('button', { name: 'Next page' }))
    expect(screen.getByText('Row 11')).toBeInTheDocument()

    rerender(<RecordList caption="Items" columns={columns} rows={makeRows(5)} resetKey="b" />)
    expect(screen.getByText('Row 1')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Items pagination' })).not.toBeInTheDocument()
  })

  it('passes the absolute row index to renderCard on narrow viewports', async () => {
    const matchMedia = window.matchMedia
    window.matchMedia = (() => ({
      matches: false,
      media: '',
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia
    try {
      const user = userEvent.setup()
      const seen: number[] = []
      renderWithProviders(
        <RecordList
          caption="Items"
          columns={columns}
          rows={makeRows(12)}
          renderCard={(_row, index) => {
            seen.push(index)
            return <span>{_row.name}</span>
          }}
        />,
      )
      await user.click(screen.getByRole('button', { name: 'Next page' }))
      // Page two renders rows 11–12 with their absolute indexes.
      expect(seen.slice(-2)).toEqual([10, 11])
      expect(screen.getByText('Row 11')).toBeInTheDocument()
    } finally {
      window.matchMedia = matchMedia
    }
  })
})
