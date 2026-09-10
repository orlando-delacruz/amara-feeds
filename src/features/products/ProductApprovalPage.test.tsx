import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { resetDb } from '@/services/mocks/db'
import { renderWithProviders } from '@/test/render'
import type { User } from '@/domain'
import { ProductApprovalPage } from './ProductApprovalPage'

const adminUser: User = { id: 'user-3', name: 'Owner', role: 'admin' }

describe('ProductApprovalPage', () => {
  beforeEach(() => resetDb())

  it('lists only pending products', async () => {
    renderWithProviders(<ProductApprovalPage />, { user: adminUser })
    expect(await screen.findByText('Cooking Oil 1L')).toBeInTheDocument()
    expect(screen.queryByText('Rice 25kg')).not.toBeInTheDocument()
  })

  it('approves a pending product', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ProductApprovalPage />, { user: adminUser })
    await screen.findByText('Cooking Oil 1L')

    await user.click(screen.getByRole('button', { name: 'Approve' }))
    const dialog = await screen.findByRole('dialog', { name: 'Approve product' })
    await user.click(within(dialog).getByRole('button', { name: 'Approve' }))

    expect(await screen.findByText('Cooking Oil 1L is now active.')).toBeInTheDocument()
    expect(await screen.findByText('No products awaiting approval')).toBeInTheDocument()
  })
})
