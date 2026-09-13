import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { DatePicker } from './DatePicker'
import { todayIso } from '@/lib/dates'

function Harness({ initial = todayIso() }: { initial?: string }) {
  const [value, setValue] = useState(initial)
  return <DatePicker id="date" label="Date" value={value} onChange={setValue} />
}

describe('DatePicker', () => {
  it('opens a modern calendar and picks a day', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness />)

    await user.click(screen.getByRole('button', { name: /Select a date|20/ }))
    expect(screen.getByRole('dialog', { name: 'Date calendar' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next month' }))
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Previous month' }))
    const days = screen.getAllByRole('gridcell')
    await user.click(days[14])
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('jumps back to today', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness initial="2026-01-05" />)

    await user.click(screen.getByRole('button', { name: /Jan/ }))
    await user.click(screen.getByRole('button', { name: 'Today' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes on Escape', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness />)

    await user.click(screen.getByRole('button', { name: /Select a date|20/ }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
