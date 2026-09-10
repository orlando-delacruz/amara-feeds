import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/Button'
import { renderWithProviders } from '../../test/render'

describe('Button', () => {
  it('renders its label and fires onClick', async () => {
    const user = userEvent.setup()
    let clicks = 0
    renderWithProviders(<Button onClick={() => clicks++}>Save sale</Button>)
    await user.click(screen.getByRole('button', { name: 'Save sale' }))
    expect(clicks).toBe(1)
  })

  it('does not fire onClick while disabled', async () => {
    const user = userEvent.setup()
    let clicks = 0
    renderWithProviders(
      <Button disabled onClick={() => clicks++}>
        Save sale
      </Button>,
    )
    await user.click(screen.getByRole('button', { name: 'Save sale' }))
    expect(clicks).toBe(0)
  })
})
