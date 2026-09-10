import { screen } from '@testing-library/react'
import { StoreBadge } from '@/components/ui/StoreBadge'
import { renderWithProviders } from '../../test/render'

describe('StoreBadge', () => {
  it('shows the Amara store name with its context label', () => {
    renderWithProviders(<StoreBadge store="amara" />)
    expect(screen.getByLabelText('Current store: Amara')).toHaveTextContent('Amara')
  })

  it('shows the Zeann store name with its context label', () => {
    renderWithProviders(<StoreBadge store="zeann" />)
    expect(screen.getByLabelText('Current store: Zeann')).toHaveTextContent('Zeann')
  })
})
