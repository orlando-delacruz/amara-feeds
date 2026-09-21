import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { TextField } from './TextField'

describe('TextField password reveal', () => {
  it('masks by default and reveals on toggle', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TextField id="pw" label="Password" type="password" />)

    const input = screen.getByLabelText('Password')
    expect(input).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(input).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await user.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(input).toHaveAttribute('type', 'password')
  })

  it('renders no toggle for other input types', () => {
    renderWithProviders(<TextField id="name" label="Name" />)
    expect(screen.queryByRole('button', { name: /password/ })).not.toBeInTheDocument()
  })
})
